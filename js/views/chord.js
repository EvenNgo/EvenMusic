/* Phím & Phím — Trang “Hợp âm”: tra hợp âm, xem trên cần đàn, thế bấm, piano. */
(function () {
  'use strict';
  const { h, $, $$, T, S } = App;

  const PIANO_FINGERS = {
    3: ['Tay phải: ngón 1 – 3 – 5 (cái, giữa, út). Tay trái: nốt gốc.', 'Thế đảo 1, tay phải: ngón 1 – 2 – 5.', 'Thế đảo 2, tay phải: ngón 1 – 3 – 5.'],
    4: ['Tay phải: ngón 1 – 2 – 3 – 5. Tay trái: nốt gốc.', 'Tay phải: ngón 1 – 2 – 3 – 5.', 'Tay phải: ngón 1 – 2 – 4 – 5.', 'Tay phải: ngón 1 – 2 – 4 – 5.']
  };
  const SEVENTH_TYPES = new Set(['7', 'maj7', 'm7', 'm7b5', 'dim7', 'mMaj7', 'maj7#5']);

  const V = App.views.chord = {
    mount() {
      this.rp = App.rootPicker($('#c-root'), () => S.chord.root, v => {
        S.chord.root = v; S.chord.voicing = 0; S.chord.bass = '';
        this.render(); App.save(); this.play();
      });

      const wrap = $('#c-type');
      T.CHORD_GROUPS.forEach(g => {
        const row = h('div', { class: 'type-group', role: 'group', 'aria-label': g }, h('span', { class: 'type-group-name' }, g));
        T.CHORDS.filter(c => c.group === g).forEach(c => row.appendChild(h('button', {
          type: 'button', class: 'type', 'data-id': c.id, title: c.name,
          onclick: () => {
            S.chord.type = c.id; S.chord.voicing = 0; S.chord.bass = ''; S.chord.inv = 0;
            this.render(); App.save(); this.play();
          }
        }, c.sym || 'Trưởng')));
        wrap.appendChild(row);
      });

      this.labelSeg = App.seg($('#c-label'), [['note', 'Tên nốt'], ['interval', 'Quãng']],
        () => S.chord.label, v => { S.chord.label = v; this.render(); App.save(); }, 'Nhãn trên cần đàn');
      $('#c-bass').addEventListener('change', e => { S.chord.bass = e.target.value; S.chord.voicing = 0; this.render(); App.save(); this.play(); });
      $('#c-play').addEventListener('click', () => this.play());
      $('#c-arp').addEventListener('click', () => this.play('arp'));
      $('#c-midi').addEventListener('click', () => this.midi());
    },

    data() {
      const root = T.parseNote(S.chord.root);
      const type = S.chord.type;
      const tones = T.chordTones(root, type);
      const bassTone = S.chord.bass ? tones.find(t => t.iv === S.chord.bass) || null : null;
      return { root, type, tones, bassTone, sym: T.chordSymbol(root, type, bassTone && bassTone.note) };
    },

    pianoNotes(d) {
      const inv = d.tones.length <= 4 && !d.bassTone ? S.chord.inv : 0;
      const notes = T.closeVoicing(d.root, d.type, inv).map(x => ({ midi: x.midi, tone: x.tone }));
      if (d.bassTone) notes.unshift({ midi: 36 + d.bassTone.pc, tone: d.bassTone, bass: true });
      return notes;
    },

    currentVoicing(d) {
      const vs = App.voicings(d.root, d.type, d.bassTone ? d.bassTone.pc : undefined);
      return { vs, v: vs[Math.min(S.chord.voicing, Math.max(0, vs.length - 1))] };
    },

    play(style) {
      const d = this.data();
      const { v } = this.currentVoicing(d);
      const midis = S.settings.instrument === 'guitar' && v ? v.midis : this.pianoNotes(d).map(x => x.midi);
      App.play(midis, style);
    },

    midi() {
      const d = this.data();
      const notes = this.pianoNotes(d).map(x => ({ midi: x.midi, start: 0, dur: 4, vel: x.bass ? 88 : 80 }));
      if (!d.bassTone) notes.unshift({ midi: 36 + T.pc(d.root), start: 0, dur: 4, vel: 88 });
      const ascii = d.sym.replace(/♯/g, '#').replace(/♭/g, 'b');
      const file = 'hop-am-' + ascii.replace('/', '-tren-') + '.mid';
      Midi.download(Midi.build(notes, { bpm: 90, name: ascii }), file);
      App.toast('Đã tải ' + file + '. Kéo file vào Piano roll của FL Studio.');
    },

    render() {
      this.dirty = false;
      const d = this.data();
      const c = T.CHORD[d.type];
      this.rp.update();
      this.labelSeg.update();
      $$('#c-type .type').forEach(b => {
        const on = b.dataset.id === d.type;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      $('#c-name').textContent = d.sym;
      $('#c-read').textContent = T.chordReading(d.root, d.type) + (d.bassTone ? ', bass ' + T.solfegeName(d.bassTone.note) : '');
      $('#c-desc').textContent = c.desc + (c.opt.length ? ' Khi bấm có thể lược bớt: ' + c.opt.map(T.ivText).join(', ') + '.' : '');

      // Công thức: quãng + tên nốt, bấm để nghe
      let rm = 60 + T.pc(d.root);
      if (rm > 66) rm -= 12;
      const f = $('#c-formula');
      f.innerHTML = '';
      d.tones.forEach(t => f.appendChild(App.toneChip(t, rm + T.iv(t.iv).semis)));

      // Nốt bass (hợp âm đảo / slash chord)
      const bs = $('#c-bass');
      bs.innerHTML = '';
      bs.appendChild(h('option', { value: '' }, 'Nốt gốc'));
      d.tones.filter(t => t.iv !== '1').forEach(t => bs.appendChild(
        h('option', { value: t.iv, selected: S.chord.bass === t.iv }, '/' + T.letterName(t.note) + ' (' + T.ivName(t.iv).toLowerCase() + ')')
      ));

      // Cần đàn: mọi nốt của hợp âm mờ, thế đang chọn đậm
      const tun = App.tuning();
      const { vs, v } = this.currentVoicing(d);
      if (S.chord.voicing >= vs.length) S.chord.voicing = 0;
      const marks = App.toneMarks(d.tones, S.chord.label, { ghost: true });
      if (v) {
        const at = new Map(marks.map(m => [m.s + ':' + m.f, m]));
        v.frets.forEach((fr, s) => {
          if (fr < 0) return;
          const m = at.get(s + ':' + fr);
          if (m) { m.ghost = false; m.strong = true; }
        });
      }
      App.board($('#c-board'), {
        marks, onClick: (s, fr, m) => Sound.note(m, { instrument: 'guitar' }),
        aria: 'Các nốt của hợp âm ' + d.sym + ' trên cần đàn',
        window: v ? [v.frets.some(x => x === 0) ? 0 : v.minF, Math.max(1, v.maxF)] : null
      });
      const fams = ['root', 'third', 'fifth', 'seventh', 'ext'].filter(fm => d.tones.some(t => t.family === fm));
      App.legend($('#c-legend'), fams);

      // Thế bấm
      const box = $('#c-voicings');
      box.innerHTML = '';
      if (tun.bass) {
        box.appendChild(h('p', { class: 'empty' }, 'Đàn bass thường chơi từng nốt của hợp âm thay vì bấm cả hợp âm. Hãy xem các nốt trên cần đàn ở trên, bắt đầu từ nốt gốc.'));
      } else if (!vs.length) {
        box.appendChild(h('p', { class: 'empty' }, 'Không có thế bấm dễ cho hợp âm này với cách lên dây hiện tại. Thử bỏ nốt bass hoặc đổi cách lên dây trong Cài đặt.'));
      }
      vs.forEach((vv, i) => {
        const open = vv.maxF <= 3 && vv.frets.some(x => x === 0);
        const cap = open ? 'Thế mở' : 'Phím ' + vv.minF + (vv.barre ? ', chặn' : '');
        box.appendChild(h('button', {
          type: 'button', class: 'vcard' + (i === S.chord.voicing ? ' on' : ''), 'aria-pressed': i === S.chord.voicing ? 'true' : 'false',
          onclick: () => { S.chord.voicing = i; this.render(); App.save(); Sound.chord(vv.midis, { instrument: 'guitar' }); }
        }, App.diagram(vv, 'Thế bấm ' + d.sym + ': ' + cap), h('span', { class: 'vcard-cap' }, cap)));
      });

      // Piano + thế đảo
      const n = d.tones.length;
      const invOpts = [['0', 'Thế gốc']];
      if (n <= 4 && !d.bassTone) for (let k = 1; k < n; k++) invOpts.push([String(k), 'Đảo ' + k]);
      if (S.chord.inv >= n || d.bassTone) S.chord.inv = 0;
      App.seg($('#c-inv'), invOpts, () => String(S.chord.inv), val => {
        S.chord.inv = +val; this.render(); App.save();
        Sound.chord(this.pianoNotes(this.data()).map(x => x.midi), { instrument: 'piano', style: 'block' });
      }, 'Thế đảo trên piano');
      const pn = this.pianoNotes(d);
      Draw.piano($('#c-piano'), {
        start: 36, octaves: 4, compact: true,
        marks: new Map(pn.map(x => [x.midi, { label: App.nn(x.tone.note), fam: x.tone.family }])),
        onClick: m => Sound.note(m, { instrument: 'piano' }), aria: 'Hợp âm ' + d.sym + ' trên piano'
      });
      const fg = PIANO_FINGERS[n];
      $('#c-fing').textContent = d.bassTone ? 'Tay trái giữ nốt bass ' + T.letterName(d.bassTone.note) + ', tay phải bấm các nốt còn lại.'
        : fg ? fg[S.chord.inv] : 'Hợp âm nhiều nốt thường chia cho hai tay: tay trái giữ nốt gốc, tay phải bấm các nốt còn lại.';

      // Thuộc giọng nào
      const kc = $('#c-keys');
      kc.innerHTML = '';
      const ks = T.keysContaining(d.root, d.type);
      if (!ks.length) {
        kc.appendChild(h('p', { class: 'empty' }, 'Hợp âm này không phải hợp âm thuận của giọng trưởng hay thứ tự nhiên nào. Nó thường được mượn từ giọng khác hoặc dùng làm hợp âm nối.'));
      }
      ks.forEach(k => kc.appendChild(h('button', {
        type: 'button', class: 'chip',
        title: 'Mở âm giai ' + T.letterName(k.key) + (k.mode === 'minor' ? ' thứ' : ' trưởng'),
        onclick: () => App.go('scale', st => {
          st.scale.root = T.id(k.key); st.scale.type = k.mode; st.scale.pos = 0;
          st.scale.focus = k.degree - 1; st.scale.sev = SEVENTH_TYPES.has(d.type);
        })
      }, h('strong', null, k.roman), ' trong ' + T.letterName(k.key) + (k.mode === 'minor' ? ' thứ' : ' trưởng'))));
    }
  };
})();
