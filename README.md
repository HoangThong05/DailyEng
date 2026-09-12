# 📘 DailyEng

Ứng dụng học tiếng Anh mỗi ngày: flashcard từ vựng, quiz trắc nghiệm, luyện phát âm và theo dõi tiến độ. Chạy như PWA, cài được lên điện thoại.

🌐 **Live demo:** https://daily-eng-omega.vercel.app

## Tính năng

- Đăng nhập bằng email/mật khẩu (xác nhận bằng mã 6 số) hoặc Google
- Flashcard theo bộ thẻ có sẵn hoặc tự tạo (dán hàng loạt từ Excel/Sheets/Quizlet), ôn tập giãn cách
- Quiz trắc nghiệm 4 đáp án, chấm điểm, xem lại từ sai
- Trò chơi: Ghép cặp (nối từ với nghĩa, tính giờ), Nghe & gõ (nghe máy đọc, gõ chính tả), Mưa từ vựng (nghĩa rơi xuống, gõ từ để bắn)
- XP và cấp độ tính từ mọi hoạt động học
- Luyện phát âm: nghe mẫu, ghi âm nghe lại, chấm điểm qua Web Speech API
- Chuỗi ngày học, biểu đồ tuần, độ chính xác theo bộ, từ hay sai nhất
- Đổi tên hiển thị, mục tiêu từ/ngày, giao diện sáng/tối
- Nhắc học qua thông báo đẩy (Web Push) vào giờ tự chọn, chỉ khi hôm đó chưa học
- PWA: offline, cài lên màn hình chính

## Công nghệ

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 — responsive: tab bar trên điện thoại, sidebar trên màn hình lớn
- Supabase: Postgres, Row Level Security, Auth
- Web Speech API
- Deploy trên Vercel

## Cấu trúc thư mục

```
app/
├── (app)/            # Các trang cần đăng nhập
│   ├── hoc/          #   Flashcard
│   ├── quiz/         #   Quiz trắc nghiệm
│   ├── tro-choi/     #   Hub trò chơi: Ghép cặp, Nghe & gõ, Mưa từ vựng
│   ├── phat-am/      #   Luyện phát âm
│   ├── tien-do/      #   Chuỗi ngày + thống kê
│   └── tai-khoan/    #   Hồ sơ, cài đặt
├── (public)/         # Đăng nhập, nhập mã xác nhận, trang offline
├── auth/             # Callback Google và link xác nhận email
├── api/cron/         # pg_cron của Supabase gọi mỗi giờ để gửi nhắc học
├── _actions/         # Server Actions dùng chung
└── _components/      # Component dùng chung

lib/                  # Supabase client, thuật toán ôn tập, quiz, phát âm, thống kê
supabase/             # Schema SQL
proxy.ts              # Làm mới session, chặn chưa đăng nhập
public/               # Icon PWA, service worker
```

## Chạy local

```bash
npm install
cp .env.local.example .env.local   # điền URL và publishable key của Supabase
npm run dev
```

Trước đó, trong Supabase SQL Editor chạy lần lượt:

1. `supabase/schema.sql`
2. `supabase/schema-02-flashcard.sql`
3. `supabase/schema-03-tien-do.sql`
4. `supabase/schema-04-ten-tu-google.sql`
5. `supabase/schema-05-nhac-hoc.sql`
6. `supabase/schema-06-gio-nhac.sql` (đọc chú thích đầu file: cần nạp 2 secret vào Vault trước)

Và thêm vào **Authentication → URL Configuration → Redirect URLs**:

```
http://localhost:3000/auth/xac-nhan
http://localhost:3000/auth/callback
```

Đăng nhập Google: tạo OAuth client trên Google Cloud với redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`, rồi dán Client ID + Secret vào **Authentication → Sign In / Providers → Google**.

Nhắc học (tuỳ chọn): chạy `npx web-push generate-vapid-keys`, điền các biến `VAPID_*`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` theo `.env.local.example` — trên Vercel cũng thêm y hệt. Lịch gửi do `pg_cron` trong Supabase đảm nhiệm (schema-06).
