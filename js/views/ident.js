/* Phím & Phím — Trang “Nhận diện hợp âm”: chọn nốt, biết tên hợp âm. */
(function () {
  'use strict';
  const { h, $, T, S } = App;

  const V = App.views.ident = {
    mount() {
      this.inputSeg = App.seg($('#i-input'), [['piano', 'Bấm trên piano'], ['guitar', 'Bấm trên cần đàn']],
        () => S.ident.input, v => { S.ident.input = v; this.render(); App.save(); }, 'Cách nhập nốt');
      $('#i-clear').addEventListener('click', () => { S.ident.notes = []; S.ident.frets = null; this.render(); App.save(); });
      $('#i-play').addEventListener('click', () => {
        const m = this.midis();
        if (m.length) Sound.chord(m, { instrument: S.ident.input === 'guitar' ? 'guitar' : 'piano', style: S.ident.input === 'guitar' ? 'strum' : 'block' });
      });
    },

    frets() {
      const n = App.tuning().midis.length;
      if (!Array.isArray(S.ident.frets) || S.ident.frets.length !== n) S.ident.frets = new Array(n).fill(-1);
      return S.ident.frets;
    },

    midis() {
      if (S.ident.input === 'piano') return S.ident.notes.slice().sort((a, b) => a - b);
      const t = App.tuning();
      return this.frets().map((f, s) => f < 0 ? null : t.midis[s] + f).filter(m => m !== null).sort((a, b) => a - b);
    },

    render() {
      this.dirty = false;
      this.inputSeg.update();
      const midis = this.midis();
      const results = T.identify(midis);
      const best = results[0];
      const bestTones = best ? T.chordTones(best.root, best.typeId) : null;
      const toneOf = m => bestTones && bestTones.find(t => t.pc === m % 12);
      const nameOf = m => { const t = toneOf(m); return App.nn(t ? t.note : T.fromPc(m, 'common')); };

      const surf = $('#i-surface');
      if (S.ident.input === 'piano') {
        const marks = new Map(S.ident.notes.map(m => { const t = toneOf(m); return [m, { label: nameOf(m), fam: t ? t.family : 'none' }]; }));
        Draw.piano(surf, {
          start: 48, octaves: 3, marks, aria: 'Bấm phím để chọn nốt',
          onClick: m => {
            const i = S.ident.notes.indexOf(m);
            if (i >= 0) S.ident.notes.splice(i, 1);
            else { S.ident.notes.push(m); Sound.note(m, { instrument: 'piano' }); }
            this.render(); App.save();
          }
        });
      } else {
        const fr = this.frets();
        const t = App.tuning();
        const marks = [];
        fr.forEach((f, s) => {
          if (f < 0) return;
          const m = t.midis[s] + f;
          const tone = toneOf(m);
          marks.push({ s, f, label: nameOf(m), fam: tone ? tone.family : 'none', strong: true });
        });
        App.board(surf, {
          marks, frets: Math.min(15, S.settings.frets), aria: 'Bấm vào cần đàn để chọn nốt, mỗi dây một nốt',
          onClick: (s, f, m) => {
            fr[s] = fr[s] === f ? -1 : f;
            if (fr[s] >= 0) Sound.note(m, { instrument: 'guitar' });
            this.render(); App.save();
          }
        });
      }

      const chips = $('#i-notes');
      chips.innerHTML = '';
      if (!midis.length) chips.appendChild(h('span', { class: 'hint' }, 'Chưa chọn nốt nào.'));
      midis.forEach((m, k) => chips.appendChild(h('span', { class: 'nchip' + (k === 0 ? ' bass' : '') }, nameOf(m) + (T.octaveOf(m)), k === 0 ? h('small', null, 'bass') : null)));

      const box = $('#i-results');
      box.innerHTML = '';
      if (midis.length < 2) {
        box.appendChild(h('p', { class: 'empty' }, S.ident.input === 'piano'
          ? 'Bấm ít nhất 2 phím trên piano. Bấm lại một phím để bỏ chọn.'
          : 'Bấm vào cần đàn, mỗi dây một nốt. Bấm lại để bỏ chọn dây đó.'));
        return;
      }
      if (!results.length) {
        box.appendChild(h('p', { class: 'empty' }, 'Chưa nhận ra hợp âm quen thuộc nào từ các nốt này. Thử thêm hoặc bớt một nốt.'));
        return;
      }
      results.forEach((r, k) => {
        const tones = T.chordTones(r.root, r.typeId);
        const have = new Set(midis.map(m => m % 12));
        const missing = tones.filter(t => !have.has(t.pc));
        const note = missing.length ? 'Thiếu ' + missing.map(t => T.ivName(t.iv).toLowerCase() + ' (' + T.letterName(t.note) + ')').join(', ') : 'Đủ các nốt';
        box.appendChild(h('div', { class: 'result' + (k === 0 ? ' top' : '') },
          h('div', { class: 'result-main' },
            h('span', { class: 'result-sym' }, r.symbol),
            h('span', { class: 'result-read' }, T.chordReading(r.root, r.typeId) + (r.bass ? ', bass ' + T.solfegeName(r.bass) : '')),
            h('span', { class: 'result-note' }, note)),
          App.btn('Xem hợp âm', null, () => App.go('chord', st => {
            st.chord.root = T.id(r.root); st.chord.type = r.typeId; st.chord.voicing = 0; st.chord.inv = 0;
            const bt = r.bass && tones.find(t => t.pc === T.pc(r.bass));
            st.chord.bass = bt ? bt.iv : '';
          }), 'ghost sm')));
      });
    }
  };
})();
