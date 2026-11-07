/* Phím & Phím — Trang “Luyện tập”: luyện tai, đố nốt trên cần đàn, nhạc lý nhanh. */
(function () {
  'use strict';
  const { h, $, $$, T, S } = App;

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Bài hát giúp nhớ quãng đi lên
  const IV_SONGS = {
    1: 'Nhạc phim Jaws (hai nốt đầu)',
    2: 'Happy Birthday (từ “py” lên “birth”)',
    3: 'Greensleeves (hai nốt đầu)',
    4: 'When the Saints Go Marching In (hai nốt đầu)',
    5: 'Here Comes the Bride (hai nốt đầu)',
    6: 'Nhạc hiệu The Simpsons (hai nốt đầu)',
    7: 'Twinkle Twinkle Little Star (từ “twin-kle” thứ nhất sang thứ hai)',
    9: 'My Bonnie Lies Over the Ocean (“My Bon-”)',
    10: 'Somewhere trong West Side Story (“There’s a”)',
    12: 'Somewhere Over the Rainbow (“Some-where”)'
  };
  const QUIZ_CHORDS = ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4', '7', 'maj7', 'm7', 'm7b5', 'dim7'];
  const PC_NAMES = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const PC_SOLF = ['Đô', 'Đô♯/Rê♭', 'Rê', 'Rê♯/Mi♭', 'Mi', 'Fa', 'Fa♯/Sol♭', 'Sol', 'Sol♯/La♭', 'La', 'La♯/Si♭', 'Si'];

  const V = App.views.train = {
    q: null,
    mount() {
      this.modeSeg = App.seg($('#t-mode'), [['interval', 'Nghe quãng'], ['chord', 'Nghe hợp âm'], ['fret', 'Nốt trên cần đàn'], ['theory', 'Nhạc lý nhanh']],
        () => S.train.mode, v => { S.train.mode = v; this.q = null; this.render(); App.save(); }, 'Bài luyện');
      $('#t-next').addEventListener('click', () => { this.q = null; this.render(); });
      $('#t-replay').addEventListener('click', () => { if (this.q && this.q.play) this.q.play(); });
      $('#t-reset').addEventListener('click', () => { S.train.stats[S.train.mode] = { c: 0, t: 0, streak: 0, best: 0 }; this.renderStats(); App.save(); });
    },
    leave() { Sound.stopGroup('free'); },

    stats() {
      const m = S.train.mode;
      if (!S.train.stats[m]) S.train.stats[m] = { c: 0, t: 0, streak: 0, best: 0 };
      return S.train.stats[m];
    },

    /* ---------- tạo câu hỏi ---------- */
    make(mode) {
      if (mode === 'interval') {
        const set = S.train.ivSet.length >= 2 ? S.train.ivSet : [3, 4];
        const semis = pick(set);
        const dir = S.train.ivDir === 'mix' ? pick(['up', 'down', 'harm']) : S.train.ivDir;
        const low = rand(52, 64);
        const a = dir === 'down' ? low + semis : low, b = dir === 'down' ? low : low + semis;
        const play = () => dir === 'harm'
          ? Sound.chord([a, b], { instrument: 'piano', style: 'block', dur: 1.8 })
          : Sound.sequence([a, b], { instrument: 'piano', step: 0.75 });
        return {
          prompt: 'Nghe hai nốt ' + (dir === 'up' ? 'đi lên' : dir === 'down' ? 'đi xuống' : 'vang cùng lúc') + '. Đó là quãng gì?',
          options: set.slice().sort((x, y) => x - y), answer: semis, label: s => T.SEMI_NAMES[s], play,
          explain: () => T.SEMI_NAMES[semis] + ' = ' + semis + ' nửa cung (' + T.letterName(T.fromPc(Math.min(a, b))) + ' – ' + T.letterName(T.fromPc(Math.max(a, b))) + ').' + (IV_SONGS[semis] ? ' Mẹo nhớ khi đi lên: ' + IV_SONGS[semis] + '.' : '')
        };
      }
      if (mode === 'chord') {
        const set = S.train.chordSet.length >= 2 ? S.train.chordSet : ['maj', 'min'];
        const type = pick(set);
        const root = T.fromPc(rand(0, 11), 'common');
        const midis = T.closeVoicing(root, type, 0).map(x => x.midi);
        const play = () => Sound.chord(midis, { instrument: 'piano', style: 'block', dur: 2 });
        return {
          prompt: 'Nghe hợp âm. Đó là loại hợp âm nào?',
          options: set, answer: type, label: id => T.CHORD[id].name + (T.CHORD[id].sym ? ' (' + T.CHORD[id].sym + ')' : ''), play,
          extra: () => Sound.chord(midis, { instrument: 'piano', style: 'arp' }),
          explain: () => 'Đó là ' + T.chordSymbol(root, type) + '. ' + T.CHORD[type].desc
        };
      }
      if (mode === 'fret') {
        const t = App.tuning();
        let s, f, p, guard = 0;
        do {
          s = rand(0, t.midis.length - 1);
          f = rand(0, S.train.fretMax);
          p = (t.midis[s] + f) % 12;
          guard++;
        } while (S.train.fretNatural && [1, 3, 6, 8, 10].includes(p) && guard < 50);
        const names = S.settings.naming === 'solfege' ? PC_SOLF : PC_NAMES;
        return {
          prompt: 'Nốt ở dây ' + (t.midis.length - s) + ', phím ' + f + ' là nốt gì?',
          options: S.train.fretNatural ? [0, 2, 4, 5, 7, 9, 11] : [...Array(12).keys()], answer: p, label: x => names[x],
          board: { s, f }, play: () => Sound.note(t.midis[s] + f, { instrument: 'guitar' }), silent: true,
          explain: () => 'Dây ' + (t.midis.length - s) + ' (' + t.names[s] + ') phím ' + f + ' là ' + names[p] + '.'
        };
      }
      return this.theoryQuestion();
    },

    theoryQuestion() {
      const kinds = ['degree', 'keysig', 'scaleNote', 'chordNotes', 'interval', 'relative'];
      const kind = pick(kinds);
      const majors = T.MAJOR_KEYS.slice(0, 12);
      const L = n => T.letterName(n);
      const mk = (prompt, correct, distract, explain) => {
        const uniq = [...new Set(distract.filter(d => d !== correct))];
        return { prompt, options: shuffle([correct].concat(shuffle(uniq).slice(0, 3))), answer: correct, label: x => x, explain: () => explain, silent: true };
      };
      if (kind === 'degree') {
        const key = pick(majors);
        const dia = T.diatonicChords(key, 'major', false);
        const k = rand(1, 6);
        const d = dia[k];
        const right = T.chordSymbol(d.root, d.typeId);
        return mk('Hợp âm bậc ' + d.roman + ' trong giọng ' + L(key) + ' trưởng là gì?', right,
          dia.map(x => T.chordSymbol(x.root, x.typeId)),
          'Trong ' + L(key) + ' trưởng: ' + dia.map(x => x.roman + ' = ' + T.chordSymbol(x.root, x.typeId)).join(', ') + '.');
      }
      if (kind === 'keysig') {
        const key = pick(majors);
        const ks = T.keySignature(T.scaleTones(key, 'major').map(t => t.note));
        const all = ['Không dấu', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯', '1♭', '2♭', '3♭', '4♭', '5♭', '6♭'];
        const list = ks.sharps.concat(ks.flats).map(L).join(', ');
        return mk('Giọng ' + L(key) + ' trưởng có hóa biểu thế nào?', ks.text, all,
          L(key) + ' trưởng: ' + ks.text + (list ? ' (' + list + ')' : '') + '.');
      }
      if (kind === 'scaleNote') {
        const mode = pick(['major', 'minor']);
        const key = mode === 'major' ? pick(majors) : pick(T.MINOR_KEYS);
        const tones = T.scaleTones(key, mode);
        const n = rand(2, 7);
        const right = L(tones[n - 1].note);
        const pool = tones.map(t => L(t.note)).concat([L(T.fromPc(tones[n - 1].pc + 1, 'sharp')), L(T.fromPc(tones[n - 1].pc - 1, 'flat'))]);
        return mk('Bậc ' + n + ' của âm giai ' + L(key) + (mode === 'major' ? ' trưởng' : ' thứ') + ' là nốt nào?', right, pool,
          L(key) + (mode === 'major' ? ' trưởng' : ' thứ') + ': ' + tones.map(t => L(t.note)).join(' ') + '.');
      }
      if (kind === 'chordNotes') {
        const type = pick(['maj', 'min', '7', 'maj7', 'm7', 'dim']);
        const root = T.fromPc(rand(0, 11), 'common');
        const tones = T.chordTones(root, type);
        const fmt = ns => ns.map(L).join(' – ');
        const right = fmt(tones.map(t => t.note));
        const others = ['maj', 'min', '7', 'maj7', 'm7', 'dim', 'aug', 'sus4']
          .filter(x => x !== type && T.CHORD[x].iv.length === tones.length)
          .map(x => fmt(T.chordTones(root, x).map(t => t.note)));
        const shifted = tones.map((t, i) => i === 1 ? T.fromPc(t.pc + 1, 'sharp') : t.note);
        others.push(fmt(shifted));
        return mk('Hợp âm ' + T.chordSymbol(root, type) + ' gồm những nốt nào?', right, others,
          T.chordSymbol(root, type) + ' = ' + tones.map(t => T.ivText(t.iv)).join(' – ') + ' tính từ ' + L(root) + ': ' + right + '.');
      }
      if (kind === 'interval') {
        const ivs = ['b2', '2', 'b3', '3', '4', '5', 'b6', '6', 'b7', '7'];
        const s = pick(ivs);
        const root = T.fromPc(rand(0, 11), 'common');
        const top = T.transpose(root, s);
        const name = s2 => T.ivName(s2).replace('Quãng ', '');
        return mk('Từ ' + L(root) + ' đi lên ' + L(top) + ' là quãng gì?', name(s), ivs.map(name),
          L(root) + ' – ' + L(top) + ' cách nhau ' + T.iv(s).semis + ' nửa cung: ' + T.ivName(s).toLowerCase() + '.');
      }
      const key = pick(majors);
      const rel = T.transpose(key, '6');
      const pool = [T.transpose(key, '2'), T.transpose(key, '3'), T.transpose(key, '5'), key, T.transpose(key, '4')].map(n => L(n) + ' thứ');
      return mk('Giọng thứ song song (cùng hóa biểu) của ' + L(key) + ' trưởng là?', L(rel) + ' thứ', pool,
        'Giọng thứ song song bắt đầu từ bậc 6: ' + L(key) + ' trưởng ↔ ' + L(rel) + ' thứ.');
    },

    /* ---------- vẽ ---------- */
    renderSettings() {
      const box = $('#t-settings');
      box.innerHTML = '';
      const mode = S.train.mode;
      if (mode === 'interval') {
        const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Các quãng được hỏi' });
        for (let s = 1; s <= 12; s++) {
          const on = S.train.ivSet.includes(s);
          chips.appendChild(h('button', {
            type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
            onclick: () => {
              const i = S.train.ivSet.indexOf(s);
              if (i >= 0 && S.train.ivSet.length > 2) S.train.ivSet.splice(i, 1);
              else if (i < 0) S.train.ivSet.push(s);
              this.q = null; this.render(); App.save();
            }
          }, T.SEMI_NAMES[s]));
        }
        const dirEl = h('div');
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Các quãng được hỏi (chọn ít nhất 2)'), chips));
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Cách phát'), dirEl));
        App.seg(dirEl, [['up', 'Đi lên'], ['down', 'Đi xuống'], ['harm', 'Cùng lúc'], ['mix', 'Ngẫu nhiên']], () => S.train.ivDir, v => { S.train.ivDir = v; this.q = null; this.render(); App.save(); }, 'Cách phát');
      } else if (mode === 'chord') {
        const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Các loại hợp âm được hỏi' });
        QUIZ_CHORDS.forEach(id => {
          const on = S.train.chordSet.includes(id);
          chips.appendChild(h('button', {
            type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
            onclick: () => {
              const i = S.train.chordSet.indexOf(id);
              if (i >= 0 && S.train.chordSet.length > 2) S.train.chordSet.splice(i, 1);
              else if (i < 0) S.train.chordSet.push(id);
              this.q = null; this.render(); App.save();
            }
          }, T.CHORD[id].name));
        });
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Các loại hợp âm được hỏi (chọn ít nhất 2)'), chips));
      } else if (mode === 'fret') {
        const rangeEl = h('div');
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Vùng phím'), rangeEl));
        App.seg(rangeEl, [['5', 'Phím 0–5'], ['12', 'Phím 0–12'], ['15', 'Phím 0–15']], () => String(S.train.fretMax), v => { S.train.fretMax = +v; this.q = null; this.render(); App.save(); }, 'Vùng phím');
        const cb = h('input', { type: 'checkbox', checked: S.train.fretNatural, onchange: e => { S.train.fretNatural = e.target.checked; this.q = null; this.render(); App.save(); } });
        box.appendChild(h('label', { class: 'check' }, cb, 'Chỉ hỏi nốt tự nhiên'));
      } else {
        box.appendChild(h('p', { class: 'hint' }, 'Câu hỏi ngẫu nhiên về hợp âm thuận, hóa biểu, bậc của âm giai, thành phần hợp âm, quãng và giọng song song.'));
      }
    },

    renderStats() {
      const st = this.stats();
      const box = $('#t-stats');
      box.innerHTML = '';
      const pct = st.t ? Math.round(st.c / st.t * 100) + '%' : '–';
      [['Đúng', st.c + '/' + st.t], ['Tỉ lệ', pct], ['Chuỗi đúng', st.streak], ['Kỷ lục', st.best]].forEach(([k, v]) =>
        box.appendChild(h('div', { class: 'stat' }, h('span', { class: 'stat-v' }, String(v)), h('span', { class: 'stat-k' }, k))));
    },

    render() {
      this.dirty = false;
      this.modeSeg.update();
      this.renderSettings();
      this.renderStats();
      if (!this.q) { this.q = this.make(S.train.mode); this.q.done = false; if (!this.q.silent) setTimeout(() => this.q && this.q.play(), 250); }
      const q = this.q;
      $('#t-prompt').textContent = q.prompt;
      $('#t-replay').hidden = !!q.silent;
      const ex = $('#t-extra');
      ex.innerHTML = '';
      if (q.extra) ex.appendChild(App.btn('Nghe rải', 'arp', () => q.extra(), 'ghost sm'));
      const boardBox = $('#t-board');
      boardBox.innerHTML = '';
      boardBox.hidden = !q.board;
      if (q.board) {
        App.board(boardBox, {
          frets: Math.max(5, Math.min(S.settings.frets, S.train.fretMax + 2)),
          marks: [{ s: q.board.s, f: q.board.f, label: '?', fam: 'ext', strong: true }],
          aria: 'Câu đố: nốt được đánh dấu'
        });
      }
      const box = $('#t-answers');
      box.innerHTML = '';
      q.options.forEach(opt => box.appendChild(h('button', {
        type: 'button', class: 'answer', 'data-v': String(opt),
        onclick: e => this.answer(opt, e.currentTarget)
      }, q.label(opt))));
      $('#t-feedback').textContent = '';
      $('#t-feedback').className = 'feedback';
      $('#t-next').hidden = true;
    },

    answer(opt, btn) {
      const q = this.q;
      if (!q || q.done) return;
      q.done = true;
      const ok = opt === q.answer;
      const st = this.stats();
      st.t++;
      if (ok) { st.c++; st.streak++; st.best = Math.max(st.best, st.streak); } else st.streak = 0;
      App.save();
      $$('#t-answers .answer').forEach(b => {
        b.disabled = true;
        if (b.dataset.v === String(q.answer)) b.classList.add('right');
      });
      if (!ok) btn.classList.add('wrong');
      const fb = $('#t-feedback');
      fb.className = 'feedback ' + (ok ? 'ok' : 'no');
      fb.textContent = (ok ? 'Chính xác. ' : 'Chưa đúng. Đáp án: ' + q.label(q.answer) + '. ') + q.explain();
      if (q.board) {
        const t = App.tuning();
        const m = t.midis[q.board.s] + q.board.f;
        App.board($('#t-board'), {
          frets: Math.max(5, Math.min(S.settings.frets, S.train.fretMax + 2)),
          marks: [{ s: q.board.s, f: q.board.f, label: App.nn(T.fromPc(m, 'common')), fam: ok ? 'seventh' : 'root', strong: true }],
          aria: 'Đáp án trên cần đàn'
        });
        q.play();
      } else if (!ok && q.play) setTimeout(() => q.play(), 300);
      this.renderStats();
      const next = $('#t-next');
      next.hidden = false;
      next.focus();
    }
  };
})();
