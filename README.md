# 📘 DailyEng

Ứng dụng học tiếng Anh mỗi ngày: học từ theo chặng, quiz, trò chơi từ vựng, luyện phát âm và theo dõi tiến độ. Chạy như PWA, cài được lên điện thoại; trên máy tính có sidebar và giao diện rộng.

🌐 **Live demo:** https://daily-eng-omega.vercel.app

## Tính năng

**Học**
- Học theo chặng: mỗi 5 từ là một chặng, từ mới đi qua gặp từ → trắc nghiệm (Anh→Việt, Việt→Anh, nghe→chọn) → gõ lại / điền vào câu; combo, âm thanh, từ sai làm lại ngay. Ôn tập giãn cách (hệ hộp Leitner) — chỉ hiện từ tới hạn ôn
- Kiểm tra đầu vào (`/kiem-tra-dau-vao`): 20 câu chọn nghĩa từ dễ tới khó, ước mức nên học và gợi ý 3 bộ theo mục tiêu (TOEIC / giao tiếp / công việc / học thuật); kết quả lưu ở hồ sơ, trang Học hiện hàng "Gợi ý cho bạn"
- Kho bộ từ theo nhóm: TOEIC (11 bộ theo chủ đề đề thi), Cốt lõi (8 bộ theo tần suất), Giao tiếp (7), Công việc (6), Học thuật (4) — hơn 3.300 từ kèm phiên âm và câu ví dụ, sinh bằng AI rồi duyệt lại
- Tạo và sửa bộ từ riêng: dán hàng loạt từ Excel/Google Sheets/Quizlet (`word = nghĩa`, tab, `-`, `:`…), thêm/xoá/sửa từng từ kèm phiên âm và câu ví dụ

**Trò chơi** (mọi lượt đều ghi vào hệ ôn tập và tính XP)
- **Mưa từ vựng** — từ rơi xuống, gõ để máy bay bắn hạ; 2 chế độ (gõ từ tiếng Anh đang rơi / nhìn nghĩa nhớ ra từ), đạn bắn theo từng chữ gõ đúng, hiệu ứng nổ và âm thanh tổng hợp bằng Web Audio
- **Ghép cặp** — nối từ với nghĩa, đua với đồng hồ, lưu kỷ lục theo bộ
- **Nghe & gõ** — máy đọc từ, gõ lại đúng chính tả
- **Quiz** — trắc nghiệm 4 đáp án, xem lại từ sai
- **Nghe chọn hình** — nghe từ, chạm đúng hình trong 4 ảnh thật (Pixabay, `public/photos/`), thiếu ảnh thì dùng Twemoji; chỉ bộ có ≥4 từ vẽ được (`content/emoji-words.json`)

**Luyện kỹ năng**
- **Nghe chép câu** — máy đọc cả câu ví dụ, gõ lại toàn bộ; chấm từng từ (căn LCS), nút đọc chậm, gợi ý từ khoá
- **Luyện phát âm** — nghe mẫu, ghi âm nghe lại, chấm điểm bằng Web Speech API
- **Shadowing** — nghe câu mẫu, nói theo; máy tô từng từ nghe được, chấm %, ghi âm và phát nối tiếp với mẫu để so
- **Mock test TOEIC Part 2** — nghe câu hỏi và ba câu đáp A/B/C (TTS), không có chữ trên màn hình, mỗi câu nghe lại 1 lần; ngân hàng 70 câu viết tay đủ dạng Wh-/Yes-No/lựa chọn/trần thuật/câu hỏi đuôi (`content/toeic-part2.json`), nộp bài mới thấy lời thoại và giải thích
- **Mock test TOEIC Part 5** — 20 câu điền vào chỗ trống, 10 phút; nửa đề từ ngân hàng 200 câu ngữ pháp/từ vựng viết tay (`content/toeic-part5.json`), nửa sinh từ câu ví dụ các bộ TOEIC; đề được ký HMAC và chấm ở server; giải thích từng câu, lưu lịch sử và điểm cao nhất

