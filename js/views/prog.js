/* Phím & Phím — Trang “Vòng hợp âm”: dựng vòng, nghe thử, capo, piano roll, xuất MIDI. */
(function () {
  'use strict';
  const { h, $, $$, T, S } = App;

  const MAJOR_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const MINOR_KEYS = ['C', 'C#', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const CHROMA = {
    major: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
    minor: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B']
  };
  const ENH = { 'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#', 'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#' };
  const EASY = new Set(['C', 'D', 'E', 'G', 'A', 'Am', 'Dm', 'Em', 'C7', 'D7', 'E7', 'G7', 'A7', 'B7',
    'Cmaj7', 'Dmaj7', 'Emaj7', 'Fmaj7', 'Gmaj7', 'Amaj7', 'Am7', 'Dm7', 'Em7', 'Bm7',
    'Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Esus4', 'Cadd9', 'A5', 'D5', 'E5']);

  function normKey(key, mode) {
    const list = mode === 'minor' ? MINOR_KEYS : MAJOR_KEYS;
    if (list.includes(key)) return key;
    if (ENH[key] && list.includes(ENH[key])) return ENH[key];
    return 'C';
  }
  /** Tránh tên thăng/giáng kép khó đọc (B♭♭ → A) cho hợp âm mượn. */
  function tidy(n, pref) { return Math.abs(n.a) >= 2 ? T.fromPc(T.pc(n), pref) : n; }

  const V = App.views.prog = {
    playingIndex: null,

    mount() {
      this.seq = new Sound.Sequencer();
      const keySel = $('#p-key');
      keySel.addEventListener('change', () => { S.prog.key = keySel.value; this.render(); App.save(); });
      this.modeSeg = App.seg($('#p-mode'), [['major', 'Trưởng'], ['minor', 'Thứ']], () => S.prog.mode, v => {
        if (v === S.prog.mode) return;
        this.setKey(S.prog.key, v);
        $('#p-preset').value = ''; $('#p-preset-note').textContent = '';
        this.render(); App.save();
      }, 'Trưởng hay thứ');
      $('#p-down').addEventListener('click', () => this.transpose(-1));
      $('#p-up').addEventListener('click', () => this.transpose(1));

      const pre = $('#p-preset');
      pre.appendChild(h('option', { value: '' }, 'Chọn một vòng mẫu…'));
      [['major', 'Giọng trưởng'], ['minor', 'Giọng thứ']].forEach(([mode, label]) => {
        const og = h('optgroup', { label });
        T.PRESETS.filter(p => p.mode === mode).forEach(p => og.appendChild(h('option', { value: p.id }, p.name)));
        pre.appendChild(og);
      });
      pre.addEventListener('change', () => this.loadPreset(pre.value));

      this.sevSeg = App.seg($('#p-sev'), [['false', 'Hợp âm ba'], ['true', 'Hợp âm bảy']], () => String(S.prog.sev), v => {
        S.prog.sev = v === 'true'; this.renderPalette(); App.save();
      }, 'Loại hợp âm thuận');

      App.fillRootSelect($('#p-c-root'), 'C');
      const ct = $('#p-c-type');
      T.CHORD_GROUPS.forEach(g => {
        const og = h('optgroup', { label: g });
        T.CHORDS.filter(c => c.group === g).forEach(c => og.appendChild(h('option', { value: c.id }, (c.sym ? c.sym + ' — ' : '') + c.name)));
        ct.appendChild(og);
      });
      $('#p-c-add').addEventListener('click', () => {
        const key = T.parseNote(S.prog.key);
        const root = T.parseNote($('#p-c-root').value);
        this.add({ iv: T.between(key, root), type: ct.value, beats: 4 });
      });

      $('#p-play').addEventListener('click', () => (this.seq.playing ? this.stop() : this.play()));
      const bpm = $('#p-bpm');
      bpm.addEventListener('change', () => { S.prog.bpm = Math.max(40, Math.min(220, +bpm.value || 90)); bpm.value = S.prog.bpm; App.save(); });
      $('#p-loop').addEventListener('change', e => { S.prog.loop = e.target.checked; App.save(); });
      $('#p-click').addEventListener('change', e => { S.prog.click = e.target.checked; App.save(); });
      this.styleSeg = App.seg($('#p-style'), [['block', 'Ngân'], ['rhythm', 'Theo nhịp'], ['arp', 'Rải']], () => S.prog.style, v => { S.prog.style = v; App.save(); }, 'Kiểu đệm');
      this.instSeg = App.seg($('#p-inst'), [['guitar', 'Guitar'], ['piano', 'Piano']], () => S.settings.instrument, v => {
        S.settings.instrument = v; Sound.instrument = v; App.save();
      }, 'Nhạc cụ');

      const capo = $('#p-capo');
      for (let c = 0; c <= 9; c++) capo.appendChild(h('option', { value: c }, c === 0 ? 'Không dùng capo' : 'Capo phím ' + c));
      capo.addEventListener('change', () => { S.prog.capo = +capo.value; this.renderCapo(); this.renderDiagrams(); App.save(); });

      $('#p-midi').addEventListener('click', () => this.midi());
      $('#p-copy').addEventListener('click', () => this.copyText());
      $('#p-save').addEventListener('click', () => this.saveCurrent());
      $('#p-name').addEventListener('keydown', e => { if (e.key === 'Enter') this.saveCurrent(); });
      let rt = null;
      window.addEventListener('resize', () => {
        clearTimeout(rt);
        rt = setTimeout(() => { if (App.current === 'prog') this.renderRoll(); }, 200);
      });
    },

    leave() { this.stop(); },

    /**
     * Đổi giọng. Khi đổi trưởng ↔ thứ, các hợp âm thuận được đổi sang hợp âm cùng bậc của giọng mới
     * (I → i, IV → iv…), còn hợp âm mượn và hợp âm át phụ giữ nguyên.
     */
    setKey(keyId, mode) {
      if (mode !== S.prog.mode && S.prog.items.length) S.prog.items = this.convertMode(S.prog.items, S.prog.mode, mode);
      S.prog.mode = mode;
      S.prog.key = normKey(keyId, mode);
    },
    convertMode(items, from, to) {
      const c = T.parseNote('C');
      const src = [T.diatonicChords(c, from, false), T.diatonicChords(c, from, true)];
      const dst = [T.diatonicChords(c, to, false), T.diatonicChords(c, to, true)];
      let changed = 0;
      const out = items.map(it => {
        for (let k = 0; k < 2; k++) {
          const i = src[k].findIndex(d => d.iv === it.iv && d.typeId === it.type);
          if (i >= 0) { changed++; return { iv: dst[k][i].iv, type: dst[k][i].typeId, beats: it.beats }; }
        }
        return Object.assign({}, it);
      });
      if (changed) App.toast('Đã đổi các hợp âm thuận sang giọng ' + (to === 'minor' ? 'thứ' : 'trưởng') + ' cùng tên.');
      return out;
    },

    /* ---------- dữ liệu ---------- */
    chords() {
      const key = T.parseNote(S.prog.key);
      const pref = T.keyPref(key, S.prog.mode);
      return S.prog.items.map(it => {
        const root = tidy(T.transpose(key, it.iv), pref);
        return { item: it, root, type: it.type, sym: T.chordSymbol(root, it.type), roman: T.romanFor(it.iv, it.type, S.prog.mode) };
      });
    },
    kbChain(chords) {
      let prev = null;
      return chords.map(c => { const v = T.keyboardVoicing(c.root, c.type, prev); prev = v.upper; return v; });
    },
    /** Thế bấm guitar cho cả vòng: ưu tiên thế tốt và ít phải di chuyển tay. Có capo thì tính theo thế bấm. */
    gtrChain(chords) {
      const capo = S.prog.capo;
      let prev = null;
      return chords.map(c => {
        const shapeRoot = capo ? T.fromPc(T.pc(c.root) - capo, 'common') : c.root;
        const vs = App.voicings(shapeRoot, c.type);
        if (!vs.length) return null;
        let best = vs[0], bs = -Infinity;
        vs.forEach(v => {
          const s = v.score - (prev === null ? v.minF * 0.4 : Math.abs(v.minF - prev) * 1.2);
          if (s > bs) { bs = s; best = v; }
        });
        prev = best.minF;
        return { v: best, shapeRoot, midis: best.midis.map(m => m + capo) };
      });
    },

    /* ---------- thao tác ---------- */
    add(item) {
      S.prog.items.push(item);
      S.prog.sel = S.prog.items.length - 1;
      $('#p-preset').value = '';
      $('#p-preset-note').textContent = '';
      this.render(); App.save();
      this.preview(S.prog.sel);
    },
    loadPreset(id) {
      const p = T.PRESETS.find(x => x.id === id);
      if (!p) return;
      S.prog.mode = p.mode;
      S.prog.key = normKey(S.prog.key, p.mode);
      S.prog.items = p.items.map(([iv, type]) => ({ iv, type, beats: 4 }));
      S.prog.sel = null;
      this.render(); App.save();
      $('#p-preset').value = id;
      $('#p-preset-note').textContent = p.note;
    },
    transpose(dir) {
      const list = CHROMA[S.prog.mode];
      const p = T.pc(T.parseNote(S.prog.key));
      S.prog.key = normKey(list[T.mod(p + dir, 12)], S.prog.mode);
      this.render(); App.save();
    },
    preview(i) {
      const chords = this.chords();
      if (!chords[i]) return;
      if (S.settings.instrument === 'guitar') {
        const g = this.gtrChain(chords)[i];
        if (g) { Sound.chord(g.midis, { instrument: 'guitar' }); return; }
      }
      const kb = this.kbChain(chords)[i];
      Sound.chord(kb.all, { instrument: 'piano', style: 'block' });
    },

    /* ---------- phát ---------- */
    play() {
      if (!S.prog.items.length) { App.toast('Vòng đang trống. Thêm vài hợp âm trước nhé.'); return; }
      const self = this;
      this.seq.play(t0 => {
        const chords = self.chords();
        const kb = self.kbChain(chords), gt = self.gtrChain(chords);
        const spb = 60 / S.prog.bpm;
        let beat = 0;
        chords.forEach((c, i) => {
          const start = t0 + beat * spb;
          self.seq.at(start, () => self.highlight(i));
          self.scheduleChord(kb[i], gt[i], start, c.item.beats, spb);
          if (S.prog.click) {
            for (let b = 0; b < c.item.beats; b++) Sound.click(start + b * spb, (beat + b) % 4 === 0 ? 2 : 1, 'seq');
          }
          beat += c.item.beats;
        });
        return beat * spb;
      }, { loop: () => S.prog.loop, onEnd: () => self.stopped() });
      this.updatePlayBtn();
    },
    stop() { if (this.seq) this.seq.stop(); this.stopped(); },
    stopped() { this.playingIndex = null; this.highlight(null); this.updatePlayBtn(); },
    updatePlayBtn() {
      const b = $('#p-play');
      if (!b) return;
      const on = this.seq && this.seq.playing;
      b.innerHTML = '';
      b.appendChild(App.icon(on ? 'stop' : 'play'));
      b.appendChild(h('span', null, on ? 'Dừng' : 'Phát vòng'));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    },

    scheduleChord(kb, g, start, beats, spb) {
      const inst = S.settings.instrument, style = S.prog.style;
      const N = (m, when, dur, vel) => Sound.note(m, { instrument: inst, when, dur, vel, group: 'seq' });
      const len = beats * spb;
      if (inst === 'guitar') {
        const midis = (g ? g.midis : kb.all).slice().sort((a, b) => a - b);
        const strum = (when, dir, vel, dur) => {
          const list = dir > 0 ? midis : midis.slice().reverse().slice(0, Math.min(4, midis.length));
          list.forEach((m, k) => N(m, when + k * 0.026, Math.max(0.12, dur - k * 0.026), vel * Math.max(0.75, 1 - (m - 52) * 0.015)));
        };
        if (style === 'block') strum(start, 1, 0.62, len);
        else if (style === 'rhythm') {
          // Xuống – Xuống Lên – Lên Xuống Lên
          const hits = [[0, 1], [1, 1], [1.5, -1], [2.5, -1], [3, 1], [3.5, -1]];
          for (let off = 0; off < beats; off += 4) {
            hits.forEach(([b, dir], k) => {
              const at = off + b;
              if (at >= beats) return;
              const next = Math.min(beats, k + 1 < hits.length ? off + hits[k + 1][0] : off + 4);
              strum(start + at * spb, dir, dir > 0 ? (b === 0 ? 0.66 : 0.55) : 0.4, (next - at) * spb + 0.06);
            });
          }
        } else {
          // Rải p – i – m – a – m – i – m – i
          const bass = midis[0];
          const top = midis.slice(-3);
          const pat = [bass, top[0], top[1], top[2], top[1], top[0], top[1], top[0]];
          for (let e = 0; e < beats * 2; e++) {
            const m = pat[e % 8];
            if (m !== undefined) N(m, start + e * spb / 2, Math.max(spb, (beats * 2 - e) * spb / 2), e % 8 === 0 ? 0.68 : 0.48);
          }
        }
      } else {
        const up = kb.upper;
        if (style === 'block') {
          N(kb.bass, start, len, 0.62);
          up.forEach(m => N(m, start, len, 0.48));
        } else if (style === 'rhythm') {
          N(kb.bass, start, len, 0.6);
          for (let b = 0; b < beats; b++) up.forEach(m => N(m, start + b * spb, spb * 0.9, b % 2 === 0 ? 0.48 : 0.36));
        } else {
          const b0 = kb.bass;
          const pat = up.length >= 4 ? [b0, up[0], up[1], up[2], up[3], up[2], up[1], up[0]]
            : up.length === 3 ? [b0, up[0], up[1], up[2], up[1], up[0], up[1], up[2]]
            : [b0, up[0], up[1], up[0], up[1], up[0], up[1], up[0]];
          for (let e = 0; e < beats * 2; e++) N(pat[e % 8], start + e * spb / 2, spb * 0.95, e % 8 === 0 ? 0.6 : 0.44);
        }
      }
    },

    highlight(i) {
      this.playingIndex = i;
      $$('#p-line .pcard').forEach((c, k) => c.classList.toggle('playing', k === i));
      $$('#p-diagrams .pdia').forEach((c, k) => c.classList.toggle('playing', k === i));
      this.renderRoll();
      this.renderPiano();
    },

    /* ---------- xuất / lưu ---------- */
    midi() {
      const chords = this.chords();
      if (!chords.length) { App.toast('Vòng đang trống.'); return; }
      const kb = this.kbChain(chords);
      const notes = [];
      let beat = 0;
      chords.forEach((c, i) => {
        const b = c.item.beats;
        notes.push({ midi: kb[i].bass, start: beat, dur: b, vel: 84 });
        kb[i].upper.forEach(m => notes.push({ midi: m, start: beat, dur: b, vel: 74 }));
        beat += b;
      });
      const keyAscii = S.prog.key + (S.prog.mode === 'minor' ? 'm' : '');
      const syms = chords.map(c => c.sym.replace(/♯/g, '#').replace(/♭/g, 'b')).join(' ');
      const file = 'vong-hop-am-' + keyAscii + '.mid';
      Midi.download(Midi.build(notes, { bpm: S.prog.bpm, name: syms.slice(0, 60) }), file);
      App.toast('Đã tải ' + file + '. Kéo vào Piano roll hoặc Playlist của FL Studio.');
    },
    async copyText() {
      const chords = this.chords();
      if (!chords.length) return;
      const keyName = T.letterName(T.parseNote(S.prog.key)) + (S.prog.mode === 'minor' ? ' thứ' : ' trưởng');
      const text = 'Giọng ' + keyName + ': | ' + chords.map(c => c.sym + (c.item.beats !== 4 ? ' (' + c.item.beats + ' phách)' : '')).join(' | ') + ' |\n'
        + '(' + chords.map(c => c.roman).join(' – ') + ')';
      const ok = await App.copy(text);
      App.toast(ok ? 'Đã sao chép hợp âm.' : 'Không sao chép được. Hãy chọn và sao chép thủ công.');
    },
    saveCurrent() {
      const name = ($('#p-name').value || '').trim() || this.chords().map(c => c.sym).join(' – ').slice(0, 40);
      if (!S.prog.items.length) { App.toast('Vòng đang trống.'); return; }
      S.prog.saved.unshift({ name, key: S.prog.key, mode: S.prog.mode, bpm: S.prog.bpm, items: JSON.parse(JSON.stringify(S.prog.items)) });
      S.prog.saved = S.prog.saved.slice(0, 30);
      $('#p-name').value = '';
      this.renderSaved(); App.save();
      App.toast('Đã lưu vòng “' + name + '” trên trình duyệt này.');
    },

    /* ---------- vẽ ---------- */
    render() {
      this.dirty = false;
      S.prog.key = normKey(S.prog.key, S.prog.mode);
      const keySel = $('#p-key');
      keySel.innerHTML = '';
      (S.prog.mode === 'minor' ? MINOR_KEYS : MAJOR_KEYS).forEach(k => keySel.appendChild(
        h('option', { value: k, selected: k === S.prog.key }, T.letterName(T.parseNote(k)) + (S.prog.mode === 'minor' ? ' thứ' : ' trưởng'))));
      this.modeSeg.update();
      this.styleSeg.update();
      this.instSeg.update();
      $('#p-bpm').value = S.prog.bpm;
      $('#p-loop').checked = S.prog.loop;
      $('#p-click').checked = S.prog.click;
      $('#p-capo').value = S.prog.capo;
      this.renderPalette();
      this.renderLine();
      this.renderDiagrams();
      this.renderCapo();
      this.renderRoll();
      this.renderPiano();
      this.renderSaved();
      this.updatePlayBtn();
    },

    renderPalette() {
      this.sevSeg.update();
      const key = T.parseNote(S.prog.key);
      const pref = T.keyPref(key, S.prog.mode);
      const dia = T.diatonicChords(key, S.prog.mode === 'minor' ? 'minor' : 'major', S.prog.sev);
      const box = $('#p-dia');
      box.innerHTML = '';
      dia.forEach(d => box.appendChild(h('button', {
        type: 'button', class: 'pal', title: 'Thêm ' + T.chordSymbol(d.root, d.typeId) + (d.func ? ' (' + d.func.toLowerCase() + ')' : ''),
        onclick: () => this.add({ iv: d.iv, type: d.typeId, beats: 4 })
      }, h('span', { class: 'pal-rn' }, d.roman), h('span', { class: 'pal-sym' }, T.chordSymbol(d.root, d.typeId)))));
      const bor = $('#p-borrow');
      bor.innerHTML = '';
      T.BORROWED[S.prog.mode].forEach(([iv, type, desc]) => {
        const root = tidy(T.transpose(key, iv), pref);
        bor.appendChild(h('button', {
          type: 'button', class: 'pal alt', title: desc,
          onclick: () => this.add({ iv, type, beats: 4 })
        }, h('span', { class: 'pal-rn' }, T.romanFor(iv, type, S.prog.mode)), h('span', { class: 'pal-sym' }, T.chordSymbol(root, type)), h('span', { class: 'pal-desc' }, desc)));
      });
    },

    renderLine() {
      const line = $('#p-line');
      line.innerHTML = '';
      const chords = this.chords();
      if (S.prog.sel !== null && S.prog.sel >= chords.length) S.prog.sel = null;
      if (!chords.length) line.appendChild(h('p', { class: 'empty' }, 'Chưa có hợp âm nào. Chọn một vòng mẫu hoặc bấm vào các hợp âm phía trên để thêm.'));
      chords.forEach((c, i) => {
        const beats = c.item.beats;
        line.appendChild(h('button', {
          type: 'button', class: 'pcard' + (S.prog.sel === i ? ' sel' : '') + (this.playingIndex === i ? ' playing' : ''),
          style: '--beats:' + beats, 'aria-pressed': S.prog.sel === i ? 'true' : 'false',
          'aria-label': c.sym + ', ' + c.roman + ', ' + beats + ' phách',
          onclick: () => {
            S.prog.sel = S.prog.sel === i ? null : i;
            this.renderLine(); this.renderPiano(); this.renderRoll(); App.save();
            if (S.prog.sel === i) this.preview(i);
          }
        },
        h('span', { class: 'pc-rn' }, c.roman),
        h('span', { class: 'pc-sym' }, c.sym),
        h('span', { class: 'pc-beats', 'aria-hidden': 'true' }, beats <= 8 ? Array.from({ length: beats }, () => h('i')) : beats + ' phách')));
      });
      this.renderTools();
    },

    renderTools() {
      const box = $('#p-tools');
      box.innerHTML = '';
      const i = S.prog.sel;
      if (i === null || !S.prog.items[i]) { box.hidden = true; return; }
      box.hidden = false;
      const it = S.prog.items[i];
      const items = S.prog.items;
      const after = () => { this.renderLine(); this.renderDiagrams(); this.renderCapo(); this.renderRoll(); this.renderPiano(); App.save(); $('#p-preset').value = ''; };
      const sym = this.chords()[i].sym;
      box.appendChild(h('span', { class: 'ct-label' }, 'Hợp âm ' + (i + 1) + ': ' + sym));
      box.appendChild(App.btn('Dời trái', 'left', () => { if (i > 0) { [items[i - 1], items[i]] = [items[i], items[i - 1]]; S.prog.sel = i - 1; after(); } }, 'ghost sm', { disabled: i === 0 }));
      box.appendChild(App.btn('Dời phải', 'right', () => { if (i < items.length - 1) { [items[i + 1], items[i]] = [items[i], items[i + 1]]; S.prog.sel = i + 1; after(); } }, 'ghost sm', { disabled: i === items.length - 1 }));
      box.appendChild(App.btn('Bớt phách', 'minus', () => { if (it.beats > 1) { it.beats--; after(); } }, 'ghost sm', { disabled: it.beats <= 1 }));
      box.appendChild(App.btn('Thêm phách', 'plus', () => { if (it.beats < 16) { it.beats++; after(); } }, 'ghost sm'));
      box.appendChild(App.btn('Nhân đôi', 'copy', () => { items.splice(i + 1, 0, Object.assign({}, it)); S.prog.sel = i + 1; after(); }, 'ghost sm'));
      box.appendChild(App.btn('Xóa', 'trash', () => { items.splice(i, 1); S.prog.sel = items.length ? Math.min(i, items.length - 1) : null; after(); }, 'ghost sm danger'));
    },

    renderDiagrams() {
      const box = $('#p-diagrams');
      box.innerHTML = '';
      const chords = this.chords();
      const tun = App.tuning();
      if (tun.bass) { box.appendChild(h('p', { class: 'empty' }, 'Đang chọn đàn bass: hãy chơi nốt gốc của mỗi hợp âm (xem trong tab Hợp âm).')); return; }
      const gt = this.gtrChain(chords);
      chords.forEach((c, i) => {
        const g = gt[i];
        const shape = S.prog.capo && g ? T.chordSymbol(g.shapeRoot, c.type) : null;
        box.appendChild(h('button', {
          type: 'button', class: 'pdia' + (this.playingIndex === i ? ' playing' : ''),
          onclick: () => { if (g) Sound.chord(g.midis, { instrument: 'guitar' }); }
        },
        h('span', { class: 'pdia-sym' }, c.sym),
        shape ? h('span', { class: 'pdia-shape' }, 'thế ' + shape) : null,
        g ? App.diagram(g.v, 'Thế bấm ' + c.sym) : h('span', { class: 'empty' }, 'Không có thế dễ')));
      });
    },

    renderCapo() {
      const chords = this.chords();
      const p = $('#p-capo-shapes');
      const sug = $('#p-capo-sug');
      sug.innerHTML = '';
      if (!chords.length) { p.textContent = ''; return; }
      const shapeOf = (c, capo) => T.chordSymbol(T.fromPc(T.pc(c.root) - capo, 'common'), c.type);
      if (S.prog.capo) {
        p.textContent = 'Bấm thế: ' + chords.map(c => shapeOf(c, S.prog.capo)).join(' – ') + '. Âm thanh vẫn là ' + chords.map(c => c.sym).join(' – ') + '.';
      } else {
        p.textContent = 'Không dùng capo: bấm đúng các hợp âm ' + chords.map(c => c.sym).join(' – ') + '.';
      }
      const uniq = [...new Map(chords.map(c => [c.sym, c])).values()];
      const scores = [];
      for (let capo = 0; capo <= 7; capo++) {
        const shapes = uniq.map(c => shapeOf(c, capo).replace(/♯/g, '#').replace(/♭/g, 'b'));
        const easy = shapes.filter(s => EASY.has(s)).length;
        scores.push({ capo, easy, shapes: uniq.map(c => shapeOf(c, capo)) });
      }
      scores.sort((a, b) => b.easy - a.easy || a.capo - b.capo);
      const top = scores.filter(s => s.easy > 0).slice(0, 3);
      if (!top.length) { sug.appendChild(h('p', { class: 'hint' }, 'Vòng này không có thế mở dễ ở capo nào; hãy dùng hợp âm chặn.')); return; }
      sug.appendChild(h('p', { class: 'hint' }, 'Gợi ý để bấm toàn thế mở dễ:'));
      top.forEach(s => sug.appendChild(h('button', {
        type: 'button', class: 'chip' + (s.capo === S.prog.capo ? ' on' : ''),
        onclick: () => { S.prog.capo = s.capo; $('#p-capo').value = s.capo; this.renderCapo(); this.renderDiagrams(); App.save(); }
      }, h('strong', null, s.capo ? 'Capo ' + s.capo : 'Không capo'), ': ' + s.shapes.join(' – ') + ' (' + s.easy + '/' + uniq.length + ' thế dễ)')));
    },

    renderRoll() {
      const chords = this.chords();
      const box = $('#p-roll');
      if (!chords.length) { box.innerHTML = ''; return; }
      const kb = this.kbChain(chords);
      const notes = [], blocks = [];
      let beat = 0;
      chords.forEach((c, i) => {
        const b = c.item.beats;
        blocks.push({ start: beat, dur: b, label: c.sym });
        notes.push({ midi: kb[i].bass, start: beat, dur: b, ci: i, bass: true });
        kb[i].upper.forEach(m => notes.push({ midi: m, start: beat, dur: b, ci: i }));
        beat += b;
      });
      const cur = this.playingIndex !== null ? this.playingIndex : S.prog.sel;
      Draw.pianoRoll(box, {
        notes, blocks, beats: beat, current: cur, beatsPerBar: 4, width: box.clientWidth,
        onClick: i => { S.prog.sel = i; this.renderLine(); this.renderPiano(); this.renderRoll(); this.preview(i); }
      });
    },

    renderPiano() {
      const chords = this.chords();
      const box = $('#p-piano');
      const cap = $('#p-piano-cap');
      if (!chords.length) { box.innerHTML = ''; cap.textContent = ''; return; }
      const i = this.playingIndex !== null ? this.playingIndex : S.prog.sel !== null ? S.prog.sel : 0;
      const kb = this.kbChain(chords)[i];
      const c = chords[i];
      const tones = T.chordTones(c.root, c.type);
      const marks = new Map();
      kb.all.forEach(m => {
        const t = tones.find(x => x.pc === m % 12);
        marks.set(m, { label: t ? App.nn(t.note) : '', fam: t ? t.family : 'none' });
      });
      Draw.piano(box, { start: 36, octaves: 4, compact: true, marks, onClick: m => Sound.note(m, { instrument: 'piano' }), aria: 'Hợp âm ' + c.sym + ' trên piano' });
      cap.textContent = c.sym + ': tay trái ' + T.letterName(T.fromPc(kb.bass, 'common')) + ', tay phải ' + kb.upper.map(m => {
        const t = tones.find(x => x.pc === m % 12);
        return t ? T.letterName(t.note) : '';
      }).join(' – ');
    },

    renderSaved() {
      const box = $('#p-saved');
      box.innerHTML = '';
      if (!S.prog.saved.length) { box.appendChild(h('p', { class: 'hint' }, 'Các vòng bạn lưu sẽ nằm ở đây (chỉ trên trình duyệt này).')); return; }
      S.prog.saved.forEach((sv, k) => {
        const key = T.parseNote(sv.key);
        const pref = T.keyPref(key, sv.mode);
        const syms = sv.items.map(it => T.chordSymbol(tidy(T.transpose(key, it.iv), pref), it.type)).join(' – ');
        box.appendChild(h('div', { class: 'saved' },
          h('div', { class: 'saved-txt' }, h('strong', null, sv.name), h('span', null, T.letterName(key) + (sv.mode === 'minor' ? ' thứ' : ' trưởng') + ': ' + syms)),
          App.btn('Mở', null, () => {
            this.stop();
            Object.assign(S.prog, { key: sv.key, mode: sv.mode, bpm: sv.bpm || S.prog.bpm, items: JSON.parse(JSON.stringify(sv.items)), sel: null });
            $('#p-preset').value = ''; $('#p-preset-note').textContent = '';
            this.render(); App.save();
          }, 'ghost sm'),
          App.btn('', 'trash', () => { S.prog.saved.splice(k, 1); this.renderSaved(); App.save(); }, 'ghost sm icon-only', { 'aria-label': 'Xóa vòng ' + sv.name })));
      });
    }
  };
})();
