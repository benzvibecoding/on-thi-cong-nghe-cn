---
topicId: linh-kien-dien-tu
title: Linh kiện điện tử
status: draft
---

# Linh kiện điện tử

> Tóm tắt: điện trở hạn dòng, tụ điện tích/phóng điện, cuộn cảm chống biến thiên
> dòng; diode dẫn một chiều, transistor đóng vai trò khóa hoặc khuếch đại.

## 1. Linh kiện thụ động

| Linh kiện | Chức năng chính |
|---|---|
| Điện trở | Hạn chế dòng điện, chia áp. $U = I \cdot R$ |
| Tụ điện | Tích và phóng điện; chặn dòng một chiều, cho tín hiệu xoay chiều đi qua |
| Cuộn cảm | Chống lại sự biến thiên của dòng điện |

## 2. Linh kiện bán dẫn

- **Diode:** chỉ cho dòng điện đi qua theo một chiều (từ anode sang cathode
  khi phân cực thuận).
- **Transistor:** dùng làm khóa điện tử (đóng/ngắt) hoặc khuếch đại tín hiệu.
- **LED:** diode phát sáng khi có dòng thuận đi qua; phải mắc nối tiếp điện trở
  hạn dòng.

## 3. Mạch tích hợp IC

IC tích hợp nhiều linh kiện trên một chip bán dẫn nên mạch gọn nhẹ, tin cậy
hơn lắp linh kiện rời. Khi dùng IC và LED hiển thị, transistor thường làm khóa
đóng/ngắt dòng LED theo tín hiệu điều khiển.

## 4. Lỗi thường gặp

- Mắc LED không có điện trở hạn dòng: LED dễ hỏng do quá dòng.
- Mắc ngược diode trong mạch cần dẫn thuận: mạch không hoạt động.
- Nhầm tác dụng tụ điện: tụ không "tạo ra" điện năng, chỉ tích trữ rồi phóng ra.

## 5. Mở rộng: đọc ký hiệu diode

Ký hiệu diode là tam giác chỉ chiều dẫn thuận, gặp vạch đứng (cathode) thì
dừng: dòng đi từ anode sang cathode. LED là diode có thêm mũi tên phát sáng.
Ví dụ tính nhanh: dòng 2 A qua điện trở 3 Ω thì $U = I \cdot R = 6$ V.

[Luyện tập chủ đề này](/luyen-tap)
