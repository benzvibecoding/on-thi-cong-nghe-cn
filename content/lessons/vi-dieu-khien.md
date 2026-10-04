---
topicId: vi-dieu-khien
title: Vi điều khiển
status: draft
---

# Vi điều khiển

> Tóm tắt: vi điều khiển là một chip tích hợp CPU, bộ nhớ và các cổng vào/ra;
> nó chạy chương trình để đọc cảm biến và điều khiển thiết bị.

## 1. Cấu trúc chung

- **CPU:** thực hiện chương trình từng lệnh một.
- **Bộ nhớ:** chứa chương trình (flash) và dữ liệu tạm (RAM).
- **Vào/ra số và tương tự:** đọc nút nhấn, cảm biến; xuất tín hiệu bật/tắt,
  điều xung (PWM).

## 2. Nguyên lý ứng dụng

Cảm biến → vi điều khiển (so sánh, quyết định theo chương trình) → cơ cấu chấp
hành (đèn, động cơ, còi). Ví dụ: cảm biến nhiệt → bật/tắt quạt theo ngưỡng
nhiệt độ đặt trước.

## 3. Quy trình tạo ứng dụng đơn giản

Viết chương trình → nạp vào chip → kiểm thử với mạch thật → hiệu chỉnh.

## 4. Bo mạch lập trình vi điều khiển

Bo mạch gồm chip vi điều khiển, mạch nạp và các cổng kết nối vào/ra. Người học
viết chương trình trên máy tính rồi nạp vào bo mạch (ví dụ Arduino là họ bo mạch
phổ biến cho học tập). Dự án điển hình: đèn tự điều chỉnh độ sáng theo môi
trường (cảm biến ánh sáng + điều xung PWM).

## 5. Lỗi thường gặp

- Nhầm vi điều khiển với máy tính: vi điều khiển chuyên điều khiển nhúng, tài
  nguyên nhỏ, chạy một chương trình chuyên dụng.
- Quên chân nối đất chung (GND) giữa các module: mạch chạy sai hoặc không chạy.

## 6. Mở rộng: phân biệt hai bộ nhớ và xử lý sự cố

- Flash giữ chương trình khi mất nguồn; RAM mất dữ liệu tạm khi mất nguồn.
- Điều xung (PWM) để chỉnh độ sáng đèn, tốc độ động cơ mà không cần biến trở.
- Nạp xong mà mạch vẫn chạy kiểu cũ: kiểm tra việc nạp có thành công không rồi
  nhấn reset.

[Luyện tập chủ đề này](/luyen-tap)
