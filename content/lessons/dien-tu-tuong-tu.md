---
topicId: dien-tu-tuong-tu
title: Điện tử tương tự
status: draft
---

# Điện tử tương tự

> Tóm tắt: mạch tương tự xử lý tín hiệu liên tục; hai ứng dụng điển hình là
> khuếch đại tín hiệu nhỏ và tạo nguồn một chiều ổn định.

## 1. Mạch khuếch đại

Khuếch đại tín hiệu nhỏ thành tín hiệu lớn hơn nhưng giữ nguyên dạng sóng.
Ví dụ: tín hiệu từ micro (rất nhỏ) được khuếch đại rồi đưa ra loa.

## 2. Khuếch đại thuật toán (op-amp)

Op-amp khuếch đại tín hiệu tương tự với độ chính xác cao. Mạch khuếch đại đảo
cho tín hiệu ra ngược pha và lớn gấp $|A| = R_f/R_1$ lần (ví dụ $R_f = 10$ kΩ,
$R_1 = 2$ kΩ, vào $0{,}5$ V thì ra $-2{,}5$ V). Mạch so sánh cho biết ngõ vào
nào lớn hơn.

## 3. Nguồn một chiều

Lấy từ điện lưới xoay chiều qua các bước: hạ áp → chỉnh lưu (diode biến xoay
chiều thành một chiều nhấp nhô) → lọc (tụ điện làm phẳng) → ổn áp (giữ điện áp
ra ổn định).

## 4. Lỗi thường gặp

- Bỏ tụ lọc sau chỉnh lưu: điện áp ra nhấp nhô lớn, thiết bị chạy không ổn định.
- Nhầm khuếch đại với "tạo thêm năng lượng": mạch lấy năng lượng từ nguồn nuôi
  để làm tín hiệu lớn hơn, tuân thủ bảo toàn năng lượng.

## 5. Mở rộng: nhớ trình tự bằng câu thần chú

"Hạ – Chỉnh – Lọc – Ổn": hạ áp (máy biến áp) → chỉnh lưu (diode) → lọc (tụ) →
ổn áp (giữ áp ra). Thiếu ổn áp thì áp ra vẫn trồi sụt theo tải và lưới điện.

[Luyện tập chủ đề này](/luyen-tap)
