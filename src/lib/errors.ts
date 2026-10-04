/** Short user-facing error codes. Never expose stack traces to users. */
export const ERROR_CODES = {
  CONTENT_LOAD_FAILED: "E101",
  PACK_NOT_FOUND: "E102",
  INVALID_INPUT: "E103",
  STORAGE_FAILED: "E104",
  NETWORK_FAILED: "E105",
  UNKNOWN: "E199",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly debugDetail?: string;

  constructor(code: ErrorCode, userMessage: string, debugDetail?: string) {
    super(userMessage);
    this.name = "AppError";
    this.code = code;
    this.debugDetail = debugDetail;
  }
}

const VI_MESSAGES: Record<ErrorCode, string> = {
  E101: "Không tải được nội dung. Hãy kiểm tra mạng rồi thử lại.",
  E102: "Chưa có gói nội dung này. Nội dung sẽ bổ sung ở milestone tiếp theo.",
  E103: "Dữ liệu nhập chưa đúng. Hãy kiểm tra lại.",
  E104: "Không lưu được dữ liệu trên thiết bị này.",
  E105: "Mất kết nối mạng. Các tính năng đã tải vẫn dùng được offline.",
  E199: "Có lỗi xảy ra. Hãy thử lại sau.",
};

export function userMessage(code: ErrorCode): string {
  return VI_MESSAGES[code];
}
