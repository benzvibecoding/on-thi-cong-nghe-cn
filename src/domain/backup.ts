/**
 * Backup format (local-first disaster recovery):
 * { version, app, exportedAt, stores, settings, checksum }
 * checksum = SHA-256 hex of the canonical JSON of everything except checksum.
 */

export const BACKUP_VERSION = 1;
export const BACKUP_APP = "on-thi-cong-nghe-cn";

export interface BackupStores {
  bookmarks: unknown[];
  notes: unknown[];
  practiceEvents: unknown[];
  reports: unknown[];
  examSessions: unknown[];
  srsStates: unknown[];
}

export interface BackupSettings {
  theme: string;
  onboardingDone: boolean;
  studyGoal: number | null;
  minutesPerDay: number;
  srsLimit: number;
}

export interface BackupPayload {
  version: number;
  app: string;
  exportedAt: number;
  stores: BackupStores;
  settings: BackupSettings;
  checksum: string;
}

const STORE_KEYS = [
  "bookmarks",
  "notes",
  "practiceEvents",
  "reports",
  "examSessions",
  "srsStates",
] as const;

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonical(payload: Omit<BackupPayload, "checksum">): string {
  return JSON.stringify(payload);
}

export async function createBackup(
  stores: BackupStores,
  settings: BackupSettings
): Promise<BackupPayload> {
  const body = {
    version: BACKUP_VERSION,
    app: BACKUP_APP,
    exportedAt: Date.now(),
    stores,
    settings,
  };
  return { ...body, checksum: await sha256Hex(canonical(body)) };
}

export type VerifyResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: string };

/** Validate shape + version + integrity. Never throws. */
export async function verifyBackup(input: unknown): Promise<VerifyResult> {
  if (!input || typeof input !== "object") return { ok: false, error: "File không phải JSON sao lưu." };
  const p = input as Partial<BackupPayload>;
  if (p.version !== BACKUP_VERSION) {
    return { ok: false, error: `Phiên bản sao lưu không hỗ trợ (version ${String(p.version)}).` };
  }
  if (p.app !== BACKUP_APP) return { ok: false, error: "File không thuộc về ứng dụng này." };
  if (!p.stores || typeof p.stores !== "object") return { ok: false, error: "Thiếu dữ liệu stores." };
  for (const key of STORE_KEYS) {
    if (!Array.isArray(p.stores[key])) {
      return { ok: false, error: `Thiếu bảng dữ liệu '${key}'.` };
    }
  }
  if (typeof p.checksum !== "string") return { ok: false, error: "Thiếu mã kiểm tra toàn vẹn." };
  const { checksum, ...body } = p as BackupPayload;
  const actual = await sha256Hex(canonical(body));
  if (actual !== checksum) {
    return { ok: false, error: "File đã bị sửa đổi hoặc hỏng (sai checksum)." };
  }
  return { ok: true, payload: p as BackupPayload };
}
