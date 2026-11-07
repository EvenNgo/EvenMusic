/* Phím & Phím — js/lessons.js
 * Nội dung bài học (tiếng Việt) và lộ trình luyện tập.
 * Các nút trong bài dùng thuộc tính data-*:
 *   data-seq="60,62,64"   phát lần lượt từng nốt (số MIDI, 60 = C4)
 *   data-play="60,64,67"  phát cùng lúc
 *   data-chord="C:maj7"   phát một hợp âm theo tên
 *   data-prog="D:m7,G:7,C:maj7"  phát lần lượt một vòng hợp âm
 *   data-go="chord|C|maj7", "scale|G|major", "prog", "fret|interval", "circle", "train|interval", "tools"
 */
(function (global) {
  'use strict';

  const T = global.Theory;
  const chip = (attr, value, label) => `<button type="button" class="lchip" ${attr}="${value}">${label}</button>`;
  const seq = (v, l) => chip('data-seq', v, l);
  const chord = (v, l) => chip('data-chord', v, l);
  const go = (v, l) => `<button type="button" class="lgo" data-go="${v}">${l}</button>`;
  const sym = (r, t) => T.chordSymbol(T.parseNote(r), t);
  const ch = (r, t) => chord(r + ':' + t, sym(r, t));
  /** Nút phát cả vòng; nhãn tự ghi tên hợp âm. list = [['D','m7'], ['G','7'], ...] */
  const prog = list => chip('data-prog', list.map(x => x.join(':')).join(','), '▶ ' + list.map(([r, t]) => sym(r, t)).join(' – '));
  const notesOf = (r, t) => T.chordTones(T.parseNote(r), t).map(x => T.letterName(x.note)).join(' – ');
  const formula = t => T.CHORD[t].iv.map(T.ivText).join(' – ');
  /** Bảng hợp âm, mỗi dòng: [loại, cách dựng]. Nốt được tính tự động từ nốt gốc. */
  const chordTable = (root, rows) => `<div class="table-wrap"><table class="ltable"><thead><tr><th>Ký hiệu</th><th>Công thức</th><th>Cách dựng nhanh</th><th>Từ ${root}</th><th></th></tr></thead><tbody>${
    rows.map(([t, how]) => `<tr><td><strong>${sym(root, t)}</strong></td><td>${formula(t)}</td><td>${how}</td><td>${notesOf(root, t)}</td><td>${ch(root, t)}</td></tr>`).join('')
  }</tbody></table></div>`;

  // Bậc trong hợp âm so với âm giai trưởng của nốt gốc (ví dụ từ C)
  const degreeRows = [
    ['1', 0, 'Nốt gốc'], ['♭2 / ♭9', 1, ''], ['2 / 9', 2, '9 = nốt 2 cao lên một quãng 8'], ['♯2 / ♯9', 3, 'cùng phím với ♭3'],
    ['♭3', 3, 'quãng 3 thứ: hợp âm thứ'], ['3', 4, 'quãng 3 trưởng: hợp âm trưởng'], ['4 / 11', 5, '11 = nốt 4 cao lên một quãng 8'],
    ['♯4 / ♯11', 6, ''], ['♭5', 6, 'hợp âm giảm, nửa giảm'], ['5', 7, 'quãng 5 đúng'], ['♯5', 8, 'hợp âm tăng'],
    ['♭6 / ♭13', 8, ''], ['6 / 13', 9, '13 = nốt 6 cao lên một quãng 8'], ['♭♭7', 9, 'chỉ có trong hợp âm dim7'],
    ['♭7', 10, 'quãng 7 thứ: thấp hơn nốt gốc một cung'], ['7', 11, 'quãng 7 trưởng: thấp hơn nốt gốc nửa cung']
  ].map(([d, n, note]) => {
    const ivx = d.split(' / ')[0].replace('♭♭', 'bb').replace('♭', 'b').replace('♯', '#');
    return `<tr><td><strong>${d}</strong></td><td>${n}</td><td>${T.letterName(T.transpose(T.parseNote('C'), ivx))}</td><td>${note}</td></tr>`;
  }).join('');

  const intervalRows = T.SEMI_IV.map((s, i) => {
    const top = s === '8' ? 'C' : T.letterName(T.transpose(T.parseNote('C'), s));
    const alt = i === 6 ? ' / G♭' : '';
    return `<tr><td>${i}</td><td>${T.SEMI_NAMES[i]}</td><td>C – ${top}${alt}</td><td>${seq('60,' + (60 + i), 'Nghe')}</td></tr>`;
  }).join('');

  const LESSONS = [
    {
      id: 'notes', title: 'Nốt nhạc, cung và nửa cung',
      html: `
<p>Âm nhạc phương Tây dùng 12 nốt, lặp lại sau mỗi quãng 8: C, C♯/D♭, D, D♯/E♭, E, F, F♯/G♭, G, G♯/A♭, A, A♯/B♭, B. Bảy nốt tự nhiên có tên tiếng Việt là Đô (C), Rê (D), Mi (E), Fa (F), Sol (G), La (A), Si (B).</p>
<p>${seq('60,61,62,63,64,65,66,67,68,69,70,71,72', 'Nghe đủ 12 nốt')}</p>
<p><strong>Nửa cung</strong> là khoảng cách nhỏ nhất: một phím đàn trên guitar, hoặc hai phím sát nhau trên piano (tính cả phím đen). <strong>Một cung</strong> bằng hai nửa cung.</p>
<p>Giữa E và F, giữa B và C chỉ có nửa cung, nên trên piano không có phím đen chen giữa. ${seq('64,65', 'E – F')} ${seq('71,72', 'B – C')}</p>
<p>Dấu thăng (♯) nâng nốt lên nửa cung, dấu giáng (♭) hạ xuống nửa cung. C♯ và D♭ là cùng một phím nhưng khác tên (đồng âm khác tên). Tên nào đúng phụ thuộc vào giọng: giọng F trưởng viết B♭ chứ không viết A♯, vì trong một âm giai mỗi chữ cái chỉ xuất hiện một lần.</p>`
    },
    {
      id: 'intervals', title: 'Quãng: khoảng cách giữa hai nốt',
      html: `
<p>Quãng được đo bằng số nửa cung. Quãng 3 quyết định hợp âm trưởng hay thứ, quãng 5 đúng làm hợp âm vững, quãng 7 tạo màu sắc.</p>
<div class="table-wrap"><table class="ltable"><thead><tr><th>Nửa cung</th><th>Tên quãng</th><th>Ví dụ từ C</th><th></th></tr></thead><tbody>${intervalRows}</tbody></table></div>
<p>Trên guitar lên dây chuẩn, cùng một phím ở dây cao hơn kế bên là nốt cao hơn một quãng 4 đúng (5 nửa cung). Riêng từ dây 3 (G) sang dây 2 (B) chỉ là quãng 3 trưởng (4 nửa cung). Vì thế các dáng bấm bị “lệch” một phím mỗi khi đi qua dây B.</p>
<p>${go('fret|interval', 'Mở bản đồ quãng trên cần đàn')} ${go('train|interval', 'Luyện nghe quãng')}</p>`
    },
    {
      id: 'chords', title: 'Hợp âm được xây như thế nào',
      html: `
<p>Hợp âm ba (triad) là hai quãng 3 chồng lên nhau:</p>
<ul>
<li><strong>Trưởng</strong>: quãng 3 trưởng (4 nửa cung) + quãng 3 thứ (3 nửa cung) → 1 – 3 – 5. C = C, E, G. ${chord('C:maj', 'C')}</li>
<li><strong>Thứ</strong>: quãng 3 thứ + quãng 3 trưởng → 1 – ♭3 – 5. Cm = C, E♭, G. ${chord('C:min', 'Cm')}</li>
<li><strong>Giảm</strong>: hai quãng 3 thứ → 1 – ♭3 – ♭5. ${chord('C:dim', 'Cdim')}</li>
<li><strong>Tăng</strong>: hai quãng 3 trưởng → 1 – 3 – ♯5. ${chord('C:aug', 'Caug')}</li>
</ul>
<p>Chồng thêm một quãng 3 nữa sẽ được hợp âm bảy: ${chord('C:maj7', 'Cmaj7')} ${chord('C:7', 'C7')} ${chord('C:m7', 'Cm7')} ${chord('C:m7b5', 'Cm7♭5')} ${chord('C:dim7', 'Cdim7')}</p>
<p>Cách đọc ký hiệu: chữ cái là nốt gốc; “m” là thứ; “7” đứng một mình là hợp âm bảy át (quãng 7 thứ); “maj7” là quãng 7 trưởng; “sus2/sus4” thay quãng 3 bằng quãng 2 hoặc 4; “add9” thêm nốt 9; “/E” nghĩa là nốt trầm nhất (bass) là E.</p>
<p>${go('chord|C|maj7', 'Tra hợp âm trên cần đàn')}</p>`
    },
    {
      id: 'scales', title: 'Âm giai trưởng và thứ',
      html: `
<p>Âm giai trưởng theo công thức <strong>C – C – N – C – C – C – N</strong> (C là một cung, N là nửa cung). Bắt đầu từ C sẽ được C D E F G A B. ${seq('60,62,64,65,67,69,71,72', 'Nghe C trưởng')}</p>
<p>Bắt đầu từ G thì phải dùng F♯ để giữ đúng công thức: G A B C D E F♯. ${seq('55,57,59,60,62,64,66,67', 'Nghe G trưởng')}</p>
<p>Âm giai thứ tự nhiên theo công thức <strong>C – N – C – C – N – C – C</strong>. La thứ: A B C D E F G. ${seq('57,59,60,62,64,65,67,69', 'Nghe La thứ')}</p>
<p><strong>Giọng song song</strong>: La thứ và Đô trưởng dùng chung 7 nốt và chung hóa biểu. Giọng thứ song song luôn bắt đầu từ bậc 6 của giọng trưởng. <strong>Giọng cùng tên</strong>: Đô trưởng và Đô thứ chung chủ âm nhưng khác nốt.</p>
<p>${go('scale|G|major', 'Xem âm giai trên cần đàn')} ${go('circle', 'Mở vòng quãng 5')}</p>`
    },
    {
      id: 'diatonic', title: 'Hợp âm thuận và số La Mã',
      html: `
<p>Xếp chồng quãng 3 trên từng bậc của âm giai trưởng sẽ được 7 hợp âm thuận: <strong>I ii iii IV V vi vii°</strong>. Chữ hoa là hợp âm trưởng, chữ thường là thứ, dấu ° là giảm.</p>
<p>Trong Đô trưởng: C, Dm, Em, F, G, Am, Bdim. Trong Sol trưởng: G, Am, Bm, C, D, Em, F♯dim.</p>
<p>Mỗi hợp âm có một <strong>chức năng</strong>: nhóm chủ (I, iii, vi) tạo cảm giác ổn định; nhóm hạ át (ii, IV) rời xa chủ âm; nhóm át (V, vii°) căng và muốn quay về chủ.</p>
<p>Khi viết vòng hợp âm bằng số (ví dụ 1 – 5 – 6 – 4), đổi sang giọng khác chỉ cần thay chủ âm. Nhạc công gọi cách ghi này là hệ số Nashville.</p>
<p>${chord('C:maj', 'I')} ${chord('G:maj', 'V')} ${chord('A:min', 'vi')} ${chord('F:maj', 'IV')}</p>
<p>${go('prog', 'Dựng vòng hợp âm')}</p>`
    },
    {
      id: 'color', title: 'Hợp âm màu: đọc công thức theo âm giai trưởng',
      html: `
<p><strong>Hợp âm màu</strong> là hợp âm có thêm nốt ngoài bộ ba 1 – 3 – 5: nốt 7, 6, 9, 11, 13, hoặc thay nốt 3 bằng 2/4 (sus). Những nốt thêm vào này làm hợp âm “có màu”: mơ màng, chill, căng, sang… thay vì chỉ vui (trưởng) hay buồn (thứ).</p>
<p>Mọi con số trong tên hợp âm đều được đo so với <strong>âm giai trưởng của nốt gốc</strong>. Dấu ♭ nghĩa là hạ nốt đó nửa cung so với âm giai trưởng, dấu ♯ là nâng nửa cung. Số lớn hơn 7 chỉ là nốt cũ ở quãng 8 cao hơn: <strong>9 = 2, 11 = 4, 13 = 6</strong>.</p>
<div class="table-wrap"><table class="ltable"><thead><tr><th>Bậc</th><th>Nửa cung từ gốc</th><th>Từ C</th><th>Ghi chú</th></tr></thead><tbody>${degreeRows}</tbody></table></div>
<h4>Hai cách suy ra nốt thật nhanh</h4>
<p><strong>Cách 1 — theo âm giai trưởng.</strong> Viết âm giai trưởng của nốt gốc, lấy các bậc theo công thức rồi chỉnh ♭/♯. Ví dụ Emaj7 = 1 – 3 – 5 – 7. Âm giai E trưởng: E F♯ G♯ A B C♯ D♯ → lấy bậc 1, 3, 5, 7 = <strong>E – G♯ – B – D♯</strong>. ${ch('E', 'maj7')}</p>
<p><strong>Cách 2 — từ hợp âm ba bạn đã biết, cộng thêm một nốt theo “mốc”.</strong> Cách này nhanh hơn khi đã thuộc hợp âm ba:</p>
<ul>
<li><strong>7 trưởng</strong> (maj7): thấp hơn nốt gốc <em>nửa cung</em>. C → B, nên Cmaj7 = C E G + B.</li>
<li><strong>♭7</strong> (7, m7): thấp hơn nốt gốc <em>một cung</em>. A → G, nên A7 = A C♯ E + G.</li>
<li><strong>6</strong>: cao hơn nốt 5 <em>một cung</em>. G → A, nên C6 = C E G + A.</li>
<li><strong>9</strong> (add9, 9): cao hơn nốt gốc <em>một cung</em>. D → E, nên Dadd9 = D F♯ A + E.</li>
<li><strong>11</strong>: chính là nốt 4 (cao hơn gốc 5 nửa cung). <strong>13</strong>: chính là nốt 6.</li>
</ul>
<p>Viết tên nốt sao cho mỗi chữ cái “nhảy cách một”: 1 – 3 – 5 – 7 dùng các chữ cái cách quãng (C E G B, D F A C, E G B D). Vì thế B7 viết là B – D♯ – F♯ – A chứ không viết E♭ hay G♭, dù cùng phím. Trang này luôn ghi đúng tên nốt theo quy tắc đó.</p>
<p>${go('train|build', 'Luyện dựng hợp âm có bấm giờ')} ${go('train|name', 'Luyện đọc tên hợp âm')}</p>`
    },
    {
      id: 'sevenths', title: 'Hợp âm bảy: năm loại cần thuộc trước',
      html: `
<p>Hợp âm bảy = hợp âm ba + một quãng 3 nữa chồng lên trên. Chỉ cần thuộc 5 loại dưới đây là đọc được phần lớn bản nhạc pop, ballad, R&B và jazz cơ bản.</p>
${chordTable('C', [
  ['maj7', 'Hợp âm trưởng + 7 trưởng (nửa cung dưới gốc)'],
  ['7', 'Hợp âm trưởng + ♭7 (một cung dưới gốc)'],
  ['m7', 'Hợp âm thứ + ♭7'],
  ['m7b5', 'Hợp âm giảm + ♭7'],
  ['dim7', 'Hợp âm giảm + ♭♭7 (3 nửa cung dưới gốc)']
])}
<p><strong>Chuỗi “hạ từng nửa cung”</strong> — mẹo nhớ cả 5 loại cùng lúc: bắt đầu từ Cmaj7 rồi mỗi bước chỉ hạ <em>một</em> nốt xuống nửa cung.</p>
<ul>
<li>Cmaj7 (C E G <strong>B</strong>) → hạ 7 → C7 (C E G <strong>B♭</strong>)</li>
<li>C7 (C <strong>E</strong> G B♭) → hạ 3 → Cm7 (C <strong>E♭</strong> G B♭)</li>
<li>Cm7 (C E♭ <strong>G</strong> B♭) → hạ 5 → Cm7♭5 (C E♭ <strong>G♭</strong> B♭)</li>
<li>Cm7♭5 (C E♭ G♭ <strong>B♭</strong>) → hạ 7 lần nữa → Cdim7 (C E♭ G♭ <strong>B♭♭</strong>)</li>
</ul>
<p>${prog([['C', 'maj7'], ['C', '7'], ['C', 'm7'], ['C', 'm7b5'], ['C', 'dim7']])}</p>
<p>Ít gặp hơn nhưng nên biết: ${ch('C', 'mMaj7')} (thứ + 7 trưởng, màu nhạc phim), ${ch('C', '7sus4')} (sus4 + ♭7, mềm hơn C7), ${ch('C', 'maj7#5')}.</p>
<h4>Hợp âm bảy thuận trong giọng trưởng</h4>
<p>Chồng 4 nốt trên mỗi bậc của âm giai trưởng sẽ luôn được thứ tự: <strong>Imaj7 – iim7 – iiim7 – IVmaj7 – V7 – vim7 – viiø7</strong>. Trong Đô trưởng:</p>
<p>${['C:maj7', 'D:m7', 'E:m7', 'F:maj7', 'G:7', 'A:m7', 'B:m7b5'].map(x => { const [r, t] = x.split(':'); return ch(r, t); }).join(' ')}</p>
<p>Để ý: chỉ có <strong>một</strong> hợp âm 7 át (bậc V). Vì thế khi thấy G7 là biết ngay bài đang muốn về C (hoặc Cm).</p>
<p>${go('chord|C|maj7', 'Xem thế bấm guitar và piano')} ${go('train|build', 'Luyện dựng hợp âm 7')}</p>`
    },
    {
      id: 'addsus', title: 'Sus, 6, add9 và 6/9',
      html: `
${chordTable('C', [
  ['sus2', 'Thay 3 bằng 2'],
  ['sus4', 'Thay 3 bằng 4'],
  ['6', 'Hợp âm trưởng + 6'],
  ['m6', 'Hợp âm thứ + 6 trưởng'],
  ['add9', 'Hợp âm trưởng + 9, không có 7'],
  ['madd9', 'Hợp âm thứ + 9, không có 7'],
  ['69', 'Hợp âm 6 + 9']
])}
<h4>Hay nhầm: sus2, add9 và 9</h4>
<ul>
<li><strong>Csus2</strong> = C D G: <em>không có</em> nốt 3, nên không trưởng không thứ, nghe trong và lơ lửng.</li>
<li><strong>Cadd9</strong> = C E G D: vẫn là hợp âm trưởng (có E), chỉ thêm nốt 9 cho lấp lánh. <em>Không có</em> nốt 7.</li>
<li><strong>C9</strong> = C E G B♭ D: tên “9” trơn nghĩa là đã có sẵn ♭7 bên dưới (C7 + 9). Nghe funk, blues.</li>
</ul>
<p>${ch('C', 'sus2')} ${ch('C', 'add9')} ${ch('C', '9')}</p>
<h4>Sus giải quyết về hợp âm trưởng</h4>
<p>Nốt 4 của sus4 muốn đi xuống nốt 3, nốt 2 của sus2 muốn đi lên nốt 3. Kiểu Dsus4 → D hoặc G7sus4 → G7 có trong rất nhiều bài pop và ballad. ${prog([['D', 'sus4'], ['D', 'maj'], ['D', 'sus2'], ['D', 'maj']])} ${prog([['G', '7sus4'], ['G', '7'], ['C', 'maj']])}</p>
<h4>Một bộ nốt, hai cái tên</h4>
<p>C6 = C E G A và Am7 = A C E G có <strong>cùng bốn nốt</strong>. Gọi tên nào tùy nốt bass và vai trò trong bài: bass là C thì gọi C6, bass là A thì gọi Am7. Tương tự, Cm6 (C E♭ G A) cùng nốt với Am7♭5 (A C E♭ G).</p>
<p>Trên guitar, <strong>Cadd9</strong> mở (x32030) và <strong>Gadd9/G6</strong> là những thế bấm “ăn tiền” nhất cho ballad: chỉ cần giữ ngón 3, 4 ở dây 1–2 khi đổi qua lại giữa G, Cadd9, Em7, Dsus4.</p>
<p>${go('chord|C|add9', 'Xem thế bấm Cadd9')}</p>`
    },
    {
      id: 'ext', title: 'Hợp âm mở rộng 9, 11, 13 và hợp âm biến',
      html: `
<p>Tiếp tục chồng quãng 3 lên trên hợp âm bảy sẽ được nốt 9, rồi 11, rồi 13. Quy ước quan trọng: <strong>số lớn nhất trong tên ngụ ý đã có đủ các nốt 7 (và thường là 9) bên dưới</strong>.</p>
${chordTable('C', [
  ['9', 'C7 + 9'],
  ['maj9', 'Cmaj7 + 9'],
  ['m9', 'Cm7 + 9'],
  ['11', 'C9 + 11 (thường bỏ nốt 3)'],
  ['m11', 'Cm9 + 11'],
  ['13', 'C9 + 13 (thường bỏ 5, 9)']
])}
<h4>Lược bớt nốt khi bấm</h4>
<p>Guitar chỉ có 6 dây và tay chỉ có 4 ngón, nên hợp âm 5–6 nốt luôn bị lược bớt. Thứ tự bỏ:</p>
<ol>
<li><strong>Nốt 5</strong> bỏ đầu tiên: nó không quyết định màu sắc (trừ khi là ♭5 hoặc ♯5).</li>
<li><strong>Nốt gốc</strong> có thể bỏ khi đã có bass hoặc người khác chơi nốt gốc.</li>
<li><strong>Nốt 3 và 7 phải giữ</strong>: hai nốt này (gọi là “nốt dẫn”, guide tones) cho biết hợp âm là trưởng, thứ hay át.</li>
<li>Với hợp âm 11 trưởng/át, nốt 11 (F) va với nốt 3 (E) ở quãng 9 thứ nên người ta bỏ nốt 3: C11 nghe gần như B♭/C hoặc C9sus4.</li>
</ol>
<h4>Hợp âm biến (altered)</h4>
<p>Trên hợp âm 7 át, nốt 9 có thể bị hạ (♭9) hoặc nâng (♯9) để tăng độ căng trước khi về chủ âm:</p>
<ul>
<li>${ch('E', '7b9')} = ${notesOf('E', '7b9')}: rất tối, kéo mạnh về hợp âm thứ (E7♭9 → Am).</li>
<li>${ch('E', '7#9')} = ${notesOf('E', '7#9')}; nốt ♯9 (F♯♯) cùng phím với G, nên nghe như có cả G♯ lẫn G: “hợp âm Hendrix”, vừa trưởng vừa thứ, chất rock và funk.</li>
</ul>
<p>${prog([['E', '7b9'], ['A', 'min']])} ${prog([['E', '7#9'], ['E', '7#9'], ['A', '7'], ['E', '7#9']])}</p>
<p>${go('chord|C|9', 'Xem thế bấm C9')} ${go('train|build', 'Luyện hợp âm mở rộng')}</p>`
    },
    {
      id: 'coloruse', title: 'Thêm màu cho vòng hợp âm',
      html: `
<p>Cách đơn giản nhất: giữ nguyên vòng hợp âm cũ, thay mỗi hợp âm ba bằng một phiên bản có màu <strong>mà nốt thêm vào vẫn nằm trong âm giai</strong> của bài. Bảng cho Đô trưởng:</p>
<div class="table-wrap"><table class="ltable"><thead><tr><th>Bậc</th><th>Hợp âm ba</th><th>Có thể thay bằng</th></tr></thead><tbody>
<tr><td>I</td><td>C</td><td>${ch('C', 'maj7')} ${ch('C', 'add9')} ${ch('C', '6')} ${ch('C', 'maj9')} ${ch('C', '69')}</td></tr>
<tr><td>ii</td><td>Dm</td><td>${ch('D', 'm7')} ${ch('D', 'm9')} ${ch('D', 'm11')}</td></tr>
<tr><td>iii</td><td>Em</td><td>${ch('E', 'm7')}</td></tr>
<tr><td>IV</td><td>F</td><td>${ch('F', 'maj7')} ${ch('F', 'add9')} ${ch('F', '6')} ${ch('F', 'maj9')}</td></tr>
<tr><td>V</td><td>G</td><td>${ch('G', '7')} ${ch('G', '7sus4')} ${ch('G', '9')} ${ch('G', '13')}</td></tr>
<tr><td>vi</td><td>Am</td><td>${ch('A', 'm7')} ${ch('A', 'm9')} ${ch('A', 'madd9')}</td></tr>
<tr><td>vii°</td><td>Bdim</td><td>${ch('B', 'm7b5')}</td></tr>
</tbody></table></div>
<p>Ví dụ vì sao <em>không</em> có Em9 trong bảng: Em9 cần F♯, mà F♯ không thuộc Đô trưởng nên sẽ nghe lạc. Tương tự, đừng biến bậc V thành Gmaj7 (cần F♯) hay bậc I thành C7 (cần B♭) — trừ khi bạn cố ý muốn rời giọng.</p>
<h4>Các vòng màu nên thuộc</h4>
<ul>
<li><strong>ii – V – I</strong>, xương sống của jazz và R&B: ${prog([['D', 'm7'], ['G', '7'], ['C', 'maj7']])}</li>
<li><strong>ii – V – i giọng thứ</strong>: ${prog([['B', 'm7b5'], ['E', '7b9'], ['A', 'm7']])}</li>
<li><strong>1 – 6 – 4 – 5 bản có màu</strong>: ${prog([['C', 'add9'], ['A', 'm7'], ['F', 'maj7'], ['G', '7sus4'], ['G', '7']])}</li>
<li><strong>4 – 5 – 3 – 6</strong> (rất quen trong pop Á Đông): ${prog([['F', 'maj7'], ['G', '7'], ['E', 'm7'], ['A', 'm7']])}</li>
<li><strong>Neo-soul / lo-fi</strong>: ${prog([['F', 'maj9'], ['E', 'm7'], ['D', 'm9'], ['C', 'maj9']])}</li>
</ul>
<p>Trong trang Vòng hợp âm, ở mục Hợp âm thuận chọn “Hợp âm bảy” để mọi hợp âm thuận tự thêm nốt 7, rồi thử đổi từng hợp âm sang add9, sus4, 9… để nghe khác biệt.</p>
<p>${go('prog', 'Mở trang Vòng hợp âm')}</p>`
    },
    {
      id: 'drill', title: 'Cách luyện để suy hợp âm thật nhanh',
      html: `
<p>Biết công thức chưa đủ: mục tiêu là <strong>nhìn tên là thấy nốt</strong>, không phải đếm nửa cung. Lộ trình gợi ý, mỗi ngày 10–15 phút với bài <em>Dựng hợp âm</em> (có bấm giờ):</p>
<ol>
<li><strong>Hợp âm trưởng và thứ, nốt gốc tự nhiên.</strong> Mục tiêu: dưới 3 giây mỗi hợp âm, đúng trên 95%. Mẹo: thuộc lòng 7 hợp âm trưởng C, D, E, F, G, A, B như thuộc bảng cửu chương; hợp âm thứ chỉ là hạ nốt giữa.</li>
<li><strong>Thêm giảm, tăng, sus.</strong> Luôn suy từ hợp âm trưởng: đổi đúng một nốt.</li>
<li><strong>Bật “Cả thăng/giáng”.</strong> Mẹo: B♭ trưởng chỉ là B trưởng (B D♯ F♯) hạ cả ba nốt xuống nửa cung → B♭ D F. Áp dụng được cho mọi nốt gốc có dấu.</li>
<li><strong>Hợp âm 7.</strong> Mục tiêu dưới 5 giây. Dùng mốc: maj7 = nửa cung dưới gốc, ♭7 = một cung dưới gốc.</li>
<li><strong>Sáu & thêm, rồi mở rộng 9–13.</strong> Mốc: 9 = một cung trên gốc, 6/13 = một cung trên nốt 5, 11 = nốt 4.</li>
<li><strong>Đảo chiều với bài <em>Đọc tên hợp âm</em></strong>, rồi bật “Xáo thứ tự các nốt”. Mẹo tìm nốt gốc: xếp lại các nốt sao cho cách nhau quãng 3 — nốt dưới cùng chính là nốt gốc.</li>
</ol>
<p>Luyện thêm ngoài máy: đọc to hợp âm theo vòng quãng 4 (C – F – B♭ – E♭ – A♭ – D♭ – G♭ – B – E – A – D – G), mỗi hợp âm đọc 4 nốt, giữ nhịp với metronome ở 60 BPM rồi tăng dần.</p>
<p>${go('train|build', 'Bắt đầu Dựng hợp âm')} ${go('train|name', 'Đọc tên hợp âm')} ${go('tools', 'Mở metronome')}</p>`
    },
    {
      id: 'capo', title: 'Capo và chuyển giọng',
      html: `
<p>Kẹp capo ở phím n sẽ nâng mọi thế bấm lên n nửa cung. Thế G với capo ở phím 2 phát ra âm A.</p>
<p>Công thức: <strong>hợp âm nghe được = thế bấm + số phím capo</strong> (tính theo nửa cung).</p>
<p>Ví dụ: bài ở giọng A (A – E – F♯m – D) có thể bấm bằng thế G (G – D – Em – C) với capo ở phím 2.</p>
<p>Với người hát: nếu bài quá cao, hãy hạ giọng (dời capo xuống hoặc đổi thế bấm); quá thấp thì làm ngược lại. Tab Vòng hợp âm có phần gợi ý capo để bạn luôn bấm được thế dễ.</p>
<p>${go('prog', 'Thử capo với vòng của bạn')}</p>`
    },
    {
      id: 'fretboard', title: 'Thuộc cần đàn guitar',
      html: `
<p>Hãy thuộc nốt tự nhiên trên dây 6 và dây 5 trước, vì mọi hợp âm chặn dáng E và dáng A đều lấy nốt gốc ở hai dây này.</p>
<div class="table-wrap"><table class="ltable"><thead><tr><th>Phím</th><th>0</th><th>1</th><th>2</th><th>3</th><th>5</th><th>7</th><th>8</th><th>10</th><th>12</th></tr></thead>
<tbody><tr><td>Dây 6</td><td>E</td><td>F</td><td>–</td><td>G</td><td>A</td><td>B</td><td>C</td><td>D</td><td>E</td></tr>
<tr><td>Dây 5</td><td>A</td><td>–</td><td>B</td><td>C</td><td>D</td><td>E</td><td>F</td><td>G</td><td>A</td></tr></tbody></table></div>
<p><strong>Quãng 8 (octave)</strong>: từ dây 6 hoặc dây 5, nhảy lên hai dây và tiến thêm 2 phím là gặp lại cùng nốt (dây 6 phím 3 = G, dây 4 phím 5 = G). Từ dây 4 hoặc dây 3 thì tiến thêm 3 phím, vì phải đi qua dây B.</p>
<p><strong>Hệ thống CAGED</strong>: cùng một hợp âm có 5 dáng C, A, G, E, D nối tiếp nhau dọc cần đàn. Bạn đã biết dáng E và dáng A, đó là hai mảnh quan trọng nhất.</p>
<p><strong>Ngũ cung thứ</strong> có 5 vị trí, vị trí sau nối tiếp vị trí trước. Thuộc cả 5 là bạn solo được trên toàn cần đàn.</p>
<p>${go('fret|find', 'Luyện tìm nốt')} ${go('scale|A|minPent', 'Xem 5 vị trí ngũ cung')} ${go('train|fret', 'Đố nốt trên cần đàn')}</p>`
    },
    {
      id: 'piano', title: 'Piano cho người chơi guitar',
      html: `
<p>Tìm C: đó là phím trắng nằm ngay bên trái nhóm 2 phím đen. F là phím trắng bên trái nhóm 3 phím đen.</p>
<p>Hợp âm ba ở tay phải dùng ngón <strong>1 – 3 – 5</strong> (cái, giữa, út). Tay trái chơi nốt gốc thấp hơn một hoặc hai quãng 8.</p>
<p><strong>Đảo phím (inversion)</strong>: đưa nốt thấp nhất lên một quãng 8 sẽ được thế đảo 1, rồi đảo 2. Nhờ đảo phím, các hợp âm liền nhau nằm gần nhau và tay gần như không phải di chuyển: C (C E G) → F (C F A) → G (B D G). ${seq('60,64,67', 'C')} ${chip('data-play', '60,65,69', 'F/C')} ${chip('data-play', '59,62,67', 'G/B')}</p>
<p>Âm giai C trưởng tay phải đi lên: ngón 1 2 3, luồn ngón cái xuống dưới, rồi 1 2 3 4 5. Tay trái đi lên: 5 4 3 2 1, vắt ngón 3 qua, rồi 3 2 1.</p>
<p>${go('chord|C|maj', 'Xem hợp âm và thế đảo trên piano')}</p>`
    },
    {
      id: 'fl', title: 'Mang vào FL Studio',
      html: `
<p>Quy trình nhanh: dựng vòng ở tab Vòng hợp âm, bấm <strong>Tải MIDI</strong>, rồi kéo file .mid vào Piano roll hoặc Playlist của FL Studio (hoặc dùng File → Import → MIDI file). File MIDI đã có sẵn nốt bass ở quãng 8 thấp và hợp âm tay phải được dẫn giọng mượt.</p>
<p>Trong Piano roll:</p>
<ul>
<li>Công cụ <strong>Stamp</strong> giúp đặt nhanh hợp âm hoặc âm giai theo tên.</li>
<li><strong>Ghost notes</strong>: nốt của các kênh khác hiện mờ trong Piano roll, rất tiện để viết giai điệu khớp với hợp âm.</li>
<li>Các bản FL Studio gần đây có thể tô sáng các nốt thuộc âm giai đang chọn, giúp bạn không lạc giọng.</li>
</ul>
<p><strong>Viết bass</strong>: bắt đầu bằng nốt gốc của mỗi hợp âm ở phách 1, sau đó thêm nốt 5 hoặc một nốt nối dẫn sang hợp âm kế tiếp.</p>
<p><strong>Viết giai điệu</strong>: đặt nốt thuộc hợp âm vào phách mạnh, dùng các nốt khác của âm giai ở phách yếu để nối.</p>
<p>${go('prog', 'Dựng vòng và tải MIDI')}</p>`
    },
    {
      id: 'song', title: 'Từ vòng hợp âm đến một bài hát',
      html: `
<p>Một bài pop thường có cấu trúc: Intro – Verse – Pre-chorus – Chorus – Verse – Pre-chorus – Chorus – Bridge – Chorus. Mỗi phần cần khác phần trước một chút để giữ sự chú ý.</p>
<ul>
<li><strong>Verse</strong>: kể chuyện, giai điệu ở âm vực thấp hơn, phối nhẹ.</li>
<li><strong>Pre-chorus</strong>: tạo độ căng, thường kết ở hợp âm IV hoặc V để “đẩy” vào điệp khúc.</li>
<li><strong>Chorus</strong>: câu hook dễ nhớ, giai điệu cao hơn, phối dày hơn.</li>
<li><strong>Bridge</strong>: đổi màu, ví dụ bắt đầu bằng vi hoặc một hợp âm mượn như ♭VI.</li>
</ul>
<p>Mẹo viết giai điệu: đi liền bậc là chính; sau một bước nhảy xa, hãy đi ngược lại theo bậc liền. Lặp lại một mô-típ nhịp điệu ngắn giúp người nghe nhớ bài.</p>
<p>Mẹo cho ca sĩ: tìm nốt cao nhất và thấp nhất bạn hát thoải mái, rồi chọn giọng (và capo) sao cho điệp khúc nằm gần đỉnh âm vực đó.</p>
<p>${go('prog', 'Bắt đầu với một vòng hợp âm')}</p>`
    }
  ];

  const ROADMAP = [
    {
      id: 'guitar', title: 'Guitar', items: [
        ['g1', 'Đổi hợp âm mở C – G – Am – F – Em – D trơn tru ở 70 BPM'],
        ['g2', 'Nhịp quạt Xuống – Xuống Lên – Lên Xuống Lên đều theo metronome'],
        ['g3', 'Hợp âm chặn dáng E: trưởng, thứ, 7, m7'],
        ['g4', 'Hợp âm chặn dáng A: trưởng, thứ, 7, m7, maj7'],
        ['g5', 'Thuộc tên nốt tự nhiên trên dây 6 và dây 5'],
        ['g6', 'Ngũ cung thứ: vị trí 1'],
        ['g7', 'Ngũ cung thứ: đủ 5 vị trí'],
        ['g8', 'Rải dây cơ bản p – i – m – a'],
        ['g9', 'Hợp âm maj7, m7, add9 cho ballad'],
        ['g10', 'Đệm hát trọn vẹn một bài, có dùng capo'],
        ['g11', 'Nghe phân biệt hợp âm trưởng/thứ đúng trên 90%']
      ]
    },
    {
      id: 'color', title: 'Hợp âm màu', items: [
        ['c1', 'Dựng hợp âm trưởng/thứ từ nốt gốc tự nhiên dưới 3 giây'],
        ['c2', 'Dựng hợp âm trưởng/thứ từ mọi nốt gốc (cả thăng/giáng)'],
        ['c3', 'Thuộc 5 loại hợp âm 7: maj7, 7, m7, m7♭5, dim7'],
        ['c4', 'Phân biệt sus2, add9 và 9; 6 và m7'],
        ['c5', 'Dựng hợp âm 9, 11, 13 và biết bỏ nốt nào khi bấm'],
        ['c6', 'Viết 7 hợp âm bảy thuận của một giọng trưởng bất kỳ'],
        ['c7', 'Chơi ii – V – I ở 3 giọng khác nhau'],
        ['c8', 'Thêm màu cho một vòng hợp âm quen thuộc mà không bị lạc giọng']
      ]
    },
    {
      id: 'piano', title: 'Piano', items: [
        ['p1', 'Tìm được mọi nốt trên phím đàn nhờ nhóm 2 và 3 phím đen'],
        ['p2', 'Hợp âm ba trưởng và thứ ở tay phải trong 12 giọng'],
        ['p3', 'Đảo phím: thế gốc, đảo 1, đảo 2'],
        ['p4', 'Âm giai C, G, F trưởng đúng ngón'],
        ['p5', 'Vòng I – V – vi – IV với đảo phím mượt'],
        ['p6', 'Tay trái nốt gốc, tay phải hợp âm'],
        ['p7', 'Đệm hát một bài ballad']
      ]
    },
    {
      id: 'fl', title: 'FL Studio và sáng tác', items: [
        ['f1', 'Remake một bài hoàn chỉnh'],
        ['f2', 'Viết vòng hợp âm 8 ô nhịp trong Piano roll'],
        ['f3', 'Thu guitar và giọng hát vào Playlist'],
        ['f4', 'Viết bassline theo nốt gốc của hợp âm'],
        ['f5', 'Viết giai điệu trên âm giai của bài'],
        ['f6', 'Dựng cấu trúc Intro – Verse – Pre-chorus – Chorus – Bridge'],
        ['f7', 'Mix cơ bản: gain staging, EQ, reverb trên track send'],
        ['f8', 'Hoàn thành một bản demo sáng tác của riêng bạn']
      ]
    }
  ];

  global.LESSONS = LESSONS;
  global.ROADMAP = ROADMAP;
})(window);
