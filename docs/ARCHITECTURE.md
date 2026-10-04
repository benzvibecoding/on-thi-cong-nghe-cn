# ARCHITECTURE (M1)

## Lớp

- `src/domain`: logic thuần, không React (`exam-config`). Test bằng Vitest, không cần browser.
- `src/lib`: `env` (Zod validate), `logger` (JSON có cấu trúc, che secret),
  `errors` (mã lỗi E1xx thân thiện), `utils` (cn, formatScore, bỏ dấu tiếng Việt).
- `src/store`: Zustand UI state (theme, onboarding), persist localStorage, chịu lỗi storage.
- `src/app`: App Router, `layout.tsx` (vi, font Be Vietnam Pro, nav mobile/desktop, theme
  không FOUC), các route shell chờ M3–M7.
- `src/components`: `AppNav`, `ThemeToggle`, `SwRegister`, `ComingSoon`.
- `scripts/`: `content-validate.mjs` (M1: quét trùng ID), `build-packs.mjs`
  (M1: manifest rỗng). M2 mở rộng thành pipeline schema + packs theo chủ đề.

## Quyết định M1

- Tailwind v4 với `@custom-variant dark` để dark-mode theo class.
- PWA thủ công (`public/sw.js` + manifest + đăng ký client) thay vì Serwist ở M1
  để giữ build đơn giản; Serwist đánh giá lại ở M7 nếu cần precache phức tạp.
- CSP chưa bật header `Content-Security-Policy` vì cần kiểm tra tương thích với
  Next đang dùng [CẦN KIỂM TRA ở M11]; đã có X-Content-Type-Options,
  Referrer-Policy, X-Frame-Options, Permissions-Policy.
- Icons PWA hiện chỉ có SVG; cần bổ sung PNG 192/512 để đủ điều kiện install [M7].

## M2 Content engine (đã xong)

- Nguồn sự thật: `src/domain/question-schema.ts` + `taxonomy.ts` (Zod).
  `scripts/content-validate.mjs` phản chiếu cùng luật bằng JS thuần (fail build
  khi trùng ID, sai schema, thiếu alt, sai topic...; thiếu phủ chỉ WARN).
- Tác giả soạn trong `content/` (xem `docs/CONTENT_GUIDE.md`), build ra
  `public/packs/<topic>.json` + `manifest.json` (version + sha256) qua
  `scripts/build-packs.mjs`; assets SVG tự vẽ copy sang `public/assets/`.
- Client tải lười qua `src/data/content-loader.ts` (timeout 8s, AbortController,
  cache bộ nhớ, validate Zod từng câu khi tải).
- Renderer `MathText` (react-markdown + remark-math + rehype-katex, KHÔNG dùng
  rehype-raw nên HTML thô không thực thi) và `QuestionView` (huy hiệu draft,
  alt hình, touch-target 44px).
- Seed: 45 câu (9 chủ đề x 5: 4 MCQ + 1 TF4, đủ nb/th/vd), tất cả `draft`,
  không đủ điều kiện vào thi thử.

## M3 Luyện tập (đã xong)

- Domain thuần `src/domain/practice.ts`: lọc, xáo trộn có seed (mulberry32),
  chấm MCQ/TF4 theo từng ý, tổng hợp sự kiện theo chủ đề (nền cho M6).
- Dexie `cncn` v1 (`src/data/db.ts`): bookmarks, notes, practiceEvents
  (append-only, UUID client), reports. `repositories.ts` bọc lỗi E104.
- UI `/luyen-tap`: form lọc (chủ đề/mức độ/dạng/số câu/draft) → phiên luyện
  1 câu/màn hình, phản hồi tức thì bật/tắt, phím tắt A–D/←→/F, đánh dấu,
  ghi chú tự lưu, báo lỗi (lưu local + sao chép), chấm bài + luyện lại câu sai.
- `pnpm build` giờ chạy `build-packs` trước để packs luôn tươi khi deploy.

