/* Phím & Phím — Trang “Vòng quãng 5”. */
(function () {
  'use strict';
  const { h, $, T, S } = App;

  const MAJ = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯/G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
  const MIN = ['Am', 'Em', 'Bm', 'F♯m', 'C♯m', 'G♯m', 'E♭m', 'B♭m', 'Fm', 'Cm', 'Gm', 'Dm'];
  const SIG = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];

  const V = App.views.circle = {
    mount() {},
    keyOf(i, mode) { return (mode === 'minor' ? T.MINOR_KEYS : T.MAJOR_KEYS)[i]; },
    render() {
      this.dirty = false;
      const { i, mode } = S.circle;
      const key = this.keyOf(i, mode);
      const tones = T.scaleTones(key, mode);
      const ks = T.keySignature(tones.map(t => t.note));
      Draw.circle($('#o-circle'), {
        majors: MAJ, minors: MIN, sigs: SIG, sel: i, mode,
        center: [T.letterName(key) + (mode === 'minor' ? 'm' : ''), ks.text],
        onSelect: (ni, nm) => {
          S.circle = { i: ni, mode: nm };
          this.render(); App.save();
          const k = this.keyOf(ni, nm);
          App.playChord(k, nm === 'minor' ? 'min' : 'maj');
        }
      });

      const info = $('#o-info');
      info.innerHTML = '';
      const modeName = mode === 'minor' ? ' thứ' : ' trưởng';
      info.appendChild(h('h2', { class: 'o-title' }, T.letterName(key) + modeName));
      info.appendChild(h('p', { class: 'reading' }, T.solfegeName(key) + modeName + (i === 6 && mode === 'major' ? ' (cũng viết là G♭ trưởng, 6♭)' : '') + (i === 6 && mode === 'minor' ? ' (cũng viết là D♯ thứ, 6♯)' : '')));
      const list = ks.sharps.concat(ks.flats).map(n => T.letterName(n)).join(', ');
      info.appendChild(h('p', null, h('strong', null, 'Hóa biểu: '), ks.text + (list ? ' (' + list + ')' : '')));

      const base = 55 + T.mod(T.pc(key) - 7, 12);
      const notes = h('div', { class: 'formula small' });
      tones.forEach(t => notes.appendChild(App.toneChip(t, base + T.iv(t.iv).semis, true)));
      info.appendChild(notes);

      info.appendChild(h('h3', null, 'Hợp âm thuận'));
      const dia = h('div', { class: 'dia mini' });
      T.diatonicChords(key, mode, false).forEach(d => dia.appendChild(h('button', {
        type: 'button', class: 'dcard-main', title: d.func || '',
        onclick: () => App.playChord(d.root, d.typeId)
      }, h('span', { class: 'dc-rn' }, d.roman), h('span', { class: 'dc-sym' }, T.chordSymbol(d.root, d.typeId)))));
      info.appendChild(dia);

      const rel = mode === 'major' ? T.transpose(key, '6') : T.transpose(key, 'b3');
      const relMode = mode === 'major' ? 'minor' : 'major';
      const near = [T.MAJOR_KEYS, T.MINOR_KEYS][mode === 'minor' ? 1 : 0];
      const left = near[(i + 11) % 12], right = near[(i + 1) % 12];
      const rows = h('div', { class: 'chips' },
        h('button', { type: 'button', class: 'chip', onclick: () => { S.circle = { i, mode: relMode }; this.render(); App.save(); } }, 'Giọng song song: ' + T.letterName(rel) + (relMode === 'minor' ? ' thứ' : ' trưởng')),
        h('button', { type: 'button', class: 'chip', onclick: () => { S.circle = { i: (i + 11) % 12, mode }; this.render(); App.save(); } }, 'Bên trái: ' + T.letterName(left) + modeName),
        h('button', { type: 'button', class: 'chip', onclick: () => { S.circle = { i: (i + 1) % 12, mode }; this.render(); App.save(); } }, 'Bên phải: ' + T.letterName(right) + modeName));
      info.appendChild(rows);

      info.appendChild(h('div', { class: 'row gap' },
        App.btn('Xem âm giai', null, () => App.go('scale', st => { st.scale.root = T.id(key); st.scale.type = mode; st.scale.pos = 0; st.scale.focus = null; }), 'ghost'),
        App.btn('Dựng vòng hợp âm', null, () => App.go('prog', () => { App.views.prog.setKey(T.id(key), mode); }), 'ghost')));
    }
  };
})();
