# CONTENT_GUIDE — Cách soạn bài học và câu hỏi

Dành cho giáo viên / người biên soạn (không cần biết lập trình).
File sửa bằng Notepad/VS Code, lưu dưới dạng UTF-8.

## 1. Quy tắc chung

- Chỉ viết điều bạn **chắc chắn đúng**. Không chắc về số liệu/ngưỡng kĩ thuật
  thì **bỏ**, không đoán.
- Không sao chép nguyên văn SGK, đề của NXB/trường/trung tâm/website luyện thi.
  Tự diễn đạt lại. Luôn điền `source`.
- Mọi câu seed mới đều để `status: draft` và sẽ hiện huy hiệu "Chưa kiểm duyệt".
  Chỉ câu `reviewed`/`published` mới được vào Thi thử.
- Chạy `pnpm content:validate` trước khi commit. Lỗi cấu trúc → fail build.

## 2. Bài học: `content/lessons/<chu-de>.md`

Frontmatter + Markdown. Công thức viết trong `$...$` (ví dụ `$U = I \cdot R$`).

```md
---
topicId: dien-gia-dinh
title: Hệ thống điện trong gia đình
status: draft
---

# Tiêu đề bài

> Tóm tắt một đoạn ngắn.

## 1. Mục nhỏ...

[Luyện tập chủ đề này](/luyen-tap)
```

## 3. Câu hỏi: `content/questions/<chu-de>.yaml`

Mỗi file là một danh sách YAML. Dùng nháy đơn `'...'` cho văn bản có dấu hai
chấm hoặc công thức LaTeX (gạch chéo `\` giữ nguyên trong nháy đơn).

### 3.1 Câu Phần I (mcq)

```yaml
- id: dgd-mcq-05
  type: mcq
  topicId: dien-gia-dinh
  subtopicId: mach-dien-gia-dinh   # tùy chọn, phải thuộc đúng topicId
  level: nb                        # nb | th | vd
  skill: recall                    # recall | interpret-diagram | compute | real-world | troubleshoot
  stem: 'Các đồ dùng điện trong nhà mắc song song hay nối tiếp?'
  mcq:
    options: ['Mắc nối tiếp', 'Mắc song song', '...', '...']  # đúng 4
    correct: B                     # đúng 1 đáp án: A-D
  explanation: 'Nêu vì sao đúng và vì sao 3 lựa chọn còn lại sai.'
  commonMistake: 'Lỗi HS hay mắc (tùy chọn).'
  source: { kind: original }       # original | official-exam | licensed | ai-assisted
  status: draft                    # draft | reviewed | published
  version: 1
  tags: [bai-1]
```

### 3.2 Câu Phần II (tf4)

```yaml
- id: dgd-tf4-02
  type: tf4
  topicId: dien-gia-dinh
  level: th
  stem: 'Xét tính đúng/sai của từng ý.'
  tf4:
    context: 'Bối cảnh chung của 4 ý (tùy chọn).'
    statements:                        # đúng 4 ý, đủ khóa a-d
      - key: a
        text: 'Nội dung ý a.'
        isTrue: true
        explanation: 'Vì sao ý này đúng/sai.'
      # ... b, c, d
  explanation: 'Kết luận chung.'
  source: { kind: original }
  status: draft
  version: 1
  tags: []
```

### 3.3 Hình vẽ

- Ưu tiên SVG tự vẽ đặt trong `content/assets/` (build sẽ copy sang
  `public/assets/`). Ghi `alt` mô tả đủ để hiểu khi không nhìn thấy hình
  (validator bắt `alt` ≥ 10 ký tự và file phải tồn tại).

```yaml
  media:
    - src: /assets/mach-noi-tiep.svg
      alt: 'Sơ đồ mạch một vòng gồm nguồn, công tắc và hai đèn nối tiếp'
```

## 3.4. Thẻ ghi nhớ: `content/flashcards/<chu-de>.yaml`

```yaml
- id: dgd-card-05
  topicId: dien-gia-dinh
  kind: term        # term | formula | symbol
  front: 'Mặt trước: câu hỏi/ngợi ý (Markdown + LaTeX).'
  back: 'Mặt sau: đáp án ngắn gọn, chỉ ghi điều chắc chắn.'
```

Thẻ được ôn bằng SRS (FSRS). Không nhồi số liệu bạn không chắc.

## 4. Kiểm tra và build

```sh
pnpm content:validate   # fail khi: trùng ID, sai schema, thiếu alt, sai topic...
pnpm build-packs        # sinh public/packs/<topic>.json + manifest (version + hash)
pnpm test               # unit test Zod toàn bộ seed + renderer
```

Thiếu câu theo chủ đề/mức độ chỉ **báo WARN**, không tự bịa câu cho đủ.