## M4 Thi thử (đã xong)

- `EXAM_BLUEPRINT` trong `exam-config.ts` (Phần I 10/7/7 theo 4:3:3; Phần II
  mặc định 2/1/1 — ghi rõ không phải số liệu chính thức).
- `scoring.ts`: đúng thang chuẩn (MCQ 0,25; TF4 0/0,1/0,25/0,5/1,0), làm tròn
  2 chữ số; `generator.ts`: chỉ dùng câu reviewed/published, ưu tiên chưa
  làm/đã sai, lưu seed tái hiện, thiếu thì báo thiếu KHÔNG độn câu.
- Phiên thi: đồng hồ theo `endsAt` tuyệt đối, tự lưu mỗi thay đổi vào Dexie v2
  (`examSessions`), tải lại khôi phục cả đồng hồ; khóa multi-tab bằng heartbeat
  localStorage + cảnh báo; cảnh báo rời trang; xác nhận nộp kèm số câu chưa làm;
  tự nộp khi hết giờ.
- 2 chế độ: Giấy (cuộn + phiếu OMR chạm được) và Máy tính (1 câu/màn hình +
  bảng điều hướng trạng thái). Kết quả: điểm /10, từng phần, xem lại từng câu +
  thời gian làm, phân tích chủ đề/mức độ, luyện lại câu sai (nhúng
  PracticeSession).
- Ngân hàng hiện tại 0 câu eligible (seed toàn draft) nên trang setup báo thiếu
  trung thực + dẫn sang Luyện tập; luồng thi đủ đã phủ bằng fixtures trong
  tests (không đưa draft vào thi thử).

## M5 Học và ôn tập (đã xong)

- Packs nhúng thêm `lesson` (Markdown bài học) + `flashcards` (Zod validate lúc
  tải); validator kiểm tra thẻ (kind, topic) và độ dài bài học; 36 thẻ seed.
- `srs.ts` bọc ts-fsrs 5.4.2 (MIT) sau interface thuần: `scheduleReview`,
  `buildDueQueue` (thẻ đến hạn trước, thẻ mới giới hạn/ngày chỉnh được);
  trạng thái lưu Dexie v3 (`srsStates`).
- `/hoc/[topicId]`: bài học + thẻ ghi nhớ + nút sang luyện; `/on-tap`: sổ câu
  sai (từ practiceEvents, lần gần nhất sai) + luyện lại, hàng đợi SRS 4 mức
  Quên/Hơi khó/Nhớ được/Dễ quá; `/tim-kiem` tìm không dấu toàn app.

## M6 Thống kê và kế hoạch (đã xong)

- `mastery.ts`: nắm vững = chính xác có trọng số (VD×3, TH×2, NB×1) và giảm
  một nửa sau 30 ngày; `lowData` khi dưới 5 lượt; điểm dự kiến theo ô blueprint
  (MCQ 0/0,25; TF4 theo bảng chuẩn từ số ý đúng) kèm khoảng 95%, ẩn khi dưới
  10 lượt; streak + heatmap 12 tuần; đếm ngược từ `exam-config`.
- Thi thử và luyện tập đều ghi events (kèm `correctCount`, DB v4) nên thống kê
  bao phủ cả hai luồng.
- `planner.ts`: ưu tiên = (1 − nắm vững) × trọng số, chia phút theo tỉ lệ
  (làm tròn 5, tối thiểu 5), chỉnh tay bằng bỏ chọn chủ đề + đổi phút/ngày.
- Onboarding 3 bước (mục tiêu, ngày thi, phút/ngày), bỏ qua được, lưu local.

## M7 Sao lưu/PWA/pháp lý (đã xong)

- Backup JSON `{version, app, exportedAt, stores, settings, checksum}` với
  SHA-256 toàn vẹn; sai checksum/version/app đều bị từ chối kèm lý do.
  `/cai-dat`: xuất file, nhập + xác nhận thay thế, trạng thái persist/storage,
  xóa toàn bộ (xác nhận 2 chạm).
