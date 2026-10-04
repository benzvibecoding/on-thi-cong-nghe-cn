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

## 3. Mạch dãy và phần tử nhớ

Mạch dãy có ngõ ra phụ thuộc cả trạng thái trước đó nên cần phần tử nhớ.
Flip-flop là phần tử nhớ 1 bit. Ví dụ mạch báo cháy: cảm biến khói AND với tín
hiệu cho phép hệ thống.

## 4. Lỗi thường gặp
- Nhầm AND với OR: AND ra 1 chỉ khi TẤT CẢ vào là 1; OR ra 1 khi CÓ ÍT NHẤT
  một vào là 1.
- Viết $A + B$ rồi cộng số học: trong logic, $1 + 1 = 1$ (OR), không phải 2.

## 5. Mở rộng: đọc ký hiệu và mở rộng số ngõ vào

- AND hình chữ D ($\text{cạnh thẳng vào, cạnh cong ra}$), OR cạnh trái cong lõm.
- Quy tắc giữ nguyên khi thêm ngõ vào: AND ba ngõ ra 1 chỉ khi cả ba đều 1.
- NOT hai lần liên tiếp cho ra đúng mức ban đầu: $\overline{\overline{A}} = A$.
- Mạch tổ hợp không nhớ quá khứ; loại có nhớ gọi là mạch dãy (học sau).

[Luyện tập chủ đề này](/luyen-tap)
