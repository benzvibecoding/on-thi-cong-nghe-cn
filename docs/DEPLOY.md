# DEPLOY — Triển khai lên Vercel (gói Hobby)

Ràng buộc Hobby (đối chiếu 04/10/2026, kiểm tra lại `vercel.com/docs/limits`):
repo ở tài khoản **cá nhân** (không phải Organization), phi thương mại,
static-first, hạn chế function.

## 1. Chuẩn bị repo

```sh
git init && git add -A && git commit -m "M1-M11: on thi cong nghe CN"
gh repo create on-thi-cong-nghe-cn --private --source=. --push
```

Chọn package manager **pnpm** (đã chốt, `packageManager: pnpm@12.9.1`).
CI (`.github/workflows/ci.yml`) chạy: validate → build-packs → lint →
typecheck → test → build. Mỗi PR có Preview Deployment.

## 2. Import vào Vercel

1. Vercel Dashboard → Add New → Project → chọn repo cá nhân.
2. Framework: Next.js (tự nhận). Build command mặc định (`pnpm build` —
   đã gồm `build-packs`). Output: `.next`.
3. Region: chọn gần VN nhất (Singapore nếu gói cho phép) [CẦN KIỂM TRA].
4. Biến môi trường tối thiểu: `SITE_URL=https://<domain-cua-ban>` (server-only, không tiền tố public).
5. Deploy → mở URL → chạy smoke test mục 5.

## 3. Bật Supabase (tùy chọn, M9)

1. Tạo project (region Singapore), SQL editor → chạy
   `supabase/migrations/0001_init.sql`.
2. Authentication → bật Google provider (Client ID/Secret từ Google Cloud).
3. Vercel env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Kiểm RLS thủ công theo comment trong file migration (2 user A/B).
5. Lưu ý free tier: DB 500 MB, project pause sau ~1 tuần idle — app vẫn chạy
   local khi Supabase ngủ.

## 4. Bật AI Gemini (tùy chọn, M10)

1. Lấy key tại AI Studio, kiểm tra quota dự án mới trong AI Studio
   (không có số chính thức [CẦN KIỂM TRA]).
2. Vercel env: `GEMINI_API_KEY`, `GEMINI_MODEL` (vd. `gemini-2.5-flash` —
   kiểm tra tên model hiện hành, không hard-code).
3. Test: Luyện tập → làm 1 câu → Hỏi AI → phải trả lời kèm nhãn
   "do AI tạo, có thể sai". Hết quota → fallback lời giải tĩnh.

## 5. Smoke test sau deploy (5 phút)

- [ ] `/` tải được, countdown đúng, onboarding hiện lần đầu.
- [ ] `/hoc/dien-dai-cuong` hiện bài + thẻ; `/luyen-tap` làm 1 câu có phản hồi.
- [ ] `/thi-thu` báo đúng tình trạng ngân hàng (thiếu → trung thực).
- [ ] `/on-tap`, `/thong-ke`, `/cai-dat` (xuất backup), `/tim-kiem` chạy.
- [ ] Tắt mạng → tải lại `/` vẫn hiện (PWA).
- [ ] `/api/reports` và `/api/ai` khi chưa cấu hình trả 503 + mã E199.
- [ ] Headers: `curl -sI <url>/cai-dat | grep -i robots` → `noindex`.

## 6. Đo hiệu năng sau deploy (chưa đo được ở local)

- Chạy Lighthouse CI mobile cho `/`, `/hoc`, `/luyen-tap`: mục tiêu
  Perf ≥ 90, A11y ≥ 95, BP ≥ 95, SEO ≥ 90; LCP ≤ 2,5 s; CLS < 0,1; INP < 200 ms.
- Số đo local hiện có: JS production chưa nén 1977,5 KB/27 files
  (`.next/static`); axe e2e 0 lỗi critical (home + luyện tập).
- Lý do chưa có số Lighthouse: Chrome trong sandbox bị chặn tải trang
  (interstitial) — đo lại trên URL production.
