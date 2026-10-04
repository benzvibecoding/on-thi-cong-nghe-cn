import { z } from "zod";

export const aiModeSchema = z.enum(["explain", "hint"]);

/** Client sends the question payload so the server stays stateless. Length-capped. */
export const aiRequestSchema = z.object({
  questionId: z.string().min(1).max(100),
  version: z.number().int().min(1),
  mode: aiModeSchema,
  stem: z.string().min(1).max(2000),
  explanation: z.string().min(1).max(2000),
});

export type AiRequest = z.infer<typeof aiRequestSchema>;
export type AiMode = z.infer<typeof aiModeSchema>;

export function aiCacheKey(input: Pick<AiRequest, "questionId" | "version" | "mode">): string {
  return `${input.questionId}:v${input.version}:${input.mode}`;
}

const MODE_TASK: Record<AiMode, string> = {
  explain: "Giải thích lại lời giải chuẩn bằng cách diễn đạt khác, đơn giản hơn cho học sinh lớp 12.",
  hint: "CHỈ đưa gợi ý từng bước để học sinh tự tìm ra đáp án, TUYỆT ĐỐI không tiết lộ đáp án.",
};

/**
 * Grounded prompt: the model must stick to the official explanation below and
 * refuse anything outside this subject. Vietnamese only.
 */
export function buildExplainPrompt(input: AiRequest): string {
  return [
    "Bạn là trợ lý học môn Công nghệ định hướng Công nghiệp (lớp 12, Việt Nam).",
    "Trả lời TIẾNG VIỆT, ngắn gọn (tối đa 150 từ).",
    "Chỉ dựa vào CÂU HỎI và LỜI GIẢI CHUẨN dưới đây. Không bịa thêm kiến thức.",
    "Nếu người dùng hỏi ngoài phạm vi môn học, từ chối lịch sự và quay lại bài.",
    `Nhiệm vụ: ${MODE_TASK[input.mode]}`,
    `CÂU HỎI: ${input.stem}`,
    `LỜI GIẢI CHUẨN: ${input.explanation}`,
  ].join("\n");
}

export const AI_LABEL = "Nội dung do AI tạo, có thể sai — hãy đối chiếu lời giải chuẩn.";

export const AI_UNAVAILABLE = "AI chưa sẵn sàng (chưa cấu hình hoặc hết lượt). Hãy đọc lời giải chuẩn phía trên.";
