/* Phím & Phím — js/app.js
 * Lõi giao diện: trạng thái (lưu bằng localStorage), dây đàn, các thành phần dùng chung,
 * điều hướng giữa các trang và bảng cài đặt. Các trang nằm trong js/views/.
 */
(function (global) {
  'use strict';

  const T = global.Theory;
  const App = global.App = { views: {} };

  /* ---------------- DOM ---------------- */
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v === undefined || v === null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k === 'html') e.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else if (k === 'dataset') Object.assign(e.dataset, v);
        else if (v === true) e.setAttribute(k, '');
        else e.setAttribute(k, v);
      }
    }
    kids.flat(3).forEach(c => {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    });
    return e;
  }
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  /* ---------------- Trạng thái ---------------- */
  const KEY = 'phim-va-phim:v1';
  const DEFAULTS = {
    settings: { naming: 'letter', instrument: 'guitar', volume: 0.8, tuning: 'standard', frets: 15, leftHanded: false, theme: 'auto' },
    chord: { root: 'C', type: 'maj', bass: '', label: 'note', voicing: 0, inv: 0 },
    scale: { root: 'A', type: 'minPent', label: 'note', pos: 0, sev: false, focus: null },
    prog: {
      key: 'C', mode: 'major', bpm: 90, loop: true, style: 'rhythm', sev: false, capo: 0, click: false, sel: null,
      items: [{ iv: '1', type: 'maj', beats: 4 }, { iv: '5', type: 'maj', beats: 4 }, { iv: '6', type: 'min', beats: 4 }, { iv: '4', type: 'maj', beats: 4 }],
      saved: []
    },
    ident: { input: 'piano', notes: [], frets: null },
    circle: { i: 0, mode: 'major' },
    fret: { mode: 'all', note: 'C', ref: { s: 0, f: 3 } },
    train: { mode: 'interval', ivSet: [2, 3, 4, 5, 7, 12], ivDir: 'up', chordSet: ['maj', 'min', 'dim', 'aug'], fretMax: 12, fretNatural: true, stats: {} },
    metro: { bpm: 80, sig: '4/4', sub: 1, accent: true, trainer: false, step: 5, bars: 4, max: 140 },
    tuner: { a4: 440 },
    road: {}
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  function merge(base, over) {
    if (!over || typeof over !== 'object') return base;
    for (const k in over) {
      if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && over[k] && typeof over[k] === 'object' && !Array.isArray(over[k])) merge(base[k], over[k]);
      else if (k in base) base[k] = over[k];
    }
    return base;
  }
  function load() {
    let s = clone(DEFAULTS);
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) s = merge(s, JSON.parse(raw));
    } catch (e) { /* bộ nhớ trình duyệt không dùng được: chạy với mặc định */ }
    // Kiểm tra dữ liệu cũ/hỏng
    const okRoot = r => !!T.parseNote(r);
    if (!okRoot(s.chord.root)) s.chord.root = 'C';
    if (!T.CHORD[s.chord.type]) s.chord.type = 'maj';
    if (!okRoot(s.scale.root)) s.scale.root = 'A';
    if (!T.SCALE[s.scale.type]) s.scale.type = 'minPent';
    if (!okRoot(s.prog.key)) s.prog.key = 'C';
    s.prog.items = (s.prog.items || []).filter(it => it && T.CHORD[it.type] && /^(bb|b|##|#)?\d+$/.test(it.iv));
    if (!Array.isArray(s.prog.saved)) s.prog.saved = [];
    return s;
  }
  const S = App.S = load();
  let saveTimer = null;
  App.save = function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ }
    }, 250);
  };
  App.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
    location.reload();
  };

  /* ---------------- Dây đàn ---------------- */
  const TUNINGS = {
    standard: { name: 'Chuẩn (E A D G B E)', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    dropD: { name: 'Drop D (D A D G B E)', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    halfDown: { name: 'Hạ nửa cung (E♭ A♭ D♭ G♭ B♭ E♭)', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
    openG: { name: 'Open G (D G D G B D)', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
    openD: { name: 'Open D (D A D F♯ A D)', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
    dadgad: { name: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
    ukulele: { name: 'Ukulele (G C E A)', notes: ['G4', 'C4', 'E4', 'A4'], reentrant: true },
    bass4: { name: 'Bass 4 dây (E A D G)', notes: ['E1', 'A1', 'D2', 'G2'], bass: true }
  };
  Object.keys(TUNINGS).forEach(id => {
    const t = TUNINGS[id];
    const ps = t.notes.map(T.parsePitch);
    t.id = id;
    t.midis = ps.map(p => p.midi);
    t.names = ps.map(p => T.letterName(p.note));
    t.pitches = ps.map(p => T.letterName(p.note) + T.octaveOf(p.midi));
  });
  App.TUNINGS = TUNINGS;
  App.tuning = () => TUNINGS[S.settings.tuning] || TUNINGS.standard;

  /* ---------------- Tiện ích nhạc lý cho giao diện ---------------- */
  App.ROOTS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
  App.nn = n => T.name(n, S.settings.naming);
  App.FAM_NAMES = {
    root: 'Nốt gốc', third: 'Quãng 3', fifth: 'Quãng 5', seventh: 'Quãng 7', ext: 'Nốt khác (2/9, 4/11, 6/13)'
  };

  /** Nhãn cho một nốt thuộc hợp âm/âm giai. mode: 'note' | 'interval' | 'degree' */
  App.toneLabel = (tone, mode) => mode === 'interval' ? T.ivShort(tone.iv) : mode === 'degree' ? String(tone.degree) : App.nn(tone.note);

  /** Mọi vị trí trên cần đàn có nốt thuộc danh sách tones. */
  App.toneMarks = function (tones, mode, extra) {
    const t = App.tuning();
    const frets = S.settings.frets;
    const byPc = new Map(tones.map(x => [x.pc, x]));
    const out = [];
    t.midis.forEach((open, s) => {
      for (let f = 0; f <= frets; f++) {
        const tone = byPc.get((open + f) % 12);
        if (tone) out.push(Object.assign({ s, f, label: App.toneLabel(tone, mode), fam: tone.family, title: App.nn(tone.note) + ' — ' + T.ivName(tone.iv) }, extra || {}));
      }
    });
    return out;
  };

  App.board = function (container, opts) {
    const t = App.tuning();
    return global.Draw.fretboard(container, Object.assign({
      tuning: t.midis, frets: S.settings.frets, leftHanded: S.settings.leftHanded, stringNames: t.names
    }, opts));
  };

  const vcache = new Map();
  App.voicings = function (root, type, bassPc) {
    const t = App.tuning();
    if (t.bass) return [];
    const maxFret = Math.min(15, S.settings.frets);
    const key = [t.id, maxFret, T.id(root), type, bassPc === undefined ? '' : bassPc].join('|');
    if (!vcache.has(key)) {
      vcache.set(key, T.guitarVoicings(root, type, { tuning: t.midis, maxFret, bassPc, reentrant: t.reentrant, span: t.reentrant ? 4 : 3 }));
    }
    return vcache.get(key);
  };

  /** Thẻ sơ đồ thế bấm (SVG) với nhãn quãng dưới mỗi dây. */
  App.diagram = function (v, aria) {
    const fams = v.ivs.map(s => s ? T.ivFamily(s) : null);
    const bottom = v.ivs.map(s => s ? T.ivShort(s) : '');
    return global.Draw.chordDiagram(v, { fams, bottom, aria });
  };

  App.play = (midis, style) => global.Sound.chord(midis, { instrument: S.settings.instrument, style });
  App.playNote = m => global.Sound.note(m, { instrument: S.settings.instrument });

  /* ---------------- Biểu tượng ---------------- */
  const ICONS = {
    play: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><rect fill="currentColor" x="6" y="6" width="12" height="12" rx="2"/></svg>',
    arp: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 19h4v-5h4V9h4V5h4"/></svg>',
    download: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 4v11m-5-5 5 5 5-5M5 20h14"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></g></svg>',
    save: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6"/></svg>',
    left: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="m14.5 6-6 6 6 6"/></svg>',
    right: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="m9.5 6 6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M12 6v12M6 12h12"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M6 12h12"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m7 7 10 10M17 7 7 17"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></g></svg>',
    replay: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg>'
  };
  App.icon = name => h('span', { class: 'ic', 'aria-hidden': 'true', html: ICONS[name] || '' });
  App.btn = (label, iconName, onclick, cls, attrs) => h('button', Object.assign({ type: 'button', class: 'btn ' + (cls || ''), onclick }, attrs || {}), iconName ? App.icon(iconName) : null, label ? h('span', null, label) : null);

  /* ---------------- Thành phần dùng chung ---------------- */
  /** Nhóm nút chọn một (segmented). options: [[giá trị, nhãn, mô tả?]] */
  App.seg = function (container, options, get, set, aria) {
    container.innerHTML = '';
    container.classList.add('seg');
    container.setAttribute('role', 'radiogroup');
    if (aria) container.setAttribute('aria-label', aria);
    options.forEach(([v, label, title]) => {
      container.appendChild(h('button', {
        type: 'button', role: 'radio', 'data-v': String(v), title,
        onclick: () => { set(v); update(); }
      }, label));
    });
    function update() {
      $$('button', container).forEach(b => {
        const on = String(get()) === b.dataset.v;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    }
    update();
    return { update };
  };

  /** Bộ chọn nốt gốc dạng bàn phím mini (phím đen có hai cách viết ♯/♭). */
  App.rootPicker = function (container, get, set) {
    container.innerHTML = '';
    container.classList.add('rootpick');
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Chọn nốt');
    const WHITE = [['C', 0], ['D', 2], ['E', 4], ['F', 5], ['G', 7], ['A', 9], ['B', 11]];
    const BLACK = [[1, 1, 'C#', 'Db'], [2, 3, 'D#', 'Eb'], [4, 6, 'F#', 'Gb'], [5, 8, 'G#', 'Ab'], [6, 10, 'A#', 'Bb']];
    const DEFAULT_BLACK = { 1: 'C#', 3: 'Eb', 6: 'F#', 8: 'Ab', 10: 'Bb' };
    WHITE.forEach(([n, p]) => container.appendChild(
      h('button', { type: 'button', class: 'rp-w', 'data-pc': p, 'data-id': n, 'aria-label': 'Nốt ' + n }, h('span', null, n))
    ));
    BLACK.forEach(([i, p, sh, fl]) => container.appendChild(
      h('button', { type: 'button', class: 'rp-b', style: '--i:' + i, 'data-pc': p, 'aria-label': 'Nốt ' + T.letterName(T.parseNote(sh)) + ' hoặc ' + T.letterName(T.parseNote(fl)) },
        h('span', { 'data-id': sh }, T.letterName(T.parseNote(sh))),
        h('span', { 'data-id': fl }, T.letterName(T.parseNote(fl))))
    ));
    container.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const p = +b.dataset.pc;
      if (b.classList.contains('rp-w')) { set(b.dataset.id); update(); return; }
      const span = e.target.closest('span[data-id]');
      const cur = T.parseNote(get());
      if (span && T.pc(cur) === p) set(span.dataset.id === get() ? (span.nextSibling || span.previousSibling).dataset.id : span.dataset.id);
      else if (span) set(span.dataset.id);
      else set(DEFAULT_BLACK[p]);
      update();
    });
    function update() {
      const cur = get();
      const p = T.pc(T.parseNote(cur));
      $$('button', container).forEach(b => {
        const on = +b.dataset.pc === p;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      $$('span[data-id]', container).forEach(s => s.classList.toggle('on', s.dataset.id === cur));
    }
    update();
    return { update };
  };

  App.fillRootSelect = function (sel, value, list) {
    sel.innerHTML = '';
    (list || App.ROOTS).forEach(r => sel.appendChild(h('option', { value: r, selected: r === value }, T.letterName(T.parseNote(r)))));
  };

  App.legend = function (container, fams) {
    container.innerHTML = '';
    fams.forEach(f => container.appendChild(h('span', { class: 'lg fam-' + f }, h('i', { 'aria-hidden': 'true' }), App.FAM_NAMES[f])));
  };

  /** Thẻ nốt: quãng ở trên, tên nốt ở dưới, bấm để nghe. */
  App.toneChip = function (tone, midi, small) {
    return h('button', {
      type: 'button', class: 'tone fam-' + tone.family + (small ? ' small' : ''), title: T.ivName(tone.iv),
      onclick: () => App.playNote(midi)
    }, h('span', { class: 'tone-iv' }, T.ivText(tone.iv)), h('span', { class: 'tone-n' }, App.nn(tone.note)));
  };

  let toastTimer = null;
  App.toast = function (msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  };

  App.copy = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      const ta = h('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  };

  /* ---------------- Điều hướng ---------------- */
  const ROUTES = {
    'hop-am': 'chord', 'am-giai': 'scale', 'vong-hop-am': 'prog', 'nhan-dien': 'ident',
    'vong-quang-5': 'circle', 'can-dan': 'fret', 'luyen-tap': 'train', 'cong-cu': 'tools', 'bai-hoc': 'learn'
  };
  const SLUG = {};
  Object.keys(ROUTES).forEach(k => { SLUG[ROUTES[k]] = k; });
  App.current = null;

  function route() {
    const slug = (location.hash || '').replace('#', '');
    const view = ROUTES[slug] || 'chord';
    show(view);
  }
  function show(view) {
    if (App.current && App.current !== view) {
      const prev = App.views[App.current];
      if (prev && prev.leave) prev.leave();
    }
    App.current = view;
    $$('.view').forEach(v => { v.hidden = v.id !== 'view-' + view; });
    $$('#rail a').forEach(a => {
      const on = a.dataset.view === view;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    const V = App.views[view];
    if (V) {
      if (!V.mounted) { V.mount(); V.mounted = true; }
      V.render();
    }
    const link = $('#rail a.on');
    if (link && link.scrollIntoView && window.matchMedia('(max-width: 860px)').matches) {
      link.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }
  /** Chuyển trang, có thể kèm hàm cập nhật trạng thái trước khi hiển thị. */
  App.go = function (view, prep) {
    if (prep) prep(S);
    App.save();
    const slug = SLUG[view];
    if (location.hash === '#' + slug) show(view);
    else location.hash = slug;
  };
  /** Vẽ lại các trang phụ thuộc cài đặt (dây đàn, tên nốt…). */
  App.refresh = function () {
    Object.values(App.views).forEach(V => { V.dirty = true; });
    if (App.current && App.views[App.current]) App.views[App.current].render();
  };

  /* ---------------- Giao diện sáng/tối ---------------- */
  function applyTheme() {
    const t = S.settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
    else document.documentElement.removeAttribute('data-theme');
  }

  /* ---------------- Cài đặt ---------------- */
  function initSettings() {
    const sheet = $('#settings'), bd = $('#sheet-bd');
    const open = () => {
      sheet.hidden = false; bd.hidden = false;
      requestAnimationFrame(() => { sheet.classList.add('open'); bd.classList.add('open'); });
      $('#close-settings').focus();
    };
    const close = () => {
      sheet.classList.remove('open'); bd.classList.remove('open');
      setTimeout(() => { sheet.hidden = true; bd.hidden = true; }, 200);
      $('#open-settings').focus();
    };
    $('#open-settings').addEventListener('click', open);
    $('#close-settings').addEventListener('click', close);
    bd.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) close(); });

    const st = S.settings;
    App.seg($('#set-naming'), [['letter', 'C D E'], ['solfege', 'Đô Rê Mi']], () => st.naming, v => { st.naming = v; App.save(); App.refresh(); }, 'Tên nốt');
    App.seg($('#set-inst'), [['guitar', 'Guitar'], ['piano', 'Piano']], () => st.instrument, v => { st.instrument = v; global.Sound.instrument = v; App.save(); App.refresh(); }, 'Âm thanh');
    App.seg($('#set-theme'), [['auto', 'Theo máy'], ['light', 'Sáng'], ['dark', 'Tối']], () => st.theme, v => { st.theme = v; applyTheme(); App.save(); }, 'Giao diện');
    const vol = $('#set-volume');
    vol.value = Math.round(st.volume * 100);
    vol.addEventListener('input', () => { st.volume = vol.value / 100; global.Sound.setVolume(st.volume); App.save(); });
    const tun = $('#set-tuning');
    Object.values(TUNINGS).forEach(t => tun.appendChild(h('option', { value: t.id, selected: t.id === st.tuning }, t.name)));
    tun.addEventListener('change', () => { st.tuning = tun.value; App.save(); App.refresh(); });
    const fr = $('#set-frets');
    [12, 15, 17, 19, 22].forEach(n => fr.appendChild(h('option', { value: n, selected: n === st.frets }, n + ' phím')));
    fr.addEventListener('change', () => { st.frets = +fr.value; App.save(); App.refresh(); });
    const lh = $('#set-left');
    lh.checked = st.leftHanded;
    lh.addEventListener('change', () => { st.leftHanded = lh.checked; App.save(); App.refresh(); });
    $('#set-reset').addEventListener('click', () => {
      if (confirm('Xóa toàn bộ dữ liệu đã lưu (vòng hợp âm, lộ trình, điểm luyện tập, cài đặt)?')) App.reset();
    });
  }

  /* ---------------- Khởi động ---------------- */
  App.start = function () {
    applyTheme();
    global.Sound.instrument = S.settings.instrument;
    global.Sound.volume = S.settings.volume;
    T.naming = S.settings.naming;
    initSettings();
    window.addEventListener('hashchange', route);
    // Trình duyệt chỉ cho phát âm thanh sau thao tác đầu tiên của người dùng.
    const unlock = () => { global.Sound.ensure(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    route();
  };

  Object.assign(App, { h, $, $$, T });
})(window);
