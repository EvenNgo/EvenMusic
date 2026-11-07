/* Phím & Phím — Trang “Âm giai”: tra âm giai, vị trí trên cần đàn, hợp âm thuận. */
(function () {
  'use strict';
  const { h, $, $$, T, S } = App;

  const MODES = new Set(['dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian', 'phrygianDom']);
  // Âm giai 7 nốt dùng chung nốt với giọng trưởng nào (tính từ chủ âm)
  const PARENT = { minor: 'b3', dorian: 'b7', phrygian: 'b6', lydian: '5', mixolydian: '4', locrian: 'b2' };

  function title(root, sc, solf) {
    const r = solf ? T.solfegeName(root) : T.letterName(root);
    return r + ' ' + (MODES.has(sc.id) ? sc.name : sc.name.toLowerCase());
  }

  const V = App.views.scale = {
    mount() {
      this.rp = App.rootPicker($('#s-root'), () => S.scale.root, v => {
        S.scale.root = v; S.scale.pos = 0; S.scale.focus = null;
        this.render(); App.save();
      });
      const sel = $('#s-type');
      T.SCALE_GROUPS.forEach(g => {
        const og = h('optgroup', { label: g });
        T.SCALES.filter(s => s.group === g).forEach(s => og.appendChild(h('option', { value: s.id }, s.name + (s.alias ? ' (' + s.alias + ')' : ''))));
        sel.appendChild(og);
      });
      sel.addEventListener('change', () => {
        S.scale.type = sel.value; S.scale.pos = 0; S.scale.focus = null;
        this.render(); App.save();
      });
      this.labelSeg = App.seg($('#s-label'), [['note', 'Tên nốt'], ['interval', 'Quãng'], ['degree', 'Bậc']],
        () => S.scale.label, v => { S.scale.label = v; this.render(); App.save(); }, 'Nhãn trên cần đàn');
      this.sevSeg = App.seg($('#s-sev'), [['false', 'Hợp âm ba'], ['true', 'Hợp âm bảy']],
        () => String(S.scale.sev), v => { S.scale.sev = v === 'true'; this.render(); App.save(); }, 'Loại hợp âm thuận');
      $('#s-up').addEventListener('click', () => this.playScale(false));
      $('#s-updown').addEventListener('click', () => this.playScale(true));
      $('#s-midi').addEventListener('click', () => this.midi());
    },

    midis(updown) {
      const root = T.parseNote(S.scale.root);
      const tones = T.scaleTones(root, S.scale.type);
      const base = 55 + T.mod(T.pc(root) - 7, 12);
      const up = tones.map(t => base + T.iv(t.iv).semis).concat([base + 12]);
      return updown ? up.concat(up.slice(0, -1).reverse()) : up;
    },
    playScale(updown) { Sound.sequence(this.midis(updown), { instrument: S.settings.instrument, step: 0.28 }); },
    midi() {
      const root = T.parseNote(S.scale.root);
      const sc = T.SCALE[S.scale.type];
      const notes = this.midis(true).map((m, i) => ({ midi: m, start: i * 0.5, dur: 0.5, vel: i === 0 ? 92 : 80 }));
      const ascii = T.id(root) + '-' + sc.id;
      Midi.download(Midi.build(notes, { bpm: 100, name: ascii }), 'am-giai-' + ascii + '.mid');
      App.toast('Đã tải MIDI của âm giai. Kéo vào Piano roll để dùng làm “ghost notes”.');
    },

    render() {
      this.dirty = false;
      const root = T.parseNote(S.scale.root);
      const sc = T.SCALE[S.scale.type];
      const tones = T.scaleTones(root, sc.id);
      const tun = App.tuning();
      this.rp.update();
      this.labelSeg.update();
      $('#s-type').value = sc.id;

      $('#s-name').textContent = title(root, sc, false);
      $('#s-read').textContent = title(root, sc, true) + (sc.alias ? ' (' + sc.alias + ')' : '');
      $('#s-desc').textContent = sc.desc;

      const base = 55 + T.mod(T.pc(root) - 7, 12);
      const f = $('#s-formula');
      f.innerHTML = '';
      tones.forEach(t => f.appendChild(App.toneChip(t, base + T.iv(t.iv).semis)));

      // Khoảng cách, hóa biểu, giọng liên quan
      const facts = $('#s-facts');
      facts.innerHTML = '';
      const steps = T.stepPattern(sc.id);
      facts.appendChild(h('div', { class: 'fact' }, h('span', { class: 'fact-k' }, 'Khoảng cách'),
        h('span', { class: 'steps', 'aria-label': steps.join(' ') }, steps.map(s => h('span', { class: 'step s-' + (s === 'N' ? 'n' : s === 'C' ? 'c' : 'w') }, s))),
        h('span', { class: 'fact-note' }, 'C = một cung, N = nửa cung')));
      if (tones.length === 7) {
        const ks = T.keySignature(tones.map(t => t.note));
        const list = ks.sharps.concat(ks.flats).map(n => T.letterName(n)).join(', ');
        facts.appendChild(h('div', { class: 'fact' }, h('span', { class: 'fact-k' }, 'Hóa biểu'),
          h('span', { class: 'fact-v' }, ks.text + (list ? ': ' + list : ''))));
      }
      const links = [];
      const keyBtn = (label, rootN, type) => h('button', {
        type: 'button', class: 'chip',
        onclick: () => { S.scale.root = T.id(rootN); S.scale.type = type; S.scale.pos = 0; S.scale.focus = null; this.render(); App.save(); }
      }, label);
      if (sc.id === 'major') {
        const rel = T.transpose(root, '6');
        links.push(keyBtn('Song song: ' + T.letterName(rel) + ' thứ', rel, 'minor'));
        links.push(keyBtn('Cùng tên: ' + T.letterName(root) + ' thứ', root, 'minor'));
      } else if (sc.id === 'minor') {
        const rel = T.transpose(root, 'b3');
        links.push(keyBtn('Song song: ' + T.letterName(rel) + ' trưởng', rel, 'major'));
        links.push(keyBtn('Cùng tên: ' + T.letterName(root) + ' trưởng', root, 'major'));
      } else if (PARENT[sc.id]) {
        const par = T.transpose(root, PARENT[sc.id]);
        links.push(keyBtn('Cùng nốt với ' + T.letterName(par) + ' trưởng', par, 'major'));
      }
      if (sc.id === 'minPent') {
        const rel = T.transpose(root, 'b3');
        links.push(keyBtn('Song song: ' + T.letterName(rel) + ' ngũ cung trưởng', rel, 'majPent'));
      } else if (sc.id === 'majPent') {
        const rel = T.transpose(root, '6');
        links.push(keyBtn('Song song: ' + T.letterName(rel) + ' ngũ cung thứ', rel, 'minPent'));
      }
      if (links.length) facts.appendChild(h('div', { class: 'fact' }, h('span', { class: 'fact-k' }, 'Giọng liên quan'), h('span', { class: 'fact-v chips' }, links)));

      // Vị trí trên cần đàn
      const positions = tun.reentrant ? [] : T.scalePositions(root, sc.id, tun.midis, S.settings.frets);
      if (S.scale.pos > positions.length) S.scale.pos = 0;
      const posBox = $('#s-pos');
      posBox.innerHTML = '';
      if (positions.length) {
        const opts = [['0', 'Toàn cần đàn']].concat(positions.map((p, i) => [String(i + 1), 'Vị trí ' + (i + 1), 'Phím ' + p.minF + '–' + p.maxF]));
        const segEl = h('div');
        posBox.appendChild(h('span', { class: 'field-label' }, tones.length === 5 ? 'Vị trí (2 nốt mỗi dây)' : 'Vị trí (3 nốt mỗi dây)'));
        posBox.appendChild(segEl);
        App.seg(segEl, opts, () => String(S.scale.pos), v => { S.scale.pos = +v; this.render(); App.save(); }, 'Vị trí âm giai');
      }

      // Hợp âm thuận (đang chọn) để soi các nốt hợp âm bên trong âm giai
      const dia = tones.length === 7 ? T.diatonicChords(root, sc.id, S.scale.sev) : [];
      if (S.scale.focus !== null && !dia[S.scale.focus]) S.scale.focus = null;
      const focus = S.scale.focus !== null ? dia[S.scale.focus] : null;
      const focusTones = focus && focus.typeId ? T.chordTones(focus.root, focus.typeId) : null;

      let marks = App.toneMarks(tones, S.scale.label);
      let win = null;
      if (S.scale.pos > 0) {
        const p = positions[S.scale.pos - 1];
        const cells = new Set(p.cells.map(c => c.s + ':' + c.f));
        marks.forEach(m => { if (!cells.has(m.s + ':' + m.f)) m.ghost = true; });
        win = [p.minF, p.maxF];
      }
      if (focusTones) {
        const byPc = new Map(focusTones.map(t => [t.pc, t]));
        marks.forEach(m => {
          const pcv = (tun.midis[m.s] + m.f) % 12;
          const ct = byPc.get(pcv);
          if (ct) { m.fam = ct.family; m.strong = !m.ghost; if (S.scale.label === 'interval') m.label = T.ivShort(ct.iv); }
          else m.ghost = true;
        });
      }
      App.board($('#s-board'), {
        marks, window: win, onClick: (s, fr, m) => Sound.note(m, { instrument: 'guitar' }),
        aria: 'Âm giai ' + title(root, sc, false) + ' trên cần đàn'
      });
      const famsSrc = focusTones || tones;
      App.legend($('#s-legend'), ['root', 'third', 'fifth', 'seventh', 'ext'].filter(fm => famsSrc.some(t => t.family === fm)));
      $('#s-legend').appendChild(h('span', { class: 'lg-note' }, focus ? 'Đang soi hợp âm ' + T.chordSymbol(focus.root, focus.typeId) + ' trong âm giai' : 'Màu cho biết vai trò của nốt so với chủ âm'));

      // Piano
      const pm = new Map();
      const byPc = new Map(tones.map(t => [t.pc, t]));
      const fByPc = focusTones ? new Map(focusTones.map(t => [t.pc, t])) : null;
      for (let m = 48; m <= 84; m++) {
        const t = byPc.get(m % 12);
        if (!t) continue;
        const ft = fByPc && fByPc.get(m % 12);
        pm.set(m, { label: App.toneLabel(t, S.scale.label === 'interval' ? 'interval' : S.scale.label === 'degree' ? 'degree' : 'note'), fam: ft ? ft.family : t.family, ghost: fByPc ? !ft : false });
      }
      Draw.piano($('#s-piano'), { start: 48, octaves: 3, compact: true, marks: pm, onClick: m => Sound.note(m, { instrument: 'piano' }), aria: 'Âm giai trên piano' });

      // Hợp âm thuận
      const wrap = $('#s-dia-wrap');
      const box = $('#s-dia');
      box.innerHTML = '';
      wrap.hidden = !dia.length;
      this.sevSeg.update();
      dia.forEach((dc, i) => {
        if (!dc.typeId) return;
        const sym = T.chordSymbol(dc.root, dc.typeId);
        const on = S.scale.focus === i;
        const card = h('div', { class: 'dcard' + (on ? ' on' : '') },
          h('button', {
            type: 'button', class: 'dcard-main', 'aria-pressed': on ? 'true' : 'false',
            onclick: () => {
              S.scale.focus = on ? null : i;
              this.render(); App.save();
              if (!on) App.playChord(dc.root, dc.typeId);
            }
          },
          h('span', { class: 'dc-rn' }, dc.roman),
          h('span', { class: 'dc-sym' }, sym),
          dc.func ? h('span', { class: 'dc-func' }, dc.func) : null),
          on ? h('button', {
            type: 'button', class: 'dcard-link',
            onclick: () => App.go('chord', st => { st.chord.root = T.id(dc.root); st.chord.type = dc.typeId; st.chord.voicing = 0; st.chord.bass = ''; st.chord.inv = 0; })
          }, 'Xem hợp âm') : null);
        box.appendChild(card);
      });
      $('#s-dia-hint').textContent = dia.length ? 'Bấm một hợp âm để nghe và soi các nốt của nó trên cần đàn.' : '';

      const use = $('#s-use');
      use.innerHTML = '';
      if (sc.id === 'major' || sc.id === 'minor') {
        use.appendChild(App.btn('Dựng vòng hợp âm ở giọng này', null, () => App.go('prog', () => {
          App.views.prog.setKey(T.id(root), sc.id === 'minor' ? 'minor' : 'major');
        }), 'ghost'));
      }
    }
  };
})();
