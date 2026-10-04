---
topicId: dien-tu-so
title: Điện tử số
status: draft
---

# Điện tử số

> Tóm tắt: mạch số làm việc với hai mức logic 0 và 1; các cổng AND, OR, NOT là
> viên gạch cơ bản để xây mạch tổ hợp.

## 1. Bảng chân trị các cổng cơ bản

| A | B | AND ($Y = A \cdot B$) | OR ($Y = A + B$) |
|---|---|---|---|
| 0 | 0 | 0 | 0 |
| 0 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 |
| 1 | 1 | 1 | 1 |

Cổng NOT đảo mức logic: vào 0 ra 1, vào 1 ra 0 ($Y = \overline{A}$).

## 2. Mạch tổ hợp

Ngõ ra chỉ phụ thuộc tổ hợp ngõ vào ở hiện tại (không nhớ trạng thái trước).
Ví dụ: mạch báo động kêu khi (cửa mở AND hệ thống bật).

## 3. Lỗi thường gặp

- Nhầm AND với OR: AND ra 1 chỉ khi TẤT CẢ vào là 1; OR ra 1 khi CÓ ÍT NHẤT
  một vào là 1.
- Viết $A + B$ rồi cộng số học: trong logic, $1 + 1 = 1$ (OR), không phải 2.

[Luyện tập chủ đề này](/luyen-tap)
