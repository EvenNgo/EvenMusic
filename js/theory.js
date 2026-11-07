/* Phím & Phím — js/theory.js
 * Lõi nhạc lý: nốt, quãng, hợp âm, âm giai, hợp âm thuận, thế bấm guitar,
 * nhận diện hợp âm và dẫn giọng (voice leading) cho piano/MIDI.
 * Không dùng DOM nên có thể chạy và kiểm thử bằng Node.
 */
(function (global) {
  'use strict';

  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const SOLFEGE = ['Đô', 'Rê', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const MAJOR_SEMIS = [0, 2, 4, 5, 7, 9, 11];
  const mod = (n, m) => ((n % m) + m) % m;

  const T = { naming: 'letter' };

  /* ------------------------------------------------------------------ */
  /* Nốt                                                                 */
  /* ------------------------------------------------------------------ */
  function note(l, a) { return { l: mod(l, 7), a: a || 0 }; }
  function pc(n) { return mod(LETTER_PC[n.l] + n.a, 12); }
  function same(a, b) { return !!a && !!b && a.l === b.l && a.a === b.a; }

  function parseNote(str) {
    const m = /^([A-Ga-g])([#b♯♭x]*)$/.exec(String(str).trim());
    if (!m) return null;
    let a = 0;
    for (const ch of m[2]) a += (ch === '#' || ch === '♯') ? 1 : (ch === 'x') ? 2 : -1;
    return note(LETTERS.indexOf(m[1].toUpperCase()), a);
  }

  function accText(a) {
    if (!a) return '';
    return a > 0 ? '♯'.repeat(a) : '♭'.repeat(-a);
  }
  function name(n, mode) {
    const base = (mode || T.naming) === 'solfege' ? SOLFEGE[n.l] : LETTERS[n.l];
    return base + accText(n.a);
  }
  function letterName(n) { return LETTERS[n.l] + accText(n.a); }
  function solfegeName(n) { return SOLFEGE[n.l] + accText(n.a); }
  function id(n) { return LETTERS[n.l] + (n.a > 0 ? '#'.repeat(n.a) : 'b'.repeat(-n.a)); }

  const SPELL = {
    sharp: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    flat: ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'],
    common: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
  };
  function fromPc(p, pref) { return parseNote((SPELL[pref] || SPELL.common)[mod(p, 12)]); }

  function midiOf(n, octave) { return (octave + 1) * 12 + LETTER_PC[n.l] + n.a; }
  function parsePitch(str) {
    const m = /^([A-Ga-g][#b♯♭x]*)(-?\d)$/.exec(String(str).trim());
    if (!m) return null;
    const n = parseNote(m[1]);
    return { note: n, midi: midiOf(n, +m[2]) };
  }
  function octaveOf(midi) { return Math.floor(midi / 12) - 1; }
  function midiName(m, pref) { return name(fromPc(m, pref)) + octaveOf(m); }
  function freq(m, a4) { return (a4 || 440) * Math.pow(2, (m - 69) / 12); }

  /* ------------------------------------------------------------------ */
  /* Quãng                                                               */
  /* ------------------------------------------------------------------ */
  const ivCache = {};
  function iv(s) {
    if (ivCache[s]) return ivCache[s];
    const m = /^(bb|b|##|#)?(\d+)$/.exec(s);
    if (!m) throw new Error('Quãng không hợp lệ: ' + s);
    const acc = { bb: -2, b: -1, '#': 1, '##': 2 }[m[1]] || 0;
    const num = +m[2];
    const deg = (num - 1) % 7, oct = Math.floor((num - 1) / 7);
    return (ivCache[s] = { str: s, num, deg, oct, acc, semis: MAJOR_SEMIS[deg] + 12 * oct + acc });
  }

  /** Dời một nốt theo quãng, giữ đúng tên chữ (C → quãng 3 thứ → E♭, không phải D♯). */
  function transpose(n, s) {
    const I = typeof s === 'string' ? iv(s) : s;
    const l = mod(n.l + I.deg, 7);
    let a = mod(pc(n) + I.semis - LETTER_PC[l], 12);
    if (a > 6) a -= 12;
    return note(l, a);
  }

  /** Quãng đi lên từ nốt a đến nốt b (trong phạm vi một quãng 8), ví dụ C→B♭ = 'b7'. */
  function between(a, b) {
    const d = mod(b.l - a.l, 7);
    let acc = mod(pc(b) - pc(a), 12) - MAJOR_SEMIS[d];
    if (acc > 6) acc -= 12;
    if (acc < -6) acc += 12;
    return (acc > 0 ? '#'.repeat(acc) : 'b'.repeat(-acc)) + (d + 1);
  }

  const IV_VI = {
    '1': 'đồng âm', '#1': 'đồng âm tăng', 'b2': '2 thứ', '2': '2 trưởng', '#2': '2 tăng',
    'bb3': '3 giảm', 'b3': '3 thứ', '3': '3 trưởng', '#3': '3 tăng', 'b4': '4 giảm',
    '4': '4 đúng', '#4': '4 tăng', 'b5': '5 giảm', '5': '5 đúng', '#5': '5 tăng',
    'b6': '6 thứ', '6': '6 trưởng', '#6': '6 tăng', 'bb7': '7 giảm', 'b7': '7 thứ',
    '7': '7 trưởng', '8': '8 đúng', 'b9': '9 thứ', '9': '9 trưởng', '#9': '9 tăng',
    '11': '11 đúng', '#11': '11 tăng', 'b13': '13 thứ', '13': '13 trưởng'
  };
  function ivText(s) { return s.replace('bb', '♭♭').replace('b', '♭').replace('##', '♯♯').replace('#', '♯'); }
  function ivShort(s) { return s === '1' ? 'R' : ivText(s); }
  function ivName(s) {
    if (s === '1') return 'Nốt gốc';
    return 'Quãng ' + (IV_VI[s] || ivText(s));
  }
  /** Nhóm màu: nốt gốc, quãng 3, quãng 5, quãng 7, nốt mở rộng (2/9, 4/11, 6/13). */
  function ivFamily(s) {
    return ['root', 'ext', 'third', 'ext', 'fifth', 'ext', 'seventh'][iv(s).deg];
  }

  /** Quãng theo số nửa cung — dùng cho bài luyện tai. */
  const SEMI_IV = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7', '8'];
  const SEMI_NAMES = ['Đồng âm', '2 thứ', '2 trưởng', '3 thứ', '3 trưởng', '4 đúng',
    'Ba cung (4 tăng / 5 giảm)', '5 đúng', '6 thứ', '6 trưởng', '7 thứ', '7 trưởng', 'Quãng 8'];

  /* ------------------------------------------------------------------ */
  /* Hợp âm                                                              */
  /* ------------------------------------------------------------------ */
  const CHORDS = [
    // Ba nốt
    { id: 'maj', sym: '', name: 'Trưởng', read: 'trưởng', iv: ['1', '3', '5'], group: 'Ba nốt',
      desc: 'Sáng, vững, vui tươi. Nền tảng của hầu hết các bài hát.' },
    { id: 'min', sym: 'm', name: 'Thứ', read: 'thứ', iv: ['1', 'b3', '5'], group: 'Ba nốt',
      desc: 'Buồn, sâu lắng. Chỉ khác hợp âm trưởng ở một nốt: quãng 3 hạ xuống nửa cung.' },
    { id: 'dim', sym: 'dim', name: 'Giảm', read: 'giảm', iv: ['1', 'b3', 'b5'], group: 'Ba nốt',
      desc: 'Căng và bất ổn, luôn muốn được giải quyết. Là hợp âm bậc vii° trong giọng trưởng.' },
    { id: 'aug', sym: 'aug', name: 'Tăng', read: 'tăng', iv: ['1', '3', '#5'], group: 'Ba nốt',
      desc: 'Lơ lửng, bí ẩn như đang chờ đợi. Hay dùng làm hợp âm nối giữa hai hợp âm.' },
    { id: 'sus2', sym: 'sus2', name: 'Treo 2', read: 'treo 2', iv: ['1', '2', '5'], group: 'Ba nốt',
      desc: 'Thay quãng 3 bằng quãng 2: trong trẻo, mở, không hẳn trưởng cũng không hẳn thứ.' },
    { id: 'sus4', sym: 'sus4', name: 'Treo 4', read: 'treo 4', iv: ['1', '4', '5'], group: 'Ba nốt',
      desc: 'Thay quãng 3 bằng quãng 4: tạo độ căng nhẹ, thường giải quyết về hợp âm trưởng.' },
    { id: '5', sym: '5', name: 'Power chord', read: 'năm (power chord)', iv: ['1', '5'], group: 'Ba nốt',
      desc: 'Chỉ có nốt gốc và quãng 5: dày, mạnh, rất hợp với guitar điện có distortion.' },
    // Bảy
    { id: '7', sym: '7', name: 'Bảy (át)', read: 'bảy', iv: ['1', '3', '5', 'b7'], opt: ['5'], group: 'Bảy',
      desc: 'Hợp âm át: trưởng thêm quãng 7 thứ. Rất căng, muốn đi về chủ âm (V7 → I). Nền của blues.' },
    { id: 'maj7', sym: 'maj7', name: 'Bảy trưởng', read: 'bảy trưởng', iv: ['1', '3', '5', '7'], opt: ['5'], group: 'Bảy',
      desc: 'Trưởng thêm quãng 7 trưởng: mơ màng, lãng mạn, rất hợp ballad, indie, R&B.' },
    { id: 'm7', sym: 'm7', name: 'Bảy thứ', read: 'thứ bảy', iv: ['1', 'b3', '5', 'b7'], opt: ['5'], group: 'Bảy',
      desc: 'Thứ thêm quãng 7 thứ: mềm, “chill”, dùng nhiều trong pop, R&B, lo-fi.' },
    { id: 'm7b5', sym: 'm7♭5', name: 'Nửa giảm', read: 'nửa giảm', iv: ['1', 'b3', 'b5', 'b7'], group: 'Bảy',
      desc: 'Hợp âm bậc ii trong giọng thứ (iiø7 → V7 → i). Màu sắc jazz, u buồn.' },
    { id: 'dim7', sym: 'dim7', name: 'Bảy giảm', read: 'bảy giảm', iv: ['1', 'b3', 'b5', 'bb7'], group: 'Bảy',
      desc: 'Bốn nốt cách đều nhau 3 nửa cung: rất căng, kịch tính, hay dùng để nối hợp âm.' },
    { id: 'mMaj7', sym: 'm(maj7)', name: 'Thứ bảy trưởng', read: 'thứ bảy trưởng', iv: ['1', 'b3', '5', '7'], opt: ['5'], group: 'Bảy',
      desc: 'Thứ thêm quãng 7 trưởng: bí ẩn, đậm chất nhạc phim.' },
    { id: '7sus4', sym: '7sus4', name: 'Bảy treo 4', read: 'bảy treo 4', iv: ['1', '4', '5', 'b7'], opt: ['5'], group: 'Bảy',
      desc: 'Hợp âm át được “treo”: mềm hơn hợp âm 7, thường đứng trước V7 hoặc thay cho nó.' },
    { id: 'maj7#5', sym: 'maj7♯5', name: 'Bảy trưởng tăng', read: 'bảy trưởng tăng', iv: ['1', '3', '#5', '7'], group: 'Bảy',
      desc: 'Có trong âm giai thứ hòa âm và thứ giai điệu. Nghe lạ, mơ hồ, hiện đại.' },
    // Sáu & thêm nốt
    { id: '6', sym: '6', name: 'Sáu', read: 'sáu', iv: ['1', '3', '5', '6'], opt: ['5'], group: 'Sáu & thêm',
      desc: 'Trưởng thêm quãng 6: ấm áp, cổ điển, phảng phất jazz và swing.' },
    { id: 'm6', sym: 'm6', name: 'Thứ sáu', read: 'thứ sáu', iv: ['1', 'b3', '5', '6'], opt: ['5'], group: 'Sáu & thêm',
      desc: 'Thứ thêm quãng 6 trưởng: u buồn kiểu cổ điển, gặp nhiều trong bossa nova.' },
    { id: 'add9', sym: 'add9', name: 'Thêm 9', read: 'thêm chín', iv: ['1', '3', '5', '9'], opt: ['5'], group: 'Sáu & thêm',
      desc: 'Trưởng thêm nốt 9 (không có quãng 7): lấp lánh, hiện đại, rất phổ biến trong pop và ballad.' },
    { id: 'madd9', sym: 'm(add9)', name: 'Thứ thêm 9', read: 'thứ thêm chín', iv: ['1', 'b3', '5', '9'], opt: ['5'], group: 'Sáu & thêm',
      desc: 'Thứ thêm nốt 9: buồn nhưng có chiều sâu, giàu cảm xúc.' },
    { id: '69', sym: '6/9', name: 'Sáu chín', read: 'sáu chín', iv: ['1', '3', '5', '6', '9'], opt: ['5'], group: 'Sáu & thêm',
      desc: 'Sáng và mở, dùng để kết bài rất đẹp trong jazz và bossa nova.' },
    // Mở rộng
    { id: '9', sym: '9', name: 'Chín (át)', read: 'chín', iv: ['1', '3', '5', 'b7', '9'], opt: ['5'], group: 'Mở rộng',
      desc: 'Hợp âm 7 thêm nốt 9: chất funk, soul, blues.' },
    { id: 'maj9', sym: 'maj9', name: 'Chín trưởng', read: 'chín trưởng', iv: ['1', '3', '5', '7', '9'], opt: ['5'], group: 'Mở rộng',
      desc: 'Bảy trưởng thêm nốt 9: mượt mà, sang trọng, đặc trưng neo-soul và R&B.' },
    { id: 'm9', sym: 'm9', name: 'Chín thứ', read: 'thứ chín', iv: ['1', 'b3', '5', 'b7', '9'], opt: ['5'], group: 'Mở rộng',
      desc: 'Bảy thứ thêm nốt 9: rất mượt, gặp nhiều trong lo-fi và neo-soul.' },
    { id: '7b9', sym: '7♭9', name: 'Bảy chín thứ', read: 'bảy chín thứ', iv: ['1', '3', '5', 'b7', 'b9'], opt: ['5'], group: 'Mở rộng',
      desc: 'Hợp âm át với quãng 9 thứ: tối và căng, kéo rất mạnh về hợp âm thứ (V7♭9 → i).' },
    { id: '7#9', sym: '7♯9', name: 'Bảy chín tăng', read: 'bảy chín tăng', iv: ['1', '3', '5', 'b7', '#9'], opt: ['5'], group: 'Mở rộng',
      desc: '“Hợp âm Hendrix”: vừa trưởng vừa thứ, gai góc, chất rock và funk.' },
    { id: '11', sym: '11', name: 'Mười một', read: 'mười một', iv: ['1', '3', '5', 'b7', '9', '11'], opt: ['3', '5', '9'], group: 'Mở rộng',
      desc: 'Thường bỏ nốt 3 nên nghe như 9sus4: rộng, thoáng, chất gospel và funk.' },
    { id: 'm11', sym: 'm11', name: 'Thứ mười một', read: 'thứ mười một', iv: ['1', 'b3', '5', 'b7', '9', '11'], opt: ['5', '9'], group: 'Mở rộng',
      desc: 'Rộng và thoáng, rất hay dùng trong neo-soul.' },
    { id: '13', sym: '13', name: 'Mười ba', read: 'mười ba', iv: ['1', '3', '5', 'b7', '9', '13'], opt: ['5', '9'], group: 'Mở rộng',
      desc: 'Hợp âm át đầy đặn của jazz và funk. Thường lược bớt nốt 5 và 9 khi bấm.' }
  ];
  const CHORD = {};
  CHORDS.forEach((c, i) => { c.order = i; c.opt = c.opt || []; CHORD[c.id] = c; });
  const CHORD_GROUPS = ['Ba nốt', 'Bảy', 'Sáu & thêm', 'Mở rộng'];

  /** Ký hiệu hợp âm luôn dùng chữ cái (Am7, F♯m) — đây là cách viết chuẩn trên bản nhạc. */
  function chordSymbol(root, typeId, bass) {
    let s = letterName(root) + CHORD[typeId].sym;
    if (bass && !same(bass, root)) s += '/' + letterName(bass);
    return s;
  }
  function chordReading(root, typeId) { return solfegeName(root) + ' ' + CHORD[typeId].read; }
  function chordTones(root, typeId) {
    const c = CHORD[typeId];
    return c.iv.map(s => {
      const n = transpose(root, s);
      return { iv: s, note: n, pc: pc(n), opt: c.opt.includes(s), family: ivFamily(s) };
    });
  }

  /* ------------------------------------------------------------------ */
  /* Âm giai                                                             */
  /* ------------------------------------------------------------------ */
  const SCALES = [
    { id: 'major', name: 'Trưởng', alias: 'Ionian', iv: ['1', '2', '3', '4', '5', '6', '7'], group: 'Cơ bản', roman: 'self', mode: 'major',
      desc: 'Âm giai nền tảng: sáng, vui, vững chãi. Mọi hợp âm thuận của giọng trưởng đều xây từ đây.' },
    { id: 'minor', name: 'Thứ tự nhiên', alias: 'Aeolian', iv: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], group: 'Cơ bản', roman: 'self', mode: 'minor',
      desc: 'Buồn, trữ tình. Dùng chung các nốt với giọng trưởng cách nó một quãng 3 thứ đi lên (La thứ và Đô trưởng).' },
    { id: 'majPent', name: 'Ngũ cung trưởng', iv: ['1', '2', '3', '5', '6'], group: 'Cơ bản',
      desc: 'Năm nốt, bỏ bậc 4 và 7 của giọng trưởng nên rất khó “nghịch tai”. Dễ ứng tác, gần với giai điệu dân gian Á Đông.' },
    { id: 'minPent', name: 'Ngũ cung thứ', iv: ['1', 'b3', '4', '5', 'b7'], group: 'Cơ bản',
      desc: 'Nền tảng của solo guitar rock và blues. Thuộc 5 vị trí là phủ được cả cần đàn.' },
    { id: 'blues', name: 'Blues', iv: ['1', 'b3', '4', 'b5', '5', 'b7'], group: 'Cơ bản',
      desc: 'Ngũ cung thứ thêm “nốt blue” (♭5): chất blues, rock, soul.' },
    { id: 'harmonicMinor', name: 'Thứ hòa âm', iv: ['1', '2', 'b3', '4', '5', 'b6', '7'], group: 'Giọng thứ mở rộng', roman: 'self',
      desc: 'Thứ tự nhiên nâng bậc 7 lên nửa cung, tạo ra hợp âm V trưởng (V7 → i). Màu cổ điển, phảng phất Trung Đông.' },
    { id: 'melodicMinor', name: 'Thứ giai điệu', iv: ['1', '2', 'b3', '4', '5', '6', '7'], group: 'Giọng thứ mở rộng', roman: 'self',
      desc: 'Nâng cả bậc 6 và bậc 7 (khi đi lên). Dùng nhiều trong jazz.' },
    { id: 'dorian', name: 'Dorian', iv: ['1', '2', 'b3', '4', '5', '6', 'b7'], group: 'Điệu thức (mode)', roman: 'major',
      desc: 'Thứ nhưng có bậc 6 trưởng nên sáng và “ngầu” hơn. Chất funk, R&B, jazz.' },
    { id: 'phrygian', name: 'Phrygian', iv: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], group: 'Điệu thức (mode)', roman: 'major',
      desc: 'Thứ với bậc ♭2: tối, căng, chất Tây Ban Nha và metal.' },
    { id: 'lydian', name: 'Lydian', iv: ['1', '2', '3', '#4', '5', '6', '7'], group: 'Điệu thức (mode)', roman: 'major',
      desc: 'Trưởng với bậc ♯4: lơ lửng, mơ mộng, rất “nhạc phim”.' },
    { id: 'mixolydian', name: 'Mixolydian', iv: ['1', '2', '3', '4', '5', '6', 'b7'], group: 'Điệu thức (mode)', roman: 'major',
      desc: 'Trưởng với bậc ♭7: vui nhưng “bụi”. Hợp với hợp âm 7, chất rock, blues, funk.' },
    { id: 'locrian', name: 'Locrian', iv: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], group: 'Điệu thức (mode)', roman: 'major',
      desc: 'Tối và bất ổn nhất (♭2, ♭5). Hiếm khi làm giọng chính, hợp với hợp âm m7♭5.' },
    { id: 'majBlues', name: 'Blues trưởng', iv: ['1', '2', 'b3', '3', '5', '6'], group: 'Khác',
      desc: 'Ngũ cung trưởng thêm ♭3: vui tươi kiểu country và blues trưởng.' },
    { id: 'phrygianDom', name: 'Phrygian dominant', iv: ['1', 'b2', '3', '4', '5', 'b6', 'b7'], group: 'Khác', roman: 'major',
      desc: 'Điệu thức thứ 5 của âm giai thứ hòa âm: chất Trung Đông, flamenco, metal.' },
    { id: 'wholeTone', name: 'Toàn cung', iv: ['1', '2', '3', '#4', '#5', 'b7'], group: 'Khác',
      desc: 'Sáu nốt cách đều một cung: mơ hồ như trong giấc mơ.' },
    { id: 'dimHW', name: 'Giảm nửa–nguyên', iv: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'], group: 'Khác',
      desc: 'Tám nốt xen kẽ nửa cung và một cung. Jazz dùng âm giai này trên hợp âm 7♭9.' }
  ];
  const SCALE = {};
  SCALES.forEach((s, i) => { s.order = i; SCALE[s.id] = s; });
  const SCALE_GROUPS = ['Cơ bản', 'Giọng thứ mở rộng', 'Điệu thức (mode)', 'Khác'];

  function scaleTones(root, scaleId) {
    return SCALE[scaleId].iv.map((s, i) => {
      const n = transpose(root, s);
      return { iv: s, note: n, pc: pc(n), degree: i + 1, family: ivFamily(s) };
    });
  }

  /** Khoảng cách giữa các nốt liền nhau: C = một cung, N = nửa cung. */
  function stepPattern(scaleId) {
    const semis = SCALE[scaleId].iv.map(s => iv(s).semis);
    semis.push(12);
    const out = [];
    for (let i = 1; i < semis.length; i++) {
      const d = semis[i] - semis[i - 1];
      out.push(d === 1 ? 'N' : d === 2 ? 'C' : d === 3 ? '1C½' : d + ' nc');
    }
    return out;
  }

  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
  const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];  // B E A D G C F
  function keySignature(notes) {
    const sharps = notes.filter(n => n.a > 0).sort((x, y) => SHARP_ORDER.indexOf(x.l) - SHARP_ORDER.indexOf(y.l));
    const flats = notes.filter(n => n.a < 0).sort((x, y) => FLAT_ORDER.indexOf(x.l) - FLAT_ORDER.indexOf(y.l));
    return {
      sharps, flats,
      count: sharps.reduce((t, n) => t + n.a, 0) - flats.reduce((t, n) => t + n.a, 0),
      text: sharps.length ? sharps.length + '♯' : flats.length ? flats.length + '♭' : 'Không dấu'
    };
  }

  /* ------------------------------------------------------------------ */
  /* Hợp âm thuận & số La Mã                                             */
  /* ------------------------------------------------------------------ */
  const QUAL = {
    '4,7': 'maj', '3,7': 'min', '3,6': 'dim', '4,8': 'aug',
    '4,7,11': 'maj7', '4,7,10': '7', '3,7,10': 'm7', '3,6,10': 'm7b5',
    '3,6,9': 'dim7', '3,7,11': 'mMaj7', '4,8,11': 'maj7#5'
  };
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const LOWER = new Set(['min', 'dim', 'm7', 'm7b5', 'dim7', 'mMaj7', 'm6', 'madd9', 'm9', 'm11']);
  const RN_SUFFIX = {
    maj: '', min: '', dim: '°', aug: '+', '5': '5', sus2: 'sus2', sus4: 'sus4',
    '7': '7', maj7: 'maj7', m7: '7', m7b5: 'ø7', dim7: '°7', mMaj7: '(maj7)', '7sus4': '7sus4',
    'maj7#5': '+maj7', '6': '6', m6: '6', add9: 'add9', madd9: '(add9)', '69': '6/9',
    '9': '9', maj9: 'maj9', m9: '9', '7b9': '7♭9', '7#9': '7♯9', '11': '11', m11: '11', '13': '13'
  };
  function romanNumeral(num, acc, typeId) {
    let base = ROMAN[num - 1];
    if (LOWER.has(typeId)) base = base.toLowerCase();
    const suf = RN_SUFFIX[typeId];
    return accText(acc) + base + (suf === undefined ? CHORD[typeId].sym : suf);
  }

  const REF = { major: SCALE.major.iv, minor: SCALE.minor.iv };
  /** Số La Mã của hợp âm có gốc cách chủ âm một quãng ivStr, trong giọng trưởng hoặc thứ. */
  function romanFor(ivStr, typeId, mode) {
    const I = iv(ivStr);
    let acc = I.acc - iv(REF[mode][I.deg]).acc;
    if (mode === 'minor' && I.deg === 6 && acc === 1) acc = 0; // vii° trong giọng thứ: dấu nâng đã ngầm hiểu
    return romanNumeral(I.deg + 1, acc, typeId);
  }

  const FUNC = {
    major: ['Chủ', 'Hạ át', 'Chủ', 'Hạ át', 'Át', 'Chủ', 'Át'],
    minor: ['Chủ', 'Hạ át', 'Chủ', 'Hạ át', 'Át', 'Hạ át', 'Át']
  };

  function diatonicChords(root, scaleId, sevenths) {
    const sc = SCALE[scaleId];
    if (sc.iv.length !== 7) return [];
    const tones = scaleTones(root, scaleId);
    return tones.map((t, i) => {
      const picks = (sevenths ? [0, 2, 4, 6] : [0, 2, 4]).map(k => tones[(i + k) % 7]);
      const semis = picks.slice(1).map(p => mod(p.pc - t.pc, 12));
      const typeId = QUAL[semis.join(',')] || null;
      let roman = '?';
      if (typeId) roman = sc.roman === 'major' ? romanFor(t.iv, typeId, 'major') : romanNumeral(i + 1, 0, typeId);
      return {
        degree: i + 1, root: t.note, iv: t.iv, typeId, roman,
        func: sc.mode ? FUNC[sc.mode][i] : null
      };
    });
  }

  /** Cách viết dấu thăng/giáng ưu tiên trong một giọng. */
  function keyPref(root, mode) {
    const notes = scaleTones(root, mode === 'minor' ? 'minor' : 'major').map(t => t.note);
    if (notes.some(n => n.a < 0)) return 'flat';
    if (notes.some(n => n.a > 0)) return 'sharp';
    return 'common';
  }

  const MAJOR_KEYS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'].map(parseNote);
  const MINOR_KEYS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D'].map(parseNote);

  /** Hợp âm này là hợp âm thuận của những giọng nào? */
  function keysContaining(root, typeId) {
    const out = [];
    const rpc = pc(root);
    const scan = (keys, mode) => keys.forEach(k => {
      [false, true].forEach(sev => diatonicChords(k, mode, sev).forEach(d => {
        if (d.typeId === typeId && pc(d.root) === rpc) out.push({ key: k, mode, roman: d.roman, degree: d.degree });
      }));
    });
    scan(MAJOR_KEYS, 'major');
    scan(MINOR_KEYS, 'minor');
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Thế bấm guitar                                                      */
  /* ------------------------------------------------------------------ */
  /** Gán ngón tay (1 = trỏ … 4 = út) và phát hiện chặn (barre). Trả về null nếu không bấm được. */
  function fingering(fr) {
    const fretted = [];
    fr.forEach((f, s) => { if (f > 0) fretted.push({ s, f }); });
    const fingers = fr.map(() => 0);
    if (!fretted.length) return { count: 0, fingers, barre: null };
    const minF = Math.min(...fretted.map(x => x.f));
    const atMin = fretted.filter(x => x.f === minF);
    let barre = null;
    if (fretted.length > 4 && atMin.length >= 2) {
      const from = atMin[0].s, to = atMin[atMin.length - 1].s;
      let ok = true;
      for (let s = from; s <= to; s++) if (fr[s] < minF) { ok = false; break; }
      if (ok) barre = { fret: minF, from, to };
    }
    let rest = fretted, next = 1;
    if (barre) {
      atMin.forEach(x => { fingers[x.s] = 1; });
      rest = fretted.filter(x => x.f !== minF);
      next = 2;
    }
    rest = rest.slice().sort((a, b) => a.f - b.f || a.s - b.s);
    for (let i = 0; i < rest.length; i++) {
      const x = rest[i];
      const ideal = Math.min(x.f - minF + 1, 4 - (rest.length - 1 - i));
      const fg = Math.max(next, ideal);
      if (fg > 4) return null;
      fingers[x.s] = fg;
      next = fg + 1;
    }
    return { count: barre ? 1 + rest.length : rest.length, fingers, barre };
  }

  /**
   * Tìm các thế bấm cho một hợp âm.
   * opt: { tuning: [midi dây trầm → dây cao], maxFret, span, bassPc (null = bất kỳ), reentrant, limit }
   */
  function guitarVoicings(root, typeId, opt) {
    opt = opt || {};
    const tuning = opt.tuning || [40, 45, 50, 55, 59, 64];
    const nS = tuning.length;
    const maxFret = opt.maxFret || 15;
    const span = opt.span || 3;
    const tones = chordTones(root, typeId);
    const allowed = new Set(tones.map(t => t.pc));
    const required = tones.filter(t => !t.opt).map(t => t.pc);
    const optional = tones.filter(t => t.opt).map(t => t.pc);
    const bassPc = opt.bassPc === undefined ? pc(root) : opt.bassPc;
    const isPower = typeId === '5';
    const minStrings = isPower ? 2 : Math.min(nS, 4);
    const found = new Map();

    function evaluate(fr) {
      const key = fr.join(',');
      if (found.has(key)) return;
      const sounded = [];
      for (let s = 0; s < nS; s++) if (fr[s] >= 0) sounded.push(s);
      if (sounded.length < minStrings) return;
      const pitches = sounded.map(s => tuning[s] + fr[s]);
      let low = Infinity, lowS = -1;
      sounded.forEach((s, i) => { if (pitches[i] < low) { low = pitches[i]; lowS = s; } });
      if (bassPc !== null && !opt.reentrant && mod(low, 12) !== bassPc) return;
      const present = new Set(pitches.map(p => mod(p, 12)));
      for (const r of required) if (!present.has(r)) return;
      const first = sounded[0], last = sounded[sounded.length - 1];
      let inner = 0;
      for (let s = first; s <= last; s++) if (fr[s] < 0) inner++;
      if (inner > 1 || (isPower && inner)) return;
      const fretted = sounded.filter(s => fr[s] > 0).map(s => fr[s]);
      const minF = fretted.length ? Math.min(...fretted) : 0;
      const maxF = fretted.length ? Math.max(...fretted) : 0;
      if (maxF - minF > span) return;
      if (maxF >= 5 && sounded.some(s => fr[s] === 0)) return; // dây buông + phím cao: khó bấm, ít dùng
      const fing = fingering(fr);
      if (!fing) return;
      const opens = sounded.filter(s => fr[s] === 0).length;
      const topMutes = nS - 1 - last;
      const sp = maxF - minF;
      let score;
      if (isPower) {
        score = 12 - Math.abs(sounded.length - 3) * 2.5 - first * 1.0 - minF * 0.15 - sp * 0.5;
        if (opens && maxF <= 3) score += opens * 0.6;
      } else {
        score = sounded.length * 3 - topMutes * 2 - first * 0.4 - inner * 4 - fing.count * 0.6
          - sp * 0.5 - (sp >= 3 ? 2 : 0) - minF * 0.22;
        for (const o of optional) if (present.has(o)) score += 1.2;
        // Hợp âm thế mở (mọi nốt bấm ≤ phím 3) rất quen thuộc; dây buông lẫn với phím cao thì khó nghe và khó bấm.
        if (opens) score += maxF <= 3 ? opens * 0.9 : -opens * 1.5;
        // Dáng chặn chuẩn (dáng E, dáng A): ngón chặn giữ luôn nốt bass.
        if (fing.barre && fing.barre.from === lowS) score += 2.5;
      }
      found.set(key, {
        frets: fr, fingers: fing.fingers, barre: fing.barre, minF, maxF, score,
        bassString: lowS, sounded: sounded.length
      });
    }

    for (let w = 1; w <= maxFret - span; w++) {
      const hi = w + span;
      const openOk = w <= 3;
      const options = tuning.map(open => {
        const o = [-1];
        if (openOk && allowed.has(mod(open, 12))) o.push(0);
        for (let f = w; f <= hi; f++) if (allowed.has(mod(open + f, 12))) o.push(f);
        return o;
      });
      const cur = new Array(nS);
      (function rec(s) {
        if (s === nS) { evaluate(cur.slice()); return; }
        for (const f of options[s]) { cur[s] = f; rec(s + 1); }
      })(0);
    }

    const ranked = [...found.values()].sort((a, b) => b.score - a.score);
    const limit = opt.limit || 9;
    const best = ranked.length ? ranked[0].score : 0;
    const picked = [], perBucket = {};
    const subsetOf = (v, p) => v.frets.every((f, s) => f === -1 || f === p.frets[s]);
    const bucketOf = v => Math.floor(v.minF / 3);
    for (const v of ranked) {
      if (picked.length >= limit) break;
      if (v.score < best - 10) break;
      if (picked.some(p => subsetOf(v, p) || subsetOf(p, v))) continue;
      const b = bucketOf(v), n = perBucket[b] || 0;
      // Luôn giữ ít nhất một thế mở không chặn (vd. Fmaj7 xx3210) cho người mới.
      const needEasy = b === 0 && !v.barre && n < 4 && !picked.some(p => bucketOf(p) === 0 && !p.barre);
      if (!needEasy) {
        if (n >= (b === 0 ? 3 : 2)) continue;
        if (b === 0 && n >= 2 && v.score < best - 5) continue;
      }
      perBucket[b] = n + 1;
      picked.push(v);
    }
    const pcToIv = new Map(tones.map(t => [t.pc, t.iv]));
    picked.forEach(v => {
      v.ivs = v.frets.map((f, s) => f < 0 ? null : pcToIv.get(mod(tuning[s] + f, 12)));
      v.midis = v.frets.map((f, s) => f < 0 ? null : tuning[s] + f).filter(m => m !== null);
    });
    return picked.sort((a, b) => a.minF - b.minF || b.score - a.score);
  }

  /* ------------------------------------------------------------------ */
  /* Piano: thế hợp âm sát (close) và dẫn giọng                          */
  /* ------------------------------------------------------------------ */
  /** Hợp âm xếp từ nốt gốc ở quãng 8 thứ 3, có thể đảo (inversion). */
  function closeVoicing(root, typeId, inversion) {
    const tones = chordTones(root, typeId);
    const base = 48 + mod(pc(root), 12);
    let notes = tones.map(t => ({ midi: base + iv(t.iv).semis, tone: t }));
    const inv = Math.min(inversion || 0, notes.length - 1);
    for (let k = 0; k < inv; k++) {
      notes.sort((a, b) => a.midi - b.midi);
      notes[0] = { midi: notes[0].midi + 12, tone: notes[0].tone };
    }
    return notes.sort((a, b) => a.midi - b.midi);
  }

  /** Chọn thế bấm tay phải gần với hợp âm trước nhất (dẫn giọng mượt), tay trái giữ nốt bass. */
  function keyboardVoicing(root, typeId, prevUpper, bassNote) {
    const c = CHORD[typeId];
    const rootPc = pc(root);
    let tones = c.iv.map(s => ({ s, p: mod(rootPc + iv(s).semis, 12) }));
    if (tones.length >= 5) tones = tones.filter(t => t.s !== '1');
    while (tones.length > 4) {
      const i = tones.findIndex(t => c.opt.includes(t.s));
      if (i < 0) break;
      tones.splice(i, 1);
    }
    const pcs = tones.map(t => t.p);
    const cands = [];
    for (let k = 0; k < pcs.length; k++) {
      const order = pcs.slice(k).concat(pcs.slice(0, k));
      for (let start = 52; start <= 63; start++) {
        if (mod(start, 12) !== order[0]) continue;
        const notes = [start];
        for (let j = 1; j < order.length; j++) {
          let n = notes[j - 1] + 1;
          while (mod(n, 12) !== order[j]) n++;
          notes.push(n);
        }
        cands.push({ notes, k });
      }
    }
    let best = cands[0], bestCost = Infinity;
    for (const cand of cands) {
      const v = cand.notes;
      let cost;
      if (prevUpper && prevUpper.length) {
        cost = 0;
        for (const n of v) cost += Math.min(...prevUpper.map(p => Math.abs(p - n)));
        for (const p of prevUpper) cost += Math.min(...v.map(n => Math.abs(p - n)));
        cost = cost / 2 + Math.abs(v[0] - 58) * 0.05;
      } else {
        const mean = v.reduce((a, b) => a + b, 0) / v.length;
        cost = Math.abs(mean - 62) * 0.5 + (cand.k === 0 ? 0 : 1.5);
      }
      if (cost < bestCost) { bestCost = cost; best = cand; }
    }
    const bassPc = bassNote ? pc(bassNote) : rootPc;
    const bass = 36 + mod(bassPc, 12);
    return { upper: best.notes, bass, all: [bass].concat(best.notes) };
  }

  /* ------------------------------------------------------------------ */
  /* Nhận diện hợp âm                                                    */
  /* ------------------------------------------------------------------ */
  function identify(midis) {
    const uniq = [...new Set(midis)].sort((a, b) => a - b);
    if (uniq.length < 2) return [];
    const bassPc = mod(uniq[0], 12);
    const set = new Set(uniq.map(m => mod(m, 12)));
    if (set.size < 2) return [];
    const res = [];
    for (let r = 0; r < 12; r++) {
      if (!set.has(r)) continue;
      for (const c of CHORDS) {
        const full = new Set(c.iv.map(s => mod(r + iv(s).semis, 12)));
        let ok = true;
        for (const p of set) if (!full.has(p)) { ok = false; break; }
        if (!ok) continue;
        for (const s of c.iv) {
          if (c.opt.includes(s)) continue;
          if (!set.has(mod(r + iv(s).semis, 12))) { ok = false; break; }
        }
        if (!ok) continue;
        const missing = [...full].filter(p => !set.has(p)).length;
        let score = 100 - missing * 8 - c.order * 0.6;
        if (r === bassPc) score += 20;
        if (!missing) score += 10;
        res.push({ rootPc: r, typeId: c.id, bassPc, missing, score });
      }
    }
    res.sort((a, b) => b.score - a.score);
    return res.slice(0, 8).map(x => {
      const root = fromPc(x.rootPc, 'common');
      const tones = chordTones(root, x.typeId);
      const bassTone = tones.find(t => t.pc === x.bassPc);
      let bass = x.bassPc === x.rootPc ? null : (bassTone ? bassTone.note : fromPc(x.bassPc));
      if (bass && Math.abs(bass.a) > 1) bass = fromPc(x.bassPc);
      return Object.assign(x, { root, bass, symbol: chordSymbol(root, x.typeId, bass) });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Vị trí âm giai trên cần đàn (2 nốt/dây cho ngũ cung, 3 nốt/dây cho  */
  /* âm giai 7 nốt)                                                      */
  /* ------------------------------------------------------------------ */
  function scalePositions(root, scaleId, tuning, maxFret) {
    const tones = scaleTones(root, scaleId);
    const n = tones.length;
    const nps = n === 5 ? 2 : n === 7 ? 3 : 0;
    if (!nps) return [];
    const pcs = new Set(tones.map(t => t.pc));
    const out = [];
    const build = (startFret, k) => {
      const seq = [];
      let p = tuning[0] + startFret;
      while (seq.length < nps * tuning.length) { if (pcs.has(mod(p, 12))) seq.push(p); p++; }
      const cells = [];
      let idx = 0;
      for (let s = 0; s < tuning.length; s++) {
        for (let j = 0; j < nps; j++) {
          const pitch = seq[idx++];
          const f = pitch - tuning[s];
          if (f < 0) return null;
          if (f <= maxFret) cells.push({ s, f, pitch });
        }
      }
      if (cells.length < nps * 3) return null;
      const fs = cells.map(c => c.f);
      return { cells, minF: Math.min(...fs), maxF: Math.max(...fs), startDegree: k + 1 };
    };
    for (let k = 0; k < n; k++) {
      const sf = mod(tones[k].pc - tuning[0], 12);
      const pos = build(sf, k) || build(sf + 12, k);
      if (pos) out.push(pos);
    }
    return out;
  }

  /** Lấy tên nốt đúng ngữ cảnh: nếu pc thuộc hợp âm/âm giai thì dùng cách viết của nó. */
  function spellIn(p, tones, pref) {
    const t = tones && tones.find(x => x.pc === mod(p, 12));
    return t ? t.note : fromPc(p, pref);
  }

  /* ------------------------------------------------------------------ */
  /* Vòng hợp âm mẫu và hợp âm mượn                                      */
  /* ------------------------------------------------------------------ */
  const PRESETS = [
    { id: 'pop', mode: 'major', name: 'I – V – vi – IV', items: [['1', 'maj'], ['5', 'maj'], ['6', 'min'], ['4', 'maj']],
      note: 'Vòng pop phổ biến nhất, xuất hiện trong vô số bài hit.' },
    { id: 'sad', mode: 'major', name: 'vi – IV – I – V', items: [['6', 'min'], ['4', 'maj'], ['1', 'maj'], ['5', 'maj']],
      note: 'Cùng bốn hợp âm trên nhưng mở đầu bằng vi nên buồn và da diết hơn, rất hợp ballad.' },
    { id: 'fifties', mode: 'major', name: 'I – vi – IV – V', items: [['1', 'maj'], ['6', 'min'], ['4', 'maj'], ['5', 'maj']],
      note: 'Vòng doo-wop thập niên 50: ngọt ngào, hoài cổ.' },
    { id: 'royal', mode: 'major', name: 'IVmaj7 – V7 – iii7 – vi', items: [['4', 'maj7'], ['5', '7'], ['3', 'm7'], ['6', 'min']],
      note: 'Royal Road: rất phổ biến trong J-pop và ballad châu Á, day dứt và giàu cảm xúc.' },
    { id: 'indie', mode: 'major', name: 'IVmaj7 – iii7 – vi7 – ii7 – V7', items: [['4', 'maj7'], ['3', 'm7'], ['6', 'm7'], ['2', 'm7'], ['5', '7']],
      note: 'Toàn hợp âm 7 nên nghe mơ màng, “chill”, đúng chất indie.' },
    { id: 'iii7', mode: 'major', name: 'I – III7 – vi – IV', items: [['1', 'maj'], ['3', '7'], ['6', 'min'], ['4', 'maj']],
      note: 'III7 là hợp âm át của vi nên kéo rất mạnh về vi, tạo cảm giác day dứt.' },
    { id: 'twofive', mode: 'major', name: 'ii7 – V7 – Imaj7', items: [['2', 'm7'], ['5', '7'], ['1', 'maj7']],
      note: 'Tiến trình quan trọng nhất của jazz: hạ át → át → chủ.' },
    { id: 'three', mode: 'major', name: 'I – IV – V', items: [['1', 'maj'], ['4', 'maj'], ['5', 'maj']],
      note: 'Ba hợp âm chính (chủ, hạ át, át): nền của rock, folk, country.' },
    { id: 'canon', mode: 'major', name: 'Canon', items: [['1', 'maj'], ['5', 'maj'], ['6', 'min'], ['3', 'min'], ['4', 'maj'], ['1', 'maj'], ['4', 'maj'], ['5', 'maj']],
      note: 'I – V – vi – iii – IV – I – IV – V của Pachelbel, được rất nhiều bài pop vay mượn.' },
    { id: 'blues', mode: 'major', name: 'Blues 12 ô nhịp', items: [['1', '7'], ['1', '7'], ['1', '7'], ['1', '7'], ['4', '7'], ['4', '7'], ['1', '7'], ['1', '7'], ['5', '7'], ['4', '7'], ['1', '7'], ['5', '7']],
      note: 'Khuôn 12 ô với I7, IV7, V7: bài luyện đệm và solo kinh điển.' },
    { id: 'epic', mode: 'minor', name: 'i – VI – III – VII', items: [['1', 'min'], ['b6', 'maj'], ['b3', 'maj'], ['b7', 'maj']],
      note: 'Vòng thứ mạnh mẽ, hùng tráng.' },
    { id: 'andalusian', mode: 'minor', name: 'i – VII – VI – V', items: [['1', 'min'], ['b7', 'maj'], ['b6', 'maj'], ['5', 'maj']],
      note: 'Cadence Andalusia: chất flamenco. Hợp âm V trưởng tạo lực kéo về i.' },
    { id: 'minorlyric', mode: 'minor', name: 'i – iv – VII – III', items: [['1', 'min'], ['4', 'min'], ['b7', 'maj'], ['b3', 'maj']],
      note: 'Vòng thứ trữ tình, chuyển dần sang màu của giọng trưởng song song.' },
    { id: 'minorcad', mode: 'minor', name: 'i – iv – V7 – i', items: [['1', 'min'], ['4', 'min'], ['5', '7'], ['1', 'min']],
      note: 'V7 lấy từ âm giai thứ hòa âm nên kết rất chắc, đậm chất cổ điển.' }
  ];

  const BORROWED = {
    major: [
      ['b3', 'maj', 'Mượn từ giọng thứ cùng tên'],
      ['4', 'min', 'Mượn từ giọng thứ, buồn man mác'],
      ['b6', 'maj', 'Mượn từ giọng thứ, hùng tráng'],
      ['b7', 'maj', 'Mượn từ giọng thứ, chất rock'],
      ['2', '7', 'Át của V (V/V)'],
      ['3', '7', 'Át của vi (V/vi)'],
      ['6', '7', 'Át của ii (V/ii)'],
      ['1', '7', 'Át của IV (V/IV)']
    ],
    minor: [
      ['5', 'maj', 'Từ âm giai thứ hòa âm'],
      ['5', '7', 'Át mạnh, kéo về i'],
      ['4', 'maj', 'Màu Dorian'],
      ['b2', 'maj', 'Hợp âm Napoli'],
      ['7', 'dim7', 'Bảy giảm, rất căng'],
      ['1', 'maj', 'Kết bằng hợp âm trưởng (Picardy)']
    ]
  };

  Object.assign(T, {
    LETTERS, SOLFEGE, mod, note, pc, same, parseNote, accText, name, letterName, solfegeName, id,
    fromPc, midiOf, parsePitch, octaveOf, midiName, freq,
    iv, transpose, between, ivText, ivShort, ivName, ivFamily, SEMI_IV, SEMI_NAMES,
    CHORDS, CHORD, CHORD_GROUPS, chordSymbol, chordReading, chordTones,
    SCALES, SCALE, SCALE_GROUPS, scaleTones, stepPattern, keySignature,
    diatonicChords, romanNumeral, romanFor, FUNC, keyPref, MAJOR_KEYS, MINOR_KEYS, keysContaining,
    fingering, guitarVoicings, closeVoicing, keyboardVoicing, identify, scalePositions, spellIn,
    PRESETS, BORROWED
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = T;
  else global.Theory = T;
})(typeof window !== 'undefined' ? window : globalThis);
