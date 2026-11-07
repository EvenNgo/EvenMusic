# Phím & Phím

Web học nhạc lý cho người chơi guitar, piano và làm nhạc trên FL Studio. Chạy hoàn toàn trong trình duyệt: không cần cài đặt, không cần máy chủ, không dùng thư viện ngoài.

## Tính năng

- **Hợp âm**: 28 loại hợp âm trên 17 nốt gốc, viết đúng thăng/giáng (C♯maj7 = C♯ E♯ G♯ B♯). Xem trên cần đàn, các thế bấm guitar có số ngón và dấu chặn, thế đảo trên piano, hợp âm có bass riêng (slash chord), cho biết hợp âm thuộc giọng nào, tải MIDI.
- **Âm giai**: 16 âm giai và điệu thức, công thức cung/nửa cung, hóa biểu, giọng song song. Vị trí trên cần đàn (2 nốt mỗi dây cho ngũ cung, 3 nốt mỗi dây cho âm giai 7 nốt), hợp âm thuận kèm số La Mã và chức năng, soi các nốt của một hợp âm ngay trong âm giai.
- **Vòng hợp âm**: 14 vòng mẫu, hợp âm thuận, hợp âm mượn, hợp âm át phụ, thêm hợp âm bất kỳ. Nghe thử bằng guitar hoặc piano với 3 kiểu đệm (ngân, quạt theo nhịp, rải). Chuyển giọng, đổi trưởng/thứ, gợi ý capo, piano roll, xuất MIDI cho FL Studio, lưu vòng.
- **Nhận diện hợp âm**: bấm nốt trên piano hoặc cần đàn, trang cho biết đó là hợp âm gì.
- **Vòng quãng 5** tương tác.
- **Bản đồ cần đàn**: tất cả nốt, nốt tự nhiên, tìm một nốt, bản đồ quãng.
- **Luyện tập**: dựng hợp âm (bấm đủ các nốt của một hợp âm, có bấm giờ, thời gian trung bình và nhanh nhất), đọc tên hợp âm từ các nốt, nghe quãng, nghe loại hợp âm, đố nốt trên cần đàn, nhạc lý nhanh, có thống kê điểm.
- **Metronome** (gõ để đo tempo, chia nhỏ phách, tự tăng tốc) và **tuner** dùng micro.
- **Bài học và lộ trình** cho guitar, piano, FL Studio và sáng tác, kèm một chuỗi bài về hợp âm màu: đọc công thức, hợp âm 7, sus/6/add9, hợp âm mở rộng 9–13 và hợp âm biến, cách thêm màu cho vòng hợp âm, cách luyện để suy hợp âm nhanh.
- **Cài đặt**: tên nốt C D E hoặc Đô Rê Mi, 8 cách lên dây (kể cả ukulele và bass), số phím, cần đàn cho người thuận tay trái, giao diện sáng/tối.

## Chạy thử trên máy

Mở `index.html` bằng trình duyệt là dùng được. Riêng tuner cần micro, mà trình duyệt chỉ cho dùng micro trên `https` hoặc `localhost`. Muốn thử tuner trên máy, chạy:

```bash
python -m http.server 8000
```

rồi mở `http://localhost:8000`.

## Đưa lên GitHub Pages

1. Tạo repository mới trên GitHub, ví dụ `phim-va-phim`, để chế độ Public.
2. Tải toàn bộ nội dung thư mục này lên. Có thể kéo thả trên trang web của GitHub (Add file → Upload files), hoặc dùng git:

   ```bash
   git init
   git add .
   git commit -m "Phím & Phím"
   git branch -M main
   git remote add origin https://github.com/<tên-tài-khoản>/phim-va-phim.git
   git push -u origin main
   ```

3. Vào **Settings → Pages**. Ở mục **Build and deployment**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)`, rồi bấm **Save**.
4. Sau một đến hai phút, web chạy tại `https://<tên-tài-khoản>.github.io/phim-va-phim/`.

Mỗi lần sửa file JS/CSS, tăng số `?v=` trong các thẻ `<script>` và `<link>` ở `index.html` (ví dụ `?v=3` → `?v=4`) để trình duyệt của người dùng tải bản mới thay vì dùng bản cũ trong bộ nhớ đệm.

File `index.html` phải nằm ngay ở thư mục gốc của repository (không nằm trong thư mục con).

## Dùng với FL Studio

Ở trang Vòng hợp âm, bấm **Tải MIDI cho FL Studio**, rồi kéo file `.mid` vào Piano roll hoặc Playlist (hoặc vào File → Import → MIDI file). File MIDI có nốt bass ở quãng 8 thấp và hợp âm tay phải đã được dẫn giọng mượt. Trang Hợp âm và Âm giai cũng có nút tải MIDI riêng.

## Cấu trúc thư mục

```
index.html          khung giao diện của các trang
css/style.css       màu sắc, bố cục, giao diện sáng/tối
fonts/              hai ký tự ♯ ♭ (cắt từ font Arimo)
js/theory.js        lõi nhạc lý: nốt, quãng, hợp âm, âm giai, thế bấm, nhận diện hợp âm
js/audio.js         âm thanh Web Audio: guitar, piano, hồi âm, metronome, tuner
js/render.js        vẽ SVG: cần đàn, sơ đồ thế bấm, piano, vòng quãng 5, piano roll
js/midi.js          ghi file MIDI
js/lessons.js       nội dung bài học và lộ trình
js/app.js           trạng thái, điều hướng, cài đặt, thành phần dùng chung
js/views/*.js       mã của từng trang
```

Cài đặt, các vòng đã lưu, tiến độ lộ trình và điểm luyện tập được lưu trong localStorage của trình duyệt, nên chỉ có trên máy và trình duyệt bạn đang dùng.

`js/theory.js` không phụ thuộc giao diện nên chạy được trong Node để kiểm tra nhanh:

```bash
node -e "const T=require('./js/theory.js'); console.log(T.scaleTones(T.parseNote('F#'),'major').map(t=>T.name(t.note)).join(' '))"
```

## Khi gặp sự cố

- **Không nghe tiếng trên iPhone đời cũ**: tắt chế độ im lặng (công tắc bên hông máy), vì Safari cũ tắt tiếng Web Audio theo công tắc này.
- **Tuner không bật được micro**: mở trang qua https (GitHub Pages) hoặc localhost, rồi cho phép trang dùng micro.
- **Muốn xóa dữ liệu**: Cài đặt → Xóa dữ liệu đã lưu.

## Giấy phép

Mã nguồn theo giấy phép MIT (xem `LICENSE`). Hai ký tự ♯ ♭ trong thư mục `fonts/` được cắt từ font Arimo, theo giấy phép Apache 2.0 (xem `fonts/LICENSE-Arimo.txt`).
