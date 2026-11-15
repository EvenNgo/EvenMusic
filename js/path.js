/* Phím & Phím — js/path.js
 * Nội dung trang “Hôm nay”: lộ trình chia thành từng bước nhỏ, mỗi bước có hướng dẫn chi tiết,
 * tiêu chí hoàn thành, bản rút gọn 5 phút cho hôm mệt, và gợi ý video để xem thêm.
 *
 * Mỗi bước: { id, t: tiêu đề, min: số phút, why: vì sao, how: [các bước làm], done: [tiêu chí xong],
 *             light: việc 5 phút, go: [[đích, nhãn]], yt: [[từ khóa YouTube, nhãn]] }
 * Đích (go): 'drill|maj,min|natural' mở bài Dựng hợp âm với bộ hợp âm cho sẵn;
 *            'lesson|<id>' mở một bài học; còn lại giống data-go của bài học ('prog', 'tools', 'train|name'…).
 */
(function (global) {
  'use strict';

  const PATH = [
    {
      id: 's1', title: 'Giai đoạn 1 · Thuộc hợp âm thật nhanh', weeks: 'khoảng 2 tuần',
      goal: 'Nhìn tên hợp âm là thấy ngay các nốt, không phải đếm nửa cung. Đây là nền cho mọi thứ phía sau.',
      steps: [
        {
          id: 'h1', t: 'Hợp âm trưởng từ 7 nốt tự nhiên', min: 15,
          why: 'Bạn đã biết C = C E G nhưng chưa nhanh. Thuộc 7 hợp âm trưởng C D E F G A B như bảng cửu chương thì mọi hợp âm khác chỉ là đổi 1–2 nốt.',
          how: [
            'Viết ra giấy 7 hợp âm: C = C E G, D = D F♯ A, E = E G♯ B, F = F A C, G = G B D, A = A C♯ E, B = B D♯ F♯.',
            'Đọc to từng dòng 3 lần. Để ý: C, F, G không có dấu; D, A có 1 dấu thăng ở giữa; E có 1; B có 2.',
            'Bấm nút “Luyện ngay” bên dưới: bài Dựng hợp âm chỉ hỏi hợp âm trưởng từ nốt tự nhiên.',
            'Làm 20 câu. Câu nào sai thì nhìn lại giấy, đọc to hợp âm đó 3 lần rồi làm tiếp.'
          ],
          done: ['Đúng ít nhất 18/20 câu', 'Thời gian trung bình dưới 4 giây'],
          light: 'Chỉ đọc to 7 hợp âm trưởng trên giấy 2 lượt, rồi làm 5 câu luyện.',
          go: [['drill|maj|natural', 'Luyện ngay: hợp âm trưởng']],
          yt: [['major triads all 12 keys piano', 'Hợp âm trưởng trên piano']]
        },
        {
          id: 'h2', t: 'Thêm hợp âm thứ: chỉ hạ nốt giữa', min: 15,
          why: 'Hợp âm thứ chính là hợp âm trưởng hạ nốt 3 xuống nửa cung. Không cần học thuộc riêng.',
          how: [
            'Lấy 7 hợp âm trưởng hôm trước, hạ nốt giữa xuống nửa cung: C → Cm = C E♭ G, D → Dm = D F A, E → Em = E G B…',
            'Viết đủ 7 hợp âm thứ ra giấy, cạnh hợp âm trưởng tương ứng.',
            'Luyện bài Dựng hợp âm với bộ Trưởng + Thứ, nốt gốc tự nhiên. Làm 30 câu.',
            'Mỗi khi gặp hợp âm thứ, nói thầm trong đầu: “trưởng là…, hạ nốt giữa là…”.'
          ],
          done: ['Đúng ít nhất 27/30 câu', 'Thời gian trung bình dưới 4 giây', 'Không cần nhìn giấy nữa'],
          light: 'Viết 7 cặp trưởng/thứ ra giấy, không cần luyện trên máy.',
          go: [['drill|maj,min|natural', 'Luyện ngay: trưởng + thứ'], ['lesson|chords', 'Xem lại bài Hợp âm được xây như thế nào']],
          yt: [['major vs minor chords explained', 'Trưởng và thứ khác nhau thế nào']]
        },
        {
          id: 'h3', t: 'Nốt gốc có thăng/giáng', min: 20,
          why: 'Beat R&B hay ở các giọng như D♭, E♭, A♭, B♭. Cần dựng hợp âm từ mọi nốt gốc.',
          how: [
            'Mẹo: hợp âm có nốt gốc giáng = hợp âm của nốt tự nhiên ngay trên, hạ cả 3 nốt xuống nửa cung. B = B D♯ F♯ → B♭ = B♭ D F.',
            'Thử tự suy: E♭ (từ E = E G♯ B), A♭ (từ A = A C♯ E), D♭ (từ D = D F♯ A). Viết ra giấy.',
            'Luyện bài Dựng hợp âm, bộ Trưởng + Thứ, chọn “Cả thăng/giáng”. Làm 30 câu.',
            'Lần đầu chậm là bình thường. Đừng để ý thời gian, chỉ cần đúng.'
          ],
          done: ['Đúng ít nhất 25/30 câu', 'Tự suy được E♭, A♭, D♭, B♭ trưởng không cần nhìn'],
          light: 'Chỉ suy 4 hợp âm B♭, E♭, A♭, D♭ trưởng ra giấy bằng mẹo hạ nửa cung.',
          go: [['drill|maj,min|all', 'Luyện ngay: mọi nốt gốc']]
        },
        {
          id: 'h4', t: 'Hợp âm 7: maj7, 7, m7', min: 20,
          why: 'R&B và hip-hop gần như không dùng hợp âm ba trơn. Ba loại này chiếm phần lớn các bài.',
          how: [
            'Đọc bài “Hợp âm bảy” (nút bên dưới), bấm nghe Cmaj7, C7, Cm7 vài lần để nhớ màu.',
            'Nhớ hai mốc: 7 trưởng = nửa cung dưới nốt gốc (C → B); ♭7 = một cung dưới nốt gốc (C → B♭).',
            'Công thức: maj7 = trưởng + 7 trưởng; 7 = trưởng + ♭7; m7 = thứ + ♭7.',
            'Luyện Dựng hợp âm với bộ maj7, 7, m7, nốt gốc tự nhiên. Làm 20 câu.'
          ],
          done: ['Đúng ít nhất 17/20 câu', 'Phân biệt được Cmaj7 và C7 khi nghe'],
          light: 'Mở bài Hợp âm bảy, bấm nghe Cmaj7 – C7 – Cm7, đọc to các nốt của từng hợp âm.',
          go: [['drill|maj7,7,m7|natural', 'Luyện ngay: hợp âm 7'], ['lesson|sevenths', 'Bài: Hợp âm bảy']],
          yt: [['seventh chords explained maj7 dominant 7 minor 7', 'Ba loại hợp âm 7']]
        },
        {
          id: 'h5', t: 'Thêm m7♭5, dim7 và đọc tên hợp âm', min: 20,
          why: 'Đủ 5 loại hợp âm 7. Luyện chiều ngược (nhìn nốt đoán tên) để nhận ra hợp âm khi dò bài.',
          how: [
            'Học chuỗi hạ nửa cung: Cmaj7 → C7 → Cm7 → Cm7♭5 → Cdim7, mỗi bước hạ đúng 1 nốt.',
            'Bấm nghe cả chuỗi trong bài Hợp âm bảy.',
            'Luyện Dựng hợp âm với đủ 5 loại, 20 câu.',
            'Chuyển sang bài Đọc tên hợp âm, cùng bộ hợp âm, 20 câu.'
          ],
          done: ['Dựng hợp âm: đúng 16/20', 'Đọc tên hợp âm: đúng 16/20'],
          light: 'Đọc to chuỗi Cmaj7 → C7 → Cm7 → Cm7♭5 → Cdim7 kèm các nốt.',
          go: [['drill|maj7,7,m7,m7b5,dim7|natural', 'Luyện: dựng 5 loại hợp âm 7'], ['train|name', 'Luyện: đọc tên hợp âm']]
        },
        {
          id: 'h6', t: 'Hợp âm thuận có màu của 3 giọng', min: 25,
          why: 'Biết một giọng có những hợp âm nào thì dò bài và làm beat nhanh gấp nhiều lần.',
          how: [
            'Công thức luôn đúng: Imaj7 – iim7 – iiim7 – IVmaj7 – V7 – vim7 – viiø7.',
            'Viết ra giấy cho C trưởng: Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7♭5.',
            'Tự viết cho D trưởng và D♭ trưởng, rồi mở trang Âm giai (chọn giọng, xem phần Hợp âm thuận) để kiểm tra.',
            'Mở trang Vòng hợp âm, chọn D trưởng, bật “Hợp âm bảy”, bấm nghe từng hợp âm.'
          ],
          done: ['Viết đúng 7 hợp âm bảy thuận của C, D, D♭ trưởng', 'Nghe và nhận ra hợp âm V7 “muốn về nhà”'],
          light: 'Chỉ viết 7 hợp âm thuận của D trưởng và kiểm tra trên trang Âm giai.',
          go: [['scale|D|major', 'Mở Âm giai D trưởng'], ['prog', 'Mở Vòng hợp âm']]
        }
      ]
    },
    {
      id: 's2', title: 'Giai đoạn 2 · Làm quen FL Studio', weeks: 'khoảng 2 tuần',
      goal: 'Làm được một beat ngắn 8 ô nhịp từ đầu đến khi xuất ra MP3, không cần hay, chỉ cần xong.',
      steps: [
        {
          id: 'f1', t: 'Bản đồ FL Studio: 5 cửa sổ chính', min: 20,
          why: 'FL “khó thao tác” chủ yếu vì chưa biết cái gì nằm ở đâu. Chỉ cần 5 cửa sổ là làm được beat.',
          how: [
            'Mở FL, File → New. Lần lượt bấm các phím tắt và nhìn cửa sổ nào hiện ra:',
            'F6 = Channel rack: danh sách nhạc cụ, có lưới 16 ô để bấm trống.',
            'F7 = Piano roll: nơi viết nốt cho nhạc cụ đang chọn (hợp âm, bass, giai điệu).',
            'F5 = Playlist: nơi xếp các đoạn (pattern) và audio theo thời gian để thành bài.',
            'F9 = Mixer: nơi chỉnh âm lượng, thêm hiệu ứng cho từng nhạc cụ.',
            'Browser (cột bên trái): kho tiếng có sẵn. Mở thư mục Packs, bấm vào vài tiếng kick, snare để nghe thử.',
            'Lưu project với tên “bai-tap-1”.'
          ],
          done: ['Mở được 4 cửa sổ bằng F5, F6, F7, F9 mà không cần nhìn hướng dẫn', 'Tìm và nghe được ít nhất 3 tiếng kick trong Browser'],
          light: 'Chỉ mở FL, bấm F5, F6, F7, F9 mỗi phím một lần để nhớ vị trí.',
          yt: [['FL Studio beginner tutorial interface', 'FL Studio cho người mới (tiếng Anh)'], ['hướng dẫn FL Studio cơ bản cho người mới', 'FL Studio cơ bản (tiếng Việt)']]
        },
        {
          id: 'f2', t: 'Beat trống đầu tiên trong Channel rack', min: 25,
          why: 'Trống là xương sống của hip-hop. Lưới 16 ô của Channel rack chính là lưới trống trong bài học.',
          how: [
            'Đặt tempo 85. Mở Channel rack (F6). Thường đã có sẵn Kick, Clap, Hat, Snare.',
            'Mở bài “Remake R&B và hip-hop”, xem lưới trống Boom bap.',
            'Bấm các ô theo lưới đó: Kick ở ô 1, 8, 11; Snare/Clap ở ô 5 và 13; Hat ở mọi ô lẻ (1, 3, 5…).',
            'Bấm Space nghe. Thay tiếng kick/snare khác bằng cách kéo tiếng từ Browser thả vào đúng kênh.',
            'Thử bỏ bớt hoặc thêm một nốt kick để nghe nhịp thay đổi thế nào.'
          ],
          done: ['Có một pattern trống lặp được, nghe ra nhịp hip-hop', 'Đã tự thay ít nhất 1 tiếng trống'],
          light: 'Chỉ bấm kick ô 1 và 11, clap ô 5 và 13, nghe lặp lại.',
          go: [['lesson|rnb', 'Bài: Remake R&B và hip-hop (lưới trống)']],
          yt: [['FL Studio channel rack drum pattern beginner', 'Lập trình trống trong Channel rack']]
        },
        {
          id: 'f3', t: 'Đưa vòng hợp âm vào Piano roll', min: 25,
          why: 'Không cần tự bấm từng nốt: trang này xuất được MIDI hợp âm, chỉ việc kéo vào FL.',
          how: [
            'Trên trang này mở Vòng hợp âm, chọn giọng C trưởng, vòng Cmaj7 – Am7 – Dm7 – G7 (bật “Hợp âm bảy”), BPM 85, bấm Tải MIDI.',
            'Trong FL: Channel rack → nút + ở dưới → chọn một nhạc cụ piano (ví dụ FL Keys) hoặc FLEX.',
            'Chọn kênh đó, bấm F7 mở Piano roll, kéo file .mid vừa tải thả vào Piano roll.',
            'Bấm Space nghe cùng trống. Thử đổi sang tiếng khác (Rhodes, pad) để nghe màu thay đổi.'
          ],
          done: ['Hợp âm phát cùng trống trong cùng một pattern', 'Thử được ít nhất 2 tiếng nhạc cụ khác nhau'],
          light: 'Chỉ tải file MIDI về máy và kéo vào Piano roll, chưa cần chọn tiếng.',
          go: [['prog', 'Mở Vòng hợp âm để tải MIDI']],
          yt: [['FL Studio piano roll import midi chords', 'Nhập MIDI vào Piano roll']]
        },
        {
          id: 'f4', t: 'Bass theo nốt gốc', min: 20,
          why: 'Bass nối trống với hợp âm. Quy tắc đơn giản nhất: chơi nốt gốc của hợp âm ở đầu mỗi ô nhịp.',
          how: [
            'Thêm một kênh bass (tìm “808” hoặc “bass” trong Browser, kéo vào Channel rack).',
            'Mở Piano roll của kênh bass. Mỗi ô nhịp đặt một nốt dài: C – A – D – G (nốt gốc của 4 hợp âm).',
            'Đặt nốt ở quãng 8 thấp (khoảng C1–C2) và nghe trên tai nghe.',
            'Thêm nhịp: cho bass đánh cùng chỗ với kick để trống và bass “dính” vào nhau.'
          ],
          done: ['Bass đúng nốt gốc từng hợp âm', 'Bass đánh trùng ít nhất 2 nốt kick mỗi ô nhịp'],
          light: 'Chỉ đặt 4 nốt bass dài C – A – D – G.',
          yt: [['FL Studio how to make bassline follow chords', 'Viết bass theo hợp âm']]
        },
        {
          id: 'f5', t: 'Xếp thành bài ngắn và xuất MP3', min: 25,
          why: 'Hoàn thành một thứ dù nhỏ quan trọng hơn làm mãi một thứ dở dang.',
          how: [
            'Mở Playlist (F5). Kéo pattern vào Playlist, kéo dài 8 ô nhịp.',
            'Làm thêm một pattern “intro” chỉ có hợp âm (không trống), đặt 4 ô nhịp ở đầu.',
            'Kết quả: Intro 4 ô (hợp âm) → 8 ô (đủ trống, bass, hợp âm).',
            'Mixer (F9): kéo âm lượng sao cho kênh Master không chạm đỏ.',
            'File → Export → MP3 file, nghe lại trên điện thoại.'
          ],
          done: ['Có file MP3 dài khoảng 30 giây', 'Đã nghe lại trên điện thoại'],
          light: 'Chỉ xuất MP3 từ pattern hiện có, không cần xếp intro.',
          yt: [['FL Studio playlist arrange patterns export mp3', 'Xếp Playlist và xuất bài']]
        }
      ]
    },
    {
      id: 's3', title: 'Giai đoạn 3 · Beat R&B và trap', weeks: 'khoảng 2 tuần',
      goal: 'Làm được một beat R&B chậm và một beat trap có 808, gần với chất nhạc bạn thích.',
      steps: [
        {
          id: 'b1', t: 'Beat R&B chậm với hợp âm màu', min: 30,
          why: 'R&B chậm dễ hơn trap và dùng ngay hợp âm 7, 9 vừa học.',
          how: [
            'Tempo 70. Vòng hợp âm: Fmaj7 – E7 – Am7 – Gm7 – C7 (vòng “Just the Two of Us”) hoặc Dm9 – G13 – Cmaj9.',
            'Tải MIDI từ trang Vòng hợp âm, dùng tiếng Rhodes/piano điện hoặc pad mềm.',
            'Trống theo lưới “R&B chậm” trong bài học. Hạ âm lượng hi-hat, cho nó nhẹ hơn kick/snare.',
            'Bật swing nhẹ (núm Swing trong Channel rack) để nhịp bớt cứng.',
            'Bass theo nốt gốc, nốt dài.'
          ],
          done: ['Beat 8 ô nhịp có hợp âm màu, trống, bass', 'Nghe “chill”, không bị cứng như máy'],
          light: 'Chỉ đưa vòng Fmaj7 – E7 – Am7 – Gm7 – C7 vào FL với tiếng Rhodes và nghe.',
          go: [['lesson|rnb', 'Bài: Remake R&B và hip-hop'], ['prog', 'Vòng hợp âm (tải MIDI)']],
          yt: [['how to make RnB beat FL Studio', 'Làm beat R&B trong FL Studio']]
        },
        {
          id: 'b2', t: 'Trống trap: half-time và hi-hat roll', min: 30,
          why: 'Đặc trưng của trap là snare ở phách 3 và hi-hat chạy dày, có roll.',
          how: [
            'Tempo 140. Làm trống theo lưới Trap trong bài học: kick ô 1 và 11, clap ô 9.',
            'Hi-hat: mở Piano roll của kênh hat, đổi lưới (biểu tượng nam châm) sang 1/4 step để viết nốt móc kép.',
            'Tạo roll: ở cuối ô nhịp 2 và 4, đổi lưới sang 1/2 step hoặc 1/6 step (chùm ba) rồi vẽ 3–6 nốt hat sát nhau.',
            'Đổi velocity: nốt hat xen kẽ mạnh–nhẹ (kéo thanh velocity ở dưới Piano roll).'
          ],
          done: ['Pattern trap 4 ô nhịp có ít nhất 2 chỗ roll', 'Velocity hi-hat không đều nhau'],
          light: 'Chỉ làm kick + clap half-time và hi-hat móc đơn, chưa cần roll.',
          go: [['lesson|rnb', 'Xem lưới trống Trap']],
          yt: [['trap hi hat rolls FL Studio tutorial', 'Hi-hat roll trong FL Studio']]
        },
        {
          id: 'b3', t: '808 đúng nốt và có glide', min: 30,
          why: '808 là bass của trap. Sai nốt là cả beat nghe lệch.',
          how: [
            'Tìm một tiếng 808 trong Browser (tìm “808”), kéo vào Channel rack.',
            'Viết 808 theo nốt gốc của vòng hợp âm, ví dụ giọng thứ: Cm – A♭ – B♭ – Cm → nốt C – A♭ – B♭ – C.',
            'Kiểm tra cao độ: phát cùng hợp âm, nếu nghe chói/lệch thì 808 có thể chưa đúng nốt gốc, mở Tuner trên trang này để đo tiếng 808.',
            'Glide: trong Channel settings của kênh 808, bật Porta (và Mono), rồi cho hai nốt 808 chồng lên nhau một chút trong Piano roll để nốt trượt.',
            'Kick và 808: nếu dải trầm bị đục, dùng kick ngắn hoặc dời 808 bắt đầu ngay sau kick.'
          ],
          done: ['808 đúng nốt gốc từng hợp âm', 'Có ít nhất 1 chỗ 808 trượt nốt'],
          light: 'Chỉ đặt 808 bốn nốt C – A♭ – B♭ – C và nghe cùng hợp âm.',
          go: [['tools', 'Mở Tuner']],
          yt: [['808 glide FL Studio tutorial', '808 glide trong FL Studio'], ['how to tune 808 to key', 'Chỉnh 808 đúng giọng']]
        },
        {
          id: 'b4', t: 'Cấu trúc beat và hiệu ứng chuyển đoạn', min: 30,
          why: 'Một vòng 4 ô nhịp lặp mãi rất chán. Thêm/bớt lớp tiếng tạo ra các đoạn khác nhau.',
          how: [
            'Làm 3 pattern: A (chỉ hợp âm + hat nhẹ), B (đủ trống + 808), C (B + thêm một lớp giai điệu/pad).',
            'Xếp: Intro A 4 ô → Verse B 8 ô → Hook C 8 ô → Verse B 8 ô → Hook C 8 ô.',
            'Trước mỗi Hook, tắt hết trống ở nhịp cuối của ô nhịp trước đó.',
            'Thêm một tiếng crash hoặc riser ở đầu Hook.'
          ],
          done: ['Beat dài khoảng 1–1,5 phút có ít nhất 3 đoạn khác nhau', 'Có ít nhất 1 chỗ ngắt trống trước hook'],
          light: 'Chỉ làm chỗ ngắt trống trước hook trong beat đang có.',
          yt: [['how to arrange a trap beat FL Studio', 'Xếp cấu trúc beat']]
        }
      ]
    },
    {
      id: 's4', title: 'Giai đoạn 4 · Thu âm giọng tại nhà', weeks: 'khoảng 1–2 tuần',
      goal: 'Thu được một đoạn hook 8 ô nhịp có giai điệu, giọng đã chỉnh và có không gian.',
      steps: [
        {
          id: 'r1', t: 'Thiết lập thu âm (làm một lần)', min: 20,
          why: 'Làm đúng một lần thì những lần sau chỉ việc bấm thu.',
          how: [
            'Options → Audio settings → Device: FL Studio ASIO (hoặc driver của sound card). Bỏ chọn Triple buffer.',
            'Show ASIO panel: Input = micro, Output = tai nghe, buffer 256.',
            'Mixer (F9): chọn một kênh trống, đặt tên Vocal, ô đầu vào trên cùng bảng bên phải chọn In 1.',
            'Bật nút tròn (arm) ở chân kênh. Hát thử: thanh mức lên khoảng 2/3, không chạm đỏ.',
            'Lưu project này thành mẫu “thu-am” để lần sau mở ra là dùng.'
          ],
          done: ['Hát vào thì thanh mức kênh Vocal nhảy', 'Đã lưu project mẫu'],
          light: 'Chỉ kiểm tra micro có tín hiệu trong Mixer.',
          yt: [['how to record vocals in FL Studio', 'Thu âm giọng trong FL Studio']]
        },
        {
          id: 'r2', t: 'Ngân giai điệu trên beat', min: 25,
          why: 'Giai điệu hay thường đến từ ngân tự do, không phải ngồi nghĩ.',
          how: [
            'Mở trang Âm giai, chọn giọng của beat, xem âm giai ngũ cung trưởng/thứ: đó là những nốt “an toàn”.',
            'Cho beat lặp 8 ô nhịp. Đeo tai nghe một bên.',
            'Thu 5–10 lượt ngân không lời liên tục (na na, uh yeah…). Không dừng lại sửa.',
            'Nghe lại, đánh dấu (đổi màu clip) những câu dính tai nhất.'
          ],
          done: ['Có ít nhất 5 lượt thu', 'Chọn được 2 câu ngân thích nhất'],
          light: 'Thu đúng 2 lượt ngân, không cần nghe lại.',
          go: [['scale|C|majPent', 'Mở Âm giai ngũ cung']],
          yt: [['how to write melodies by humming over beat', 'Ngân giai điệu trên beat']]
        },
        {
          id: 'r3', t: 'Ghép lượt và chỉnh cao độ', min: 30,
          why: 'Bản thu hay là bản ghép từ những câu tốt nhất của nhiều lượt.',
          how: [
            'Trên Playlist, bấm C (công cụ cắt), cắt các lượt thu thành từng câu.',
            'Xếp các câu tốt nhất nối nhau thành 8 ô nhịp, mute phần còn lại. Bấm P để quay về công cụ bút.',
            'Kênh Vocal: thêm plugin chỉnh cao độ (Graillon, MAutoPitch hoặc Pitcher), đặt đúng giọng của beat.',
            'Thử retune speed nhanh (giọng “robot” melodic rap) và chậm (tự nhiên), chọn kiểu bạn thích.'
          ],
          done: ['Có một dòng giọng 8 ô nhịp liền mạch', 'Giọng đã chỉnh cao độ đúng giọng beat'],
          light: 'Chỉ cắt và ghép 2 câu hay nhất.',
          yt: [['vocal comping FL Studio', 'Ghép lượt thu trong FL'], ['free autotune plugin Graillon setup', 'Cài Graillon (miễn phí)']]
        },
        {
          id: 'r4', t: 'Chuỗi xử lý giọng cơ bản', min: 25,
          why: 'Giọng “trần” nghe nghiệp dư. Bốn bước đơn giản đã khác hẳn.',
          how: [
            'Kênh Vocal: Fruity Parametric EQ 2, cắt dải dưới khoảng 90 Hz.',
            'Thêm Fruity Compressor, nén nhẹ cho giọng đều hơn.',
            'Tạo kênh reverb: kênh trống + Fruity Reeverb 2 (Wet 100%), gửi kênh Vocal sang bằng mũi tên ở chân kênh reverb.',
            'Cân âm lượng: giọng nổi rõ trên beat, Master không chạm đỏ. Xuất MP3.'
          ],
          done: ['Giọng nghe rõ, có không gian, không bị chìm trong beat', 'Đã xuất MP3 và nghe trên 2 thiết bị'],
          light: 'Chỉ thêm EQ cắt dải dưới và một chút reverb.',
          yt: [['FL Studio vocal mixing stock plugins', 'Mix giọng bằng plugin có sẵn của FL'], ['mix vocal rap tiếng Việt FL Studio', 'Mix vocal rap (tiếng Việt)']]
        },
        {
          id: 'r5', t: 'Viết lời theo giai điệu, thêm bè và ad-lib', min: 30,
          why: 'Viết lời sau khi có giai điệu dễ hơn nhiều so với ép lời vào nhạc.',
          how: [
            'Nghe giai điệu đã ghép, đếm số âm tiết mỗi câu.',
            'Viết lời có đúng số âm tiết đó, chọn chữ có thanh điệu hợp với hướng đi của giai điệu (nốt lên cao hợp với dấu sắc, ngã).',
            'Thu lại hook với lời thật. Thu thêm 1 lượt double chỉ ở những từ cần nhấn.',
            'Thu vài ad-lib ngắn, đặt vào khoảng trống giữa các câu, cho nhỏ và lệch một bên.'
          ],
          done: ['Hook 8 ô nhịp có lời', 'Có ít nhất 1 lớp double hoặc ad-lib'],
          light: 'Chỉ viết lời cho 2 câu đầu của hook.',
          yt: [['how to write a hook melodic rap', 'Viết hook melodic rap'], ['vocal layering doubles adlibs tutorial', 'Double và ad-lib']]
        }
      ]
    },
    {
      id: 's5', title: 'Giai đoạn 5 · Remake một bài bạn thích', weeks: 'khoảng 2–3 tuần',
      goal: 'Dựng lại một bài hoàn chỉnh (gợi ý: Exit Sign – D trưởng, 75 BPM, vòng D – F♯m7 – Bm7 – G).',
      steps: [
        {
          id: 'm1', t: 'Lập bản đồ bài', min: 30,
          why: 'Biết bài có những đoạn nào, dài bao nhiêu thì việc dựng chỉ còn là làm theo.',
          how: [
            'Nghe cả bài, ghi bảng: Đoạn – Bắt đầu – Số ô nhịp – Có những tiếng gì.',
            'Đếm 1-2-3-4 theo phách, hết 4 là một ô nhịp. Các đoạn thường dài 4, 8, 16 ô.',
            'Nghe thêm 3 lượt, mỗi lượt chỉ để ý một thứ: trống, bass/808, hợp âm.',
            'Ghi chú vào ô Ghi chú của bước này để lần sau mở ra là thấy.'
          ],
          done: ['Có bảng đủ các đoạn của bài', 'Biết hook dài bao nhiêu ô nhịp'],
          light: 'Chỉ ghi các đoạn và thời điểm bắt đầu, chưa đếm ô nhịp.',
          go: [['lesson|remake1', 'Bài: Remake 1']]
        },
        {
          id: 'm2', t: 'Tempo, giọng, hợp âm, đưa vào FL', min: 30,
          why: 'Có khung hợp âm đúng tempo là đã xong phần khó nhất.',
          how: [
            'Kiểm tra lại tempo bằng nút Gõ để đo tempo trên trang Metronome.',
            'Nhập vòng hợp âm vào trang Vòng hợp âm (với Exit Sign: giọng D, I – iii – vi – IV), BPM đúng của bài.',
            'Phát song song với bài gốc, thử bật/tắt “Hợp âm bảy” để chọn bản giống hơn. Tải MIDI.',
            'FL: đặt tempo, kéo bài gốc vào Playlist làm tham chiếu, căn phách 1, đặt marker cho từng đoạn, kéo MIDI hợp âm vào.'
          ],
          done: ['Hợp âm trong FL phát khớp với bài gốc', 'Có marker cho mọi đoạn'],
          light: 'Chỉ nhập vòng hợp âm vào trang Vòng hợp âm và nghe song song với bài.',
          go: [['tools', 'Đo tempo'], ['prog', 'Vòng hợp âm'], ['lesson|remake2', 'Bài: Remake 2']]
        },
        {
          id: 'm3', t: 'Trống và 808 theo bản gốc', min: 40,
          why: 'Trống và 808 quyết định “chất” của bài hip-hop.',
          how: [
            'Nghe đoạn hook, ghi vị trí kick và snare trên lưới 16 ô (như lưới trong bài học).',
            'Dựng lại trong Channel rack/Piano roll, chọn tiếng có độ dày gần bản gốc.',
            'Hi-hat: móc kép hay móc đơn, có roll ở đâu.',
            '808: chơi nốt gốc (với Exit Sign: D – F♯ – B – G), nghe bản gốc xem có glide không.',
            'Bật/tắt track tham chiếu liên tục để so.'
          ],
          done: ['Trống hook khớp nhịp với bản gốc', '808 đúng nốt'],
          light: 'Chỉ đặt kick và snare của hook.',
          go: [['lesson|remake3', 'Bài: Remake 3']]
        },
        {
          id: 'm4', t: 'Lớp phụ, chuyển đoạn và mix', min: 40,
          why: 'Các chi tiết nhỏ làm bản remake nghe chuyên nghiệp.',
          how: [
            'Thêm các lớp còn thiếu: pad, guitar, giai điệu phụ, bè.',
            'Thêm hiệu ứng ở chỗ chuyển đoạn: ngắt trống, crash, riser.',
            'Cân âm lượng theo thứ tự kick → snare → 808 → giọng/lead → hợp âm → lớp phụ.',
            'So với bản gốc ở cùng độ lớn (hạ âm lượng track tham chiếu), sửa 3 chỗ khác nhất.',
            'Tắt track tham chiếu, xuất MP3.'
          ],
          done: ['Bản remake đủ dài cả bài', 'Đã so với bản gốc và sửa ít nhất 3 chỗ'],
          light: 'Chỉ thêm 1 chỗ ngắt trống trước hook.',
          go: [['lesson|remake4', 'Bài: Remake 4']]
        }
      ]
    },
    {
      id: 's6', title: 'Giai đoạn 6 · Bài đầu tiên của bạn', weeks: 'không giới hạn',
      goal: 'Một bản demo hoàn chỉnh do chính bạn viết: beat, giai điệu, lời.',
      steps: [
        {
          id: 'o1', t: 'Beat 8 ô nhịp từ vòng hợp âm của bạn', min: 40,
          why: 'Bắt đầu nhỏ: một vòng 8 ô nhịp hay là đủ để viết cả bài.',
          how: [
            'Chọn giọng và 4 hợp âm màu từ bảng hợp âm thuận (ví dụ iim9 – V13 – Imaj9 – vim7).',
            'Dựng beat theo đúng các bước đã làm ở giai đoạn 2–3.',
            'Mục tiêu là xong trong 1 buổi, không chỉnh quá kỹ.'
          ],
          done: ['Có beat 8 ô nhịp lặp được'],
          light: 'Chỉ chọn 4 hợp âm và nghe thử trên trang Vòng hợp âm.',
          go: [['prog', 'Vòng hợp âm'], ['lesson|coloruse', 'Bài: Thêm màu cho vòng hợp âm']]
        },
        {
          id: 'o2', t: 'Hook', min: 40,
          why: 'Hook là thứ người nghe nhớ. Làm hook trước, verse sau.',
          how: [
            'Ngân tự do trên beat 10 lượt, chọn câu hay nhất làm hook.',
            'Viết lời ngắn, lặp lại được, có một cụm từ dễ nhớ.',
            'Thu, ghép, chỉnh như giai đoạn 4.'
          ],
          done: ['Hook 8 ô nhịp có lời và đã thu'],
          light: 'Thu 3 lượt ngân cho hook.'
        },
        {
          id: 'o3', t: 'Verse và cấu trúc bài', min: 45,
          why: 'Verse kể chuyện, hook nhắc lại cảm xúc.',
          how: [
            'Viết verse 16 ô nhịp (khoảng 16 câu rap), giữ một chủ đề với hook.',
            'Xếp: Intro – Verse 1 – Hook – Verse 2 – Hook – Outro.',
            'Mỗi đoạn khác nhau một chút: thêm/bớt lớp tiếng, đổi nhịp trống.'
          ],
          done: ['Đủ cấu trúc bài từ đầu đến cuối'],
          light: 'Viết 4 câu đầu của verse 1.'
        },
        {
          id: 'o4', t: 'Hoàn thiện demo và chia sẻ', min: 40,
          why: 'Một bài xong và được người khác nghe dạy bạn nhiều hơn mười bài dở dang.',
          how: [
            'Mix như giai đoạn 4, xuất MP3.',
            'Nghỉ một ngày, nghe lại, sửa đúng 3 chỗ.',
            'Gửi cho 2–3 người bạn tin tưởng, hỏi: “Đoạn nào nhớ nhất? Đoạn nào chán nhất?”'
          ],
          done: ['Có file demo hoàn chỉnh', 'Đã nhận nhận xét từ ít nhất 2 người'],
          light: 'Chỉ nghe lại demo và ghi ra 3 chỗ muốn sửa.'
        }
      ]
    }
  ];

  // Mẹo khi mệt mỏi, mông lung
  const TIPS = [
    ['Mỗi buổi chỉ làm một bước', 'Trang này luôn chọn sẵn việc tiếp theo. Bạn không cần tự quyết hôm nay học gì.'],
    ['Mệt thì làm bản 5 phút', 'Bản 5 phút vẫn tính là một buổi tập. Giữ thói quen quan trọng hơn làm nhiều.'],
    ['3 buổi một tuần là đủ', 'Không cần tập mỗi ngày. Đặt mục tiêu theo tuần, vừa sức, rồi tăng dần.'],
    ['Đặt hẹn giờ rồi dừng', 'Bấm hẹn giờ, khi chuông kêu thì được phép dừng, dù chưa xong. Dừng khi còn hứng sẽ dễ quay lại hơn.'],
    ['Ghi lại chỗ khó', 'Viết vào ô Ghi chú: hôm nay kẹt ở đâu. Lần sau mở ra là biết bắt đầu từ đâu, không phải nhớ.'],
    ['Kẹt quá thì bỏ qua', 'Một bước khó quá có thể bỏ qua và quay lại sau. Lộ trình không phải bài kiểm tra.']
  ];

  // Kênh học. Dùng link tìm kiếm YouTube để luôn tìm đúng kênh, kể cả khi kênh đổi địa chỉ.
  const yt = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const RESOURCES = [
    {
      title: 'FL Studio từ cơ bản',
      items: [
        ['Image-Line (kênh chính thức của FL Studio)', 'Video hướng dẫn chính hãng cho từng tính năng, cập nhật theo phiên bản mới.', yt('Image-Line FL Studio tutorial')],
        ['In The Mix', 'Hướng dẫn FL Studio rõ ràng, chậm rãi, rất hợp người mới.', yt('In The Mix FL Studio beginner')],
        ['Tìm hướng dẫn tiếng Việt', 'Tìm “hướng dẫn FL Studio cơ bản” để chọn kênh tiếng Việt hợp với bạn.', yt('hướng dẫn FL Studio cơ bản tiếng Việt')]
      ]
    },
    {
      title: 'Làm beat hip-hop, trap, R&B',
      items: [
        ['Busy Works Beats', 'Làm beat trong FL Studio, nhiều video về trap, 808, hi-hat.', yt('Busy Works Beats FL Studio')],
        ['Tìm theo chủ đề: R&B', 'Video làm beat R&B, neo-soul với hợp âm màu.', yt('how to make RnB beat FL Studio')],
        ['Tìm theo chủ đề: 808 glide', 'Cách cho 808 trượt nốt và chỉnh đúng giọng.', yt('808 glide FL Studio tutorial')],
        ['Tìm tiếng Việt: làm beat trap', 'Kênh làm beat tiếng Việt.', yt('làm beat trap FL Studio tiếng Việt')]
      ]
    },
    {
      title: 'Thu âm và mix giọng',
      items: [
        ['Produce Like A Pro', 'Thu âm, mix, kinh nghiệm phòng thu thực tế.', yt('Produce Like A Pro vocal recording')],
        ['Tìm theo chủ đề: mix vocal rap', 'EQ, compressor, auto-tune, reverb cho giọng rap.', yt('mix rap vocals FL Studio stock plugins')],
        ['Tìm tiếng Việt: thu âm tại nhà', 'Thiết lập micro, sound card, thu âm trong FL bằng tiếng Việt.', yt('thu âm tại nhà FL Studio tiếng Việt')]
      ]
    },
    {
      title: 'Sáng tạo và cảm hứng',
      items: [
        ['Andrew Huang', 'Ý tưởng sáng tạo, thử thách làm nhạc, giúp bớt chán khi tập.', yt('Andrew Huang music production')],
        ['Video hậu trường của nghệ sĩ bạn thích', 'Xem cách họ làm việc trong phòng thu (behind the scenes).', yt('HIEUTHUHAI behind the scenes')]
      ]
    }
  ];

  global.PATH = PATH;
  global.PATH_TIPS = TIPS;
  global.RESOURCES = RESOURCES;
})(window);