**Động lực**
- XP và cấp độ (Người mới → Huyền thoại): nhớ +5 / quên +1 mỗi lượt, trần 300 XP/ngày từ trả lời; thưởng nhiệm vụ, điểm danh, mốc chuỗi không áp trần; cấp L cần 100·(L−1)·L XP
- Bảng xếp hạng XP 7 ngày / toàn thời gian giữa người dùng (hàm SQL `leaderboard`, chỉ lộ tên hiển thị và điểm; có nút ẩn mình khỏi bảng)
- Điểm danh mỗi ngày ở thanh trên (+10 XP, ngày thứ 7 liên tiếp +50), chuông việc đang chờ, mốc chuỗi ngày học 3/7/14/30/60/100 thưởng một lần; trang Phần thưởng (`/phan-thuong`) ghi rõ quy định và tình hình của mình
- Trang cá nhân công khai (`/nguoi-dung/<id>`): bấm tên trên bảng xếp hạng xem bìa, avatar, tiểu sử, cấp, XP, chuỗi, số tổng và huy hiệu của người khác (hàm `public_profile`, không lộ email; ai ẩn khỏi bảng xếp hạng thì không xem được)
- Huy hiệu: 22 mốc thành tích (chuỗi ngày, từ vựng, siêng năng, kỹ năng) tính từ dữ liệu học, lưu `profiles.badges`; hiện ở Cá nhân, huy hiệu nổi bật hiện cạnh tên trên bảng xếp hạng, trang chủ báo huy hiệu mới
- Nhiệm vụ hằng ngày: 3 việc nhỏ (học 10 từ + 2 việc xoay vòng: trò chơi, nghe chép, shadowing, mock test…), xong được XP thưởng, xong cả ba thưởng thêm
- Ôn tập hôm nay: gom từ đã học tới hạn từ mọi bộ vào một phiên (`/on-tap`)
- Chuỗi ngày học, biểu đồ tuần, phân bố hộp ôn, độ chính xác theo bộ, từ hay sai nhất
- Nhắc học qua thông báo đẩy (Web Push) vào giờ tự chọn (07:00 / 12:00 / 20:00), chỉ khi hôm đó chưa học

**Hỏi AI** (tuỳ chọn): con vịt nổi ở góc dưới phải, bấm vào là mở khung chat với gia sư tiếng Anh; có cả trang riêng `/hoi-ai`. Nút "Hỏi AI về từ này" ở câu ví dụ khi học và ở câu sai của mock test tự đính kèm ngữ cảnh. Chạy với **Gemini** (`GEMINI_API_KEY`, gói miễn phí của Google AI Studio) hoặc **Claude** (`ANTHROPIC_API_KEY`, ưu tiên nếu có cả hai); hạn mức 50 tin/người/ngày (`ai_chat_log`), không lưu nội dung hội thoại, trả lời stream. Không có khoá nào thì con vịt và mọi nút liên quan tự ẩn.

**Linh vật**: chú vịt vàng với 9 tư thế (tốt nghiệp, chào, nghe, học, chơi game, ăn mừng, buồn, ngủ, nói) — làm icon app, đổi theo tiến độ trong ngày ở trang chủ, vui/buồn ở màn kết thúc mỗi phiên, ngủ trong thông báo nhắc học, cầm micro ở luyện phát âm.

**Tài khoản & giao diện**
- Đăng nhập bằng email/mật khẩu (xác nhận bằng mã 6 số) hoặc Google
- Hồ sơ: ảnh đại diện và ảnh bìa tải lên (thu nhỏ trên trình duyệt, lưu Supabase Storage), tiểu sử, màu bìa, tên hiển thị, mục tiêu từ/ngày; giao diện sáng/tối/theo máy
- PWA: offline, cài lên màn hình chính; responsive: tab bar trên điện thoại, sidebar trên màn hình lớn

