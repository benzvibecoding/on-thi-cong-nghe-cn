# Ôn thi Công nghệ CN

Web app ôn tập và luyện đề môn Công nghệ định hướng Công nghiệp (kỳ thi tốt nghiệp THPT).
Local-first: học, luyện, thi thử, thống kê chạy không cần đăng nhập, offline sau lần tải đầu.

> Ứng dụng ôn tập độc lập, KHÔNG phải sản phẩm của Bộ GD&ĐT.

## Chạy nhanh (M1)

```sh
pnpm install
pnpm content:validate
pnpm build-packs
pnpm dev
```

Mở http://localhost:3000.

## Lệnh

| Lệnh | Ý nghĩa |
|---|---|
| `pnpm dev` | Chạy dev |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit test (Vitest) |
| `pnpm e2e` | E2E (Playwright, cần `pnpm dev` hoặc tự khởi động) |
| `pnpm content:validate` | Kiểm tra nội dung (M1: chỉ quét trùng ID) |
| `pnpm build-packs` | Sinh manifest packs (M1: shell rỗng, M2 sinh theo chủ đề) |
| `pnpm build` | Build production |

## Cấu hình đề thi

Sửa duy nhất `src/domain/exam-config.ts` khi cấu trúc 2027 đổi: số câu, thang điểm
Phần II (0,1/0,25/0,5/1,0), tỉ lệ 4:3:3, ngày thi, trọng số blueprint.

## Trạng thái milestone

- [x] M1 Nền tảng (scaffold, tokens, layout, theme, PWA shell, CI)
- [x] M2 Content engine (schema, taxonomy, validator, packs, renderer, 45 câu seed draft)
- [x] M3 Luyện tập (lọc, phản hồi tức thì, phím tắt, đánh dấu/ghi chú, Dexie v1, báo lỗi)
- [x] M4 Thi thử (blueprint/generator, 2 chế độ, đồng hồ tuyệt đối, tự lưu/khôi phục, chấm chuẩn)
- [x] M5 Học và ôn tập (bài học, flashcards, SRS FSRS, sổ câu sai, tìm kiếm không dấu)
- [x] M6 Thống kê và kế hoạch (mastery, điểm dự kiến khoảng, streak/heatmap, đếm ngược, planner, onboarding)
- [x] M7 Sao lưu/PWA/pháp lý (backup JSON version+checksum, PWA offline, PNG icons, riêng tư/điều khoản/ghi công)
- [x] M8 Question Studio (soạn client-side, xem trước, validate, nhập/xuất YAML)
- [x] M9 Supabase (đồng bộ + báo lỗi + RLS + rate limit, tắt êm khi chưa cấu hình)
- [x] M10 Trợ lý AI (Gemini sau route handler, prompt bám nền, cache, fallback, gắn nhãn)
- [x] M11 Hardening và ra mắt (a11y, SEO, bảo mật, docs; deploy theo docs/DEPLOY.md)
- [ ] M11 Hardening và ra mắt
