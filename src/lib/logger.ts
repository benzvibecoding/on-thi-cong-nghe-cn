export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogFields {
  module: string;
  requestId?: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = ["token", "secret", "password", "apiKey", "authorization"];

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s))
        ? "[REDACTED]"
        : redact(v);
    }
    return out;
  }
  return value;
}

function redactFields(fields: LogFields): Record<string, unknown> {
  return redact(fields) as Record<string, unknown>;
}

function write(level: LogLevel, message: string, fields: LogFields): void {
  const record = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...redactFields(fields),
  };
  const line = JSON.stringify(record);
  if (level === "ERROR" || level === "WARN") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields: LogFields) => write("DEBUG", message, fields),
  info: (message: string, fields: LogFields) => write("INFO", message, fields),
  warn: (message: string, fields: LogFields) => write("WARN", message, fields),
  error: (message: string, fields: LogFields) => write("ERROR", message, fields),
};