## Công nghệ

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4
- Supabase: Postgres, Row Level Security, Auth, Vault, pg_cron
- Web Speech API (đọc/nhận dạng giọng nói), Web Audio API (âm thanh game), Web Push
- Deploy trên Vercel

## Cấu trúc thư mục

```
app/
├── (app)/            # Các trang cần đăng nhập
│   ├── hoc/          #   Học theo chặng, tạo/sửa bộ từ
│   ├── quiz/         #   Quiz trắc nghiệm
│   ├── tro-choi/     #   Hub trò chơi: ghep-cap, nghe-go, mua-tu
│   ├── quan-tri/     #   Khu quản trị (admin): tổng quan, góp ý, người dùng, nội dung
│   ├── gioi-thieu/   #   Trang giới thiệu công khai + Về DailyEng, Tác giả, Bảo mật, Điều khoản, Góp ý
│   ├── ky-nang/      #   Hub kỹ năng: chep-cau, shadowing, mock-test (phat-am ở thư mục riêng)
│   ├── phat-am/      #   Luyện phát âm
│   └── tai-khoan/    #   Hồ sơ, cấp độ, thống kê, nhắc học, giao diện
├── (public)/         # Đăng nhập, nhập mã xác nhận, trang offline
├── auth/             # Callback Google và link xác nhận email
├── api/cron/         # pg_cron của Supabase gọi mỗi giờ để gửi nhắc học
├── _actions/         # Server Actions dùng chung (ghi lượt ôn…)
└── _components/      # Icon, linh vật (mascot.tsx), tab bar, sidebar, header…

lib/
├── supabase/         # Client server / admin, làm mới session
├── leitner.ts        # Hệ hộp ôn tập giãn cách, múi giờ VN
├── decks.ts, quiz.ts, games.ts        # Lấy dữ liệu cho phiên học / quiz / game
├── match-game.ts, dictation-game.ts   # Logic thuần của game (dùng được ở client)
├── game-audio.ts     # Âm thanh tổng hợp
├── stats.ts, streak.ts, xp.ts         # Thống kê, chuỗi ngày, XP/cấp độ
├── speech.ts, pronunciation.ts        # Web Speech API, chấm phát âm
├── push.ts, reminder.ts               # Web Push, giờ nhắc
└── word-import.ts    # Tách văn bản dán vào thành danh sách từ

scripts/              # render-icons.mjs (icon), generate-decks.mts + deck-specs.json (sinh bộ từ bằng AI), generated/ (JSON đã sinh), fetch-photos.py (ảnh Pixabay cho Nghe chọn hình)
supabase/             # Schema SQL, chạy theo thứ tự
proxy.ts              # Middleware: làm mới session, chặn chưa đăng nhập
public/               # Icon PWA, ảnh linh vật (mascot/), bìa trò chơi (games/), bìa bộ từ (decks/), service worker
```

## Chạy local

```bash
npm install
cp .env.local.example .env.local   # điền URL và publishable key của Supabase
npm run dev
```

### Supabase

Trong SQL Editor chạy lần lượt:

1. `supabase/schema.sql` — hồ sơ người dùng
2. `supabase/schema-02-flashcard.sql` — bộ thẻ, từ, tiến độ ôn, dữ liệu mẫu
3. `supabase/schema-03-tien-do.sql` — nhật ký học
4. `supabase/schema-04-ten-tu-google.sql` — lấy tên từ tài khoản Google
5. `supabase/schema-05-nhac-hoc.sql` — đăng ký thông báo đẩy
6. `supabase/schema-06-gio-nhac.sql` — giờ nhắc + lịch pg_cron (đọc chú thích đầu file: nạp 2 secret vào Vault trước)
7. `supabase/schema-07-nhom-bo-tu.sql` — nhóm bộ từ + hàm đếm tiến độ bằng SQL
8. `supabase/schema-08-xep-hang-mock.sql` — hàm bảng xếp hạng XP, bảng kết quả mock test
9. `supabase/schema-09-an-xep-hang-an-mung.sql` — ẩn khỏi bảng xếp hạng, lưu mốc đã ăn mừng
10. `supabase/schema-10-gop-y.sql` — bảng góp ý
11. `supabase/schema-11-admin.sql` — cờ admin, trang quản trị xem góp ý; gán admin bằng lệnh `update` ghi trong file (chạy tay, không commit email)
12. `supabase/schema-12-quan-tri.sql` — hàm số liệu cho khu quản trị (tổng quan, người dùng, nội dung)
13. `supabase/schema-13-admin-khong-hoc.sql` — admin không lên bảng xếp hạng, không tính là người học; đăng nhập là vào thẳng khu quản trị
14. `supabase/schema-14-ho-so.sql` — ảnh đại diện, tiểu sử, ảnh bìa (bucket `avatars`), xếp hạng kèm avatar
15. `supabase/schema-15-nhiem-vu.sql` — nhiệm vụ hằng ngày: `review_log.source`, bảng `task_completions`, xếp hạng cộng XP thưởng
16. `supabase/schema-16-dau-vao.sql` — cột `profiles.placement` lưu kết quả kiểm tra đầu vào
17. `supabase/schema-17-huy-hieu.sql` — cột `profiles.badges`, bảng xếp hạng trả thêm huy hiệu
18. `supabase/schema-18-ho-so-cong-khai.sql` — hàm `public_profile`, bảng xếp hạng trả `user_id` để mở trang cá nhân người khác
19. `supabase/schema-19-xp-cham-lai.sql` — XP chậm lại: nhớ +5 / quên +1, trần 300 XP/ngày (view `answer_xp_by_day`), cập nhật `leaderboard` và `public_profile`
20. `supabase/schema-20-hoi-ai.sql` — bảng `ai_chat_log` đếm số tin "Hỏi AI" mỗi ngày (cần `GEMINI_API_KEY` hoặc `ANTHROPIC_API_KEY` trên Vercel để bật tính năng)
8. `supabase/seed/*.sql` — nội dung các bộ từ (mỗi nhóm một file, chạy thứ tự nào cũng được)

**Authentication → URL Configuration → Redirect URLs**, thêm:

```
http://localhost:3000/auth/xac-nhan
http://localhost:3000/auth/callback
```

(Khi deploy, thêm 2 dòng tương tự với domain thật.)

**Đăng nhập Google** (tuỳ chọn): tạo OAuth client trên Google Cloud với redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, rồi dán Client ID + Secret vào **Authentication → Sign In / Providers → Google**.

### Nhắc học (tuỳ chọn)

Chạy `npx web-push generate-vapid-keys`, điền `VAPID_*`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` theo `.env.local.example` — trên Vercel cũng thêm y hệt. Lịch gửi do `pg_cron` trong Supabase đảm nhiệm (schema-06), gọi `/api/cron/nhac-hoc` mỗi giờ; route chỉ gửi cho người chọn đúng giờ đó và hôm đó chưa học. Push không chạy ở `npm run dev` (service worker bị tắt ở dev).

## Deploy

Push lên GitHub, import vào Vercel, thêm biến môi trường ở **Settings → Environment Variables**. Mỗi lần push `main` Vercel tự build lại.

## Scripts

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản đã build |
| `npm run lint` | ESLint |
| `node scripts/render-icons.mjs` | Sinh lại icon PWA/favicon từ `public/mascot/vit-tot-nghiep.png` (cần Python + Pillow) |
| `python scripts/fetch-photos.py` | Tải ảnh thật (Pixabay) cho từng từ trong `content/emoji-words.json` vào `public/photos/`, ghi `content/photo-words.json` (cần `PIXABAY_KEY`) |
| `node --env-file=.env.local scripts/generate-decks.mts` | Sinh nội dung các bộ từ còn thiếu bằng Claude theo `scripts/deck-specs.json`, xuất `supabase/seed/*.sql` (cần `ANTHROPIC_API_KEY`) |
| `node scripts/generate-decks.mts --sql-only` | Chỉ dựng lại SQL từ JSON đã có, không gọi API |
