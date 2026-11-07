/* Phím & Phím — Trang “Bản đồ cần đàn”. */
(function () {
  'use strict';
  const { h, $, T, S } = App;

  const HINTS = {
    all: 'Mọi nốt trên cần đàn. Nốt tự nhiên hiện rõ, nốt thăng/giáng hiện mờ. Bấm vào một nốt để nghe.',
    natural: 'Chỉ các nốt tự nhiên (không thăng giáng). Hãy thuộc dây 6 và dây 5 trước: đó là nơi đặt nốt gốc của hợp âm chặn.',
    find: 'Mọi vị trí của một nốt. Để ý quy luật quãng 8: lên hai dây, tiến 2 phím (hoặc 3 phím khi đi qua dây B).',
    interval: 'Bấm vào bất kỳ nốt nào để đặt làm nốt gốc. Các nốt còn lại hiện quãng so với nốt đó, giúp bạn thuộc “dáng” của từng quãng.'
  };

  const V = App.views.fret = {
    mount() {
      this.modeSeg = App.seg($('#f-mode'), [['all', 'Tất cả nốt'], ['natural', 'Nốt tự nhiên'], ['find', 'Tìm một nốt'], ['interval', 'Bản đồ quãng']],
        () => S.fret.mode, v => { S.fret.mode = v; this.render(); App.save(); }, 'Chế độ');
      this.rp = App.rootPicker($('#f-note'), () => S.fret.note, v => { S.fret.note = v; this.render(); App.save(); });
    },
    render() {
      this.dirty = false;
      this.modeSeg.update();
      this.rp.update();
      const mode = S.fret.mode;
      $('#f-note-wrap').hidden = mode !== 'find';
      $('#f-hint').textContent = HINTS[mode];
      const t = App.tuning();
      const frets = S.settings.frets;
      if (!S.fret.ref || S.fret.ref.s >= t.midis.length) S.fret.ref = { s: 0, f: 3 };
      const target = T.parseNote(S.fret.note);
      const marks = [];
      const where = [];
      t.midis.forEach((open, s) => {
        const hits = [];
        for (let f = 0; f <= frets; f++) {
          const m = open + f;
          const p = m % 12;
          const n = T.fromPc(p, 'common');
          if (mode === 'all') marks.push({ s, f, label: App.nn(n), fam: 'none', ghost: n.a !== 0, title: T.letterName(n) + T.octaveOf(m) });
          else if (mode === 'natural') { if (n.a === 0) marks.push({ s, f, label: App.nn(n), fam: 'none', title: T.letterName(n) + T.octaveOf(m) }); }
          else if (mode === 'find') {
            if (p === T.pc(target)) { marks.push({ s, f, label: App.nn(target), fam: 'root', strong: true, title: T.letterName(target) + T.octaveOf(m) }); hits.push(f); }
          } else {
            const ref = t.midis[S.fret.ref.s] + S.fret.ref.f;
            const d = T.mod(m - ref, 12);
            const ivs = T.SEMI_IV[d];
            const isRef = s === S.fret.ref.s && f === S.fret.ref.f;
            marks.push({ s, f, label: T.ivShort(ivs), fam: T.ivFamily(ivs), strong: isRef, ring: isRef, ghost: !isRef && ![0, 3, 4, 7, 10, 11].includes(d), title: T.SEMI_NAMES[d] });
          }
        }
        if (mode === 'find') where.push([t.midis.length - s, hits]);
      });
      App.board($('#f-board'), {
        marks,
        aria: 'Bản đồ cần đàn',
        onClick: (s, f, m) => {
          Sound.note(m, { instrument: 'guitar' });
          if (mode === 'interval') { S.fret.ref = { s, f }; this.render(); App.save(); }
        }
      });
      const extra = $('#f-extra');
      extra.innerHTML = '';
      if (mode === 'find') {
        const ul = h('ul', { class: 'where' });
        where.sort((a, b) => a[0] - b[0]).forEach(([num, hits]) => ul.appendChild(h('li', null, h('strong', null, 'Dây ' + num + ' (' + t.names[t.midis.length - num] + ')'), ': phím ' + (hits.length ? hits.join(', ') : 'không có'))));
        extra.appendChild(ul);
      } else if (mode === 'interval') {
        const ref = t.midis[S.fret.ref.s] + S.fret.ref.f;
        extra.appendChild(h('p', null, 'Nốt gốc đang chọn: ', h('strong', null, T.letterName(T.fromPc(ref, 'common')) + T.octaveOf(ref)),
          ' ở dây ' + (t.midis.length - S.fret.ref.s) + ', phím ' + S.fret.ref.f + '. Các quãng 3, 5, 7 và quãng 8 hiện rõ; những quãng khác hiện mờ.'));
        App.legend(extra.appendChild(h('div', { class: 'legend' })), ['root', 'third', 'fifth', 'seventh', 'ext']);
      }
    }
  };
})();