- PWA: precache core + packs manifest, cache-first same-origin, navigation
  network-first với fallback trang đã cache; PNG 192/512 + maskable tự sinh
  bằng Node thuần (`scripts/generate-icons.mjs`, đã kiểm tra signature PNG).
- Trang Riêng tư / Điều khoản / Ghi công (bảng lib đọc từ gói đã cài, không bịa
  license) + `docs/PRIVACY.md`; footer có đủ liên kết + tuyên bố độc lập.

## M8 Question Studio (đã xong, tùy chọn)

- `/studio` (noindex): form soạn MCQ/TF4 → xem trước bằng `QuestionView` đúng
  như học sinh thấy → validate Zod hiện lỗi từng trường → xuất file YAML đúng
  định dạng repo để commit, nhập YAML để sửa tiếp. Trạng thái khác draft ghi rõ
  "cần người duyệt".

## M9 Supabase — đồng bộ + báo lỗi (đã xong, tùy chọn, tắt êm)

- `supabase/migrations/0001_init.sql`: profiles, practice_events (upsert theo
  id client), review_states, reports; RLS bật mọi bảng, policy owner-only;
  kèm bước kiểm tra RLS thủ công trong comment.
- `@supabase/supabase-js` 2.117.2 (MIT). Chưa cấu hình env → client null, UI
  báo "chưa cấu hình", API 503 thân thiện; app chính không ảnh hưởng.
- `POST /api/reports`: Zod validate, rate limit 10/IP/giờ (bộ nhớ, ghi rõ giới
  hạn multi-instance), JWT của user + RLS, log cấu trúc không PII.
- `/cai-dat` thêm mục Đồng bộ: Google login, đồng bộ ngay, đăng xuất.

## M10 Trợ lý AI (đã xong, tùy chọn, tắt êm)

- `POST /api/ai`: Zod validate input (giới hạn độ dài), rate limit 20/IP/ngày,
  model đọc từ `GEMINI_MODEL` (không hard-code), gọi Gemini REST từ server
  (key không tới client), timeout 15s, cache theo (questionId, version, mode),
  hết quota/lỗi → fallback lời giải tĩnh phía client.
- Prompt "bám nền": chỉ dùng câu hỏi + lời giải chuẩn, trả lời tiếng Việt ≤150
  từ, từ chối ngoài phạm vi môn học; mode `hint` cấm lộ đáp án. Mọi nội dung AI
  gắn nhãn "do AI tạo, có thể sai". Câu hỏi do AI sinh (nếu có) luôn
  `ai-assisted` + `draft`, không vào thi thử khi chưa duyệt (enforced bởi
  validator + generator).

## M11 Hardening và ra mắt (đã xong, trừ deploy cần tài khoản của bạn)

- `X-Robots-Tag: noindex` cho trang cá nhân (on-tap, thong-ke, cai-dat,
  tim-kiem, studio, lam-bai); sitemap + robots + OG metadata.
- axe e2e (WCAG 2A/2AA): 0 lỗi critical ở trang chủ và luồng luyện tập.
- Bảo mật: không secret trong repo, `.env.example` không giá trị thật;
  `dangerouslySetInnerHTML` duy nhất cho theme-init string tĩnh; console chỉ
  trong logger; key Gemini chỉ ở server, Supabase chỉ anon key ở client.
- CSP header chưa bật vì inline theme script cần nonce — ghi nhận [CẦN KIỂM
  TRA ở bản Next này]; các header còn lại đã có.
- Khôi phục backup giờ áp luôn settings (theme/goal/minutes/srs-limit).
- `docs/DEPLOY.md`: từng bước Vercel + Supabase + Gemini + smoke test.
- Lighthouse chưa đo được ở local (Chrome sandbox chặn tải trang) — đo lại
  trên production theo DEPLOY mục 6; số đo thật hiện có: JS 1977,5 KB chưa nén.
