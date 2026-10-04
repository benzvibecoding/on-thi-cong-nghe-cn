# PRIVACY — Riêng tư và dữ liệu (bản MVP local-first)

## Nguyên tắc

1. Local-first: toàn bộ tính năng cốt lõi chạy không cần tài khoản, dữ liệu ở
   trên thiết bị (IndexedDB + localStorage).
2. Tối thiểu hóa: không tên thật, không SĐT, không định vị. Cloud/AI (nếu bật
   trong tương lai) mặc định TẮT và chỉ gửi dữ liệu tối thiểu.
3. Không quảng cáo, không cookie theo dõi, không analytics bên thứ ba ở bản
   hiện tại.

## Quyền người dùng

- Xuất dữ liệu (JSON có version + checksum) và nhập lại tại `/cai-dat`.
- Xóa toàn bộ dữ liệu cục bộ tại `/cai-dat` (có xác nhận 2 chạm).
- Trình duyệt có thể xóa dữ liệu khi thiếu chỗ hoặc lâu không dùng (hành vi
  Safari/WebKit [CẦN KIỂM TRA định kỳ]); app xin `navigator.storage.persist`
  và nhắc sao lưu định kỳ.

## Khi bật cloud/AI (M9/M10, chưa làm)

- Supabase: RLS mọi bảng, user chỉ đọc/ghi hàng của mình; không service-role ở client.
- Gemini: gọi từ route handler (key ở server), không gửi dữ liệu cá nhân, nội
  dung AI gắn nhãn "do AI tạo, có thể sai".
- Rate limit cho `/api/ai` và `/api/reports`; hết quota thì tính năng tắt êm,
  app chính vẫn chạy.

## Tuân thủ

Quy định bảo vệ dữ liệu cá nhân hiện hành của Việt Nam [CẦN KIỂM TRA văn bản
còn hiệu lực khi phát hành; không tự khẳng định điều luật trong app].
