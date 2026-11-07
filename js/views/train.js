/* Phím & Phím — Trang “Luyện tập”: dựng và đọc tên hợp âm (có bấm giờ), luyện tai, đố nốt trên cần đàn, nhạc lý nhanh. */
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
  // Bài “Dựng hợp âm” và “Đọc tên hợp âm”
  const BUILD_PRESETS = [
    ['triad', 'Ba nốt', ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4']],
    ['seventh', 'Hợp âm 7', ['7', 'maj7', 'm7', 'm7b5', 'dim7', 'mMaj7', '7sus4']],
    ['color', 'Sáu & thêm', ['6', 'm6', 'add9', 'madd9', '69']],
    ['ext', 'Mở rộng 9–13', ['9', 'maj9', 'm9', '7b9', '7#9', '11', 'm11', '13']]
  ];
  // Mẹo suy nhanh từ hợp âm quen thuộc
  const QUICK = {
    maj: 'Nốt gốc, lên 4 nửa cung (3 trưởng), lên thêm 3 nửa cung (3 thứ).',
    min: 'Lấy hợp âm trưởng rồi hạ nốt 3 xuống nửa cung.',
    dim: 'Lấy hợp âm thứ rồi hạ nốt 5 xuống nửa cung (hai quãng 3 thứ chồng lên nhau).',
    aug: 'Lấy hợp âm trưởng rồi nâng nốt 5 lên nửa cung (hai quãng 3 trưởng chồng lên nhau).',
    sus2: 'Bỏ nốt 3, thay bằng nốt 2 (cách gốc một cung).',
    sus4: 'Bỏ nốt 3, thay bằng nốt 4 (cách gốc 5 nửa cung).',
    '5': 'Chỉ có nốt gốc và nốt 5.',
    '7': 'Hợp âm trưởng + ♭7. Mẹo: ♭7 thấp hơn nốt gốc một cung.',
    maj7: 'Hợp âm trưởng + 7. Mẹo: 7 trưởng thấp hơn nốt gốc nửa cung.',
    m7: 'Hợp âm thứ + ♭7 (thấp hơn nốt gốc một cung).',
    m7b5: 'Hợp âm giảm + ♭7 (thấp hơn nốt gốc một cung).',
    dim7: 'Hợp âm giảm + ♭♭7 (thấp hơn nốt gốc 3 nửa cung). Bốn nốt cách đều nhau 3 nửa cung.',
    mMaj7: 'Hợp âm thứ + 7 trưởng (thấp hơn nốt gốc nửa cung).',
    '7sus4': 'Hợp âm sus4 + ♭7.',
    'maj7#5': 'Hợp âm tăng + 7 trưởng.',
    '6': 'Hợp âm trưởng + 6 (cao hơn nốt 5 một cung).',
    m6: 'Hợp âm thứ + 6 trưởng (cao hơn nốt 5 một cung).',
    add9: 'Hợp âm trưởng + 9 (chính là nốt 2, cao hơn gốc một cung). Không có nốt 7.',
    madd9: 'Hợp âm thứ + 9 (cao hơn gốc một cung). Không có nốt 7.',
    '69': 'Hợp âm 6 + 9: 1 – 3 – 5 – 6 – 9.',
    '9': 'Hợp âm 7 + 9 (cao hơn gốc một cung).',
    maj9: 'Hợp âm maj7 + 9.',
    m9: 'Hợp âm m7 + 9.',
    '7b9': 'Hợp âm 7 + ♭9 (cao hơn gốc nửa cung).',
    '7#9': 'Hợp âm 7 + ♯9 (cùng phím với ♭3, nên nghe vừa trưởng vừa thứ).',
    '11': 'Hợp âm 9 + 11 (chính là nốt 4).',
    m11: 'Hợp âm m9 + 11 (chính là nốt 4).',
    '13': 'Hợp âm 9 + 13 (chính là nốt 6).'
  };
  const fmtTime = ms => (ms / 1000).toFixed(1) + ' s';

  const PC_NAMES = ['C', 'C♯/D♭', 'D', 'D♯/E♭', 'E', 'F', 'F♯/G♭', 'G', 'G♯/A♭', 'A', 'A♯/B♭', 'B'];
  const PC_SOLF = ['Đô', 'Đô♯/Rê♭', 'Rê', 'Rê♯/Mi♭', 'Mi', 'Fa', 'Fa♯/Sol♭', 'Sol', 'Sol♯/La♭', 'La', 'La♯/Si♭', 'Si'];

  const V = App.views.train = {
    q: null,
    mount() {
      this.modeSeg = App.seg($('#t-mode'), [['build', 'Dựng hợp âm'], ['name', 'Đọc tên hợp âm'], ['interval', 'Nghe quãng'], ['chord', 'Nghe hợp âm'], ['fret', 'Nốt trên cần đàn'], ['theory', 'Nhạc lý nhanh']],
        () => S.train.mode, v => { S.train.mode = v; this.q = null; this.render(); App.save(); }, 'Bài luyện');
      $('#t-next').addEventListener('click', () => { this.q = null; this.render(); });
      $('#t-replay').addEventListener('click', () => { if (this.q && this.q.play) this.q.play(); });
      $('#t-reset').addEventListener('click', () => { S.train.stats[S.train.mode] = { c: 0, t: 0, streak: 0, best: 0, ms: 0, n: 0, fast: 0 }; this.renderStats(); App.save(); });
    },
    leave() { Sound.stopGroup('free'); this.stopTimer(); },

    /* ---------- đồng hồ bấm giờ cho bài dựng/đọc hợp âm ---------- */
    startTimer() {
      this.stopTimer();
      const el = $('#t-timer');
      el.hidden = false;
      const tick = () => { if (this.q && !this.q.done) el.textContent = fmtTime(performance.now() - this.q.t0); };
      tick();
      this.timer = setInterval(tick, 100);
    },
    stopTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; },

    stats() {
      const m = S.train.mode;
      if (!S.train.stats[m]) S.train.stats[m] = { c: 0, t: 0, streak: 0, best: 0 };
      const st = S.train.stats[m];
      if (st.ms === undefined) { st.ms = 0; st.n = 0; st.fast = 0; }
      return S.train.stats[m];
    },

    /* ---------- tạo câu hỏi ---------- */
    buildPool() {
      const set = (S.train.buildSet || []).filter(id => T.CHORD[id]);
      return set.length ? set : ['maj', 'min'];
    },
    randomChord() {
      const type = pick(this.buildPool());
      const natural = S.train.buildRoots !== 'all';
      // Phím đen: chọn giữa tên thăng/giáng sao cho hợp âm ít dấu hóa nhất, tránh dấu kép (F♯m thay vì G♭m)
      const cost = r => T.chordTones(r, type).reduce((n, t) => n + Math.abs(t.note.a) + (Math.abs(t.note.a) > 1 ? 10 : 0), 0);
      let root, guard = 0;
      do {
        const p = natural ? [0, 2, 4, 5, 7, 9, 11][rand(0, 6)] : rand(0, 11);
        const cands = shuffle([T.fromPc(p, 'sharp'), T.fromPc(p, 'flat')]);
        root = cost(cands[0]) <= cost(cands[1]) ? cands[0] : cands[1];
        guard++;
      } while (guard < 30 && this.q && this.q.root && T.letterName(root) === T.letterName(this.q.root) && this.q.type === type);
      return { root, type, tones: T.chordTones(root, type) };
    },
    formula(type) { return T.CHORD[type].iv.map(T.ivText).join(' – '); },
    spelled(tones) {
      return tones.map(t => {
        const n = App.nn(t.note), common = App.nn(T.fromPc(t.pc, 'common'));
        return n + (n !== common ? ' (= phím ' + common + ')' : '');
      }).join(' – ');
    },

    make(mode) {
      if (mode === 'build') {
        const { root, type, tones } = this.randomChord();
        const sym = T.chordSymbol(root, type);
        const midis = T.closeVoicing(root, type, 0).map(x => x.midi);
        return {
          kind: 'build', root, type, tones, sym, silent: true, t0: performance.now(),
          prompt: 'Bấm đủ ' + tones.length + ' nốt của hợp âm ' + sym,
          sub: T.CHORD[type].name,
          picked: new Set(), play: () => Sound.chord(midis, { instrument: S.settings.instrument }),
          explain: () => sym + ' = ' + this.formula(type) + ' → ' + this.spelled(tones) + '. Mẹo: ' + QUICK[type]
        };
      }
      if (mode === 'name') {
        const { root, type, tones } = this.randomChord();
        const sym = T.chordSymbol(root, type);
        const key = ps => ps.map(t => t.pc).sort((a, b) => a - b).join(',');
        const ansKey = key(tones);
        const cands = [];
        // Cùng nốt gốc, khác loại (ưu tiên cùng số nốt) — đây là chỗ dễ nhầm nhất
        T.CHORDS.forEach(c => { if (c.id !== type && c.id !== '5') cands.push({ root, type: c.id, w: (c.iv.length === tones.length ? 3 : 1) + (this.buildPool().includes(c.id) ? 2 : 0) }); });
        // Cùng loại, khác nốt gốc (một quãng 3 hoặc nửa cung)
        ['b3', '3', '2', '7'].forEach(ivx => {
          const r2 = T.transpose(root, ivx);
          if (Math.abs(r2.a) <= 1) cands.push({ root: r2, type, w: 3 });
        });
        const seen = new Set([sym]);
        const opts = [sym];
        shuffle(cands).sort((a, b) => b.w - a.w).forEach(c => {
          if (opts.length >= 4) return;
          const s2 = T.chordSymbol(c.root, c.type);
          if (seen.has(s2) || key(T.chordTones(c.root, c.type)) === ansKey) return; // bỏ hợp âm đồng âm (vd. Am7 và C6)
          seen.add(s2);
          opts.push(s2);
        });
        const shown = S.train.nameShuffle ? shuffle(tones) : tones;
        const midis = T.closeVoicing(root, type, 0).map(x => x.midi);
        return {
          kind: 'name', silent: true, t0: performance.now(), root, type,
          prompt: 'Các nốt ' + shown.map(t => App.nn(t.note)).join(' – ') + ' là hợp âm gì?',
          sub: S.train.nameShuffle ? 'Các nốt đã bị xáo thứ tự: hãy tìm nốt gốc trước.' : 'Nốt đầu tiên là nốt gốc.',
          options: shuffle(opts), answer: sym, label: x => x,
          play: () => Sound.chord(midis, { instrument: S.settings.instrument }),
          explain: () => sym + ' = ' + this.formula(type) + ' tính từ ' + App.nn(root) + ': ' + tones.map(t => App.nn(t.note)).join(' – ') + '. ' + QUICK[type]
        };
      }
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
      } else if (mode === 'build' || mode === 'name') {
        const pool = S.train.buildSet;
        const toggle = id => {
          const i = pool.indexOf(id);
          if (i >= 0 && pool.length > 1) pool.splice(i, 1);
          else if (i < 0) pool.push(id);
          this.q = null; this.render(); App.save();
        };
        const presets = h('div', { class: 'chips', role: 'group', 'aria-label': 'Chọn nhanh nhóm hợp âm' });
        BUILD_PRESETS.forEach(([, label, ids]) => {
          const on = ids.every(id => pool.includes(id));
          presets.appendChild(h('button', {
            type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false',
            onclick: () => {
              if (on) { ids.forEach(id => { const i = pool.indexOf(id); if (i >= 0 && pool.length > 1) pool.splice(i, 1); }); }
              else ids.forEach(id => { if (!pool.includes(id)) pool.push(id); });
              this.q = null; this.render(); App.save();
            }
          }, label));
        });
        const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'Các loại hợp âm được hỏi' });
        BUILD_PRESETS.forEach(([, , ids]) => ids.forEach(id => {
          const on = pool.includes(id);
          chips.appendChild(h('button', {
            type: 'button', class: 'chip sm' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', title: T.CHORD[id].name,
            onclick: () => toggle(id)
          }, 'C' + T.CHORD[id].sym));
        }));
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Nhóm hợp âm'), presets));
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Từng loại (ví dụ viết với nốt gốc C)'), chips));
        const rootEl = h('div');
        box.appendChild(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Nốt gốc'), rootEl));
        App.seg(rootEl, [['natural', 'Nốt tự nhiên (C D E…)'], ['all', 'Cả thăng/giáng']], () => S.train.buildRoots, v => { S.train.buildRoots = v; this.q = null; this.render(); App.save(); }, 'Nốt gốc');
        if (mode === 'name') {
          const cb = h('input', { type: 'checkbox', checked: S.train.nameShuffle, onchange: e => { S.train.nameShuffle = e.target.checked; this.q = null; this.render(); App.save(); } });
          box.appendChild(h('label', { class: 'check' }, cb, 'Xáo thứ tự các nốt (khó hơn)'));
        } else {
          box.appendChild(h('p', { class: 'hint' }, 'Bấm các nốt của hợp âm trên bảng 12 nốt; đủ số nốt là tự chấm. Trả lời theo phím đàn, nên E♯ và F tính là một. Đáp án sẽ ghi đúng tên nốt theo nhạc lý. Bỏ chọn bằng cách bấm lại.'));
        }
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
      const rows = [['Đúng', st.c + '/' + st.t], ['Tỉ lệ', pct], ['Chuỗi đúng', st.streak], ['Kỷ lục', st.best]];
      if (S.train.mode === 'build' || S.train.mode === 'name') {
        rows.push(['Thời gian TB (câu đúng)', st.n ? fmtTime(st.ms / st.n) : '–'], ['Nhanh nhất', st.fast ? fmtTime(st.fast) : '–']);
      }
      rows.forEach(([k, v]) =>
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
      const sub = $('#t-sub');
      sub.textContent = q.sub || '';
      sub.hidden = !q.sub;
      if (q.t0) { q.t0 = performance.now(); this.startTimer(); } else { this.stopTimer(); $('#t-timer').hidden = true; }
      $('#t-replay').hidden = !!q.silent;
      const ex = $('#t-extra');
      ex.innerHTML = '';
      if (q.extra) ex.appendChild(App.btn('Nghe rải', 'arp', () => q.extra(), 'ghost sm'));
      if (q.kind === 'build') {
        ex.appendChild(App.btn('Gợi ý công thức', null, e => {
          q.hinted = true;
          e.currentTarget.disabled = true;
          $('#t-feedback').className = 'feedback';
          $('#t-feedback').textContent = 'Công thức ' + T.CHORD[q.type].name.toLowerCase() + ': ' + this.formula(q.type) + '. ' + QUICK[q.type];
        }, 'ghost sm'));
      }
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
      box.classList.toggle('notes12', q.kind === 'build');
      $('#t-feedback').textContent = '';
      $('#t-feedback').className = 'feedback';
      $('#t-next').hidden = true;
      if (q.kind === 'build') { this.renderBuild(box); return; }
      q.options.forEach(opt => box.appendChild(h('button', {
        type: 'button', class: 'answer', 'data-v': String(opt),
        onclick: e => this.answer(opt, e.currentTarget)
      }, q.label(opt))));
      $('#t-feedback').textContent = '';
      $('#t-feedback').className = 'feedback';
      $('#t-next').hidden = true;
    },

    renderBuild(box) {
      const q = this.q;
      const names = S.settings.naming === 'solfege' ? PC_SOLF : PC_NAMES;
      for (let p = 0; p < 12; p++) {
        box.appendChild(h('button', {
          type: 'button', class: 'answer note' + ([1, 3, 6, 8, 10].includes(p) ? ' black' : ''), 'data-pc': String(p), 'aria-pressed': 'false',
          onclick: e => {
            if (q.done) return;
            const b = e.currentTarget;
            if (q.picked.has(p)) q.picked.delete(p); else q.picked.add(p);
            b.classList.toggle('picked', q.picked.has(p));
            b.setAttribute('aria-pressed', q.picked.has(p) ? 'true' : 'false');
            if (q.picked.has(p)) Sound.note(60 + p, { instrument: 'piano', dur: 0.6, vel: 0.5 });
            if (q.picked.size === q.tones.length) this.checkBuild();
          }
        }, names[p]));
      }
    },

    record(ok) {
      const q = this.q;
      const st = this.stats();
      st.t++;
      if (ok) {
        st.c++; st.streak++; st.best = Math.max(st.best, st.streak);
        if (q.t0) {
          const ms = performance.now() - q.t0;
          q.ms = ms;
          st.ms += ms; st.n++;
          if (!q.hinted && (!st.fast || ms < st.fast)) st.fast = ms;
        }
      } else st.streak = 0;
      App.save();
      this.stopTimer();
      if (q.ms) $('#t-timer').textContent = fmtTime(q.ms);
    },

    checkBuild() {
      const q = this.q;
      q.done = true;
      const want = new Set(q.tones.map(t => t.pc));
      const ok = q.picked.size === want.size && [...q.picked].every(p => want.has(p));
      this.record(ok);
      $$('#t-answers .answer').forEach(b => {
        const p = +b.dataset.pc;
        b.disabled = true;
        const inChord = want.has(p), sel = q.picked.has(p);
        if (inChord) {
          b.classList.add(sel ? 'right' : 'missed');
          const tone = q.tones.find(t => t.pc === p);
          b.appendChild(h('span', { class: 'note-iv' }, T.ivShort(tone.iv)));
        } else if (sel) b.classList.add('wrong');
      });
      const fb = $('#t-feedback');
      fb.className = 'feedback ' + (ok ? 'ok' : 'no');
      fb.textContent = (ok ? 'Chính xác' + (q.ms ? ' (' + fmtTime(q.ms) + ')' : '') + '. ' : 'Chưa đúng. ') + q.explain();
      q.play();
      this.renderStats();
      const next = $('#t-next');
      next.hidden = false;
      next.focus();
    },

    answer(opt, btn) {
      const q = this.q;
      if (!q || q.done) return;
      q.done = true;
      const ok = opt === q.answer;
      this.record(ok);
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
      } else if (q.kind === 'name') q.play();
      else if (!ok && q.play) setTimeout(() => q.play(), 300);
      this.renderStats();
      const next = $('#t-next');
      next.hidden = false;
      next.focus();
    }
  };
})();
