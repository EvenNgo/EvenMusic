/* Phím & Phím — js/lessons.js
 * Nội dung bài học (tiếng Việt) và lộ trình luyện tập.
 * Các nút trong bài dùng thuộc tính data-*:
 *   data-seq="60,62,64"   phát lần lượt từng nốt (số MIDI, 60 = C4)
 *   data-play="60,64,67"  phát cùng lúc
 *   data-chord="C:maj7"   phát một hợp âm theo tên
 *   data-go="chord|C|maj7", "scale|G|major", "prog", "fret|interval", "circle", "train|interval", "tools"
 */
(function (global) {
  'use strict';

  const T = global.Theory;
  const chip = (attr, value, label) => `<button type="button" class="lchip" ${attr}="${value}">${label}</button>`;
  const seq = (v, l) => chip('data-seq', v, l);
  const chord = (v, l) => chip('data-chord', v, l);
  const go = (v, l) => `<button type="button" class="lgo" data-go="${v}">${l}</button>`;

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
