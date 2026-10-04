import { describe, expect, it } from "vitest";
import {
  BACKUP_APP,
  BACKUP_VERSION,
  createBackup,
  verifyBackup,
  type BackupStores,
} from "@/domain/backup";

const stores: BackupStores = {
  bookmarks: [{ questionId: "q1", topicId: "t", createdAt: 1 }],
  notes: [],
  practiceEvents: [],
  reports: [],
  examSessions: [],
  srsStates: [],
};
const settings = {
  theme: "light",
  onboardingDone: true,
  studyGoal: 8,
  minutesPerDay: 30,
  srsLimit: 10,
};

describe("backup domain", () => {
  it("tao va xac minh duoc (roundtrip)", async () => {
    const payload = await createBackup(stores, settings);
    expect(payload.version).toBe(BACKUP_VERSION);
    expect(payload.checksum).toMatch(/^[0-9a-f]{64}$/);
    const result = await verifyBackup(JSON.parse(JSON.stringify(payload)));
    expect(result.ok).toBe(true);
  });

  it("phat hien file bi sua", async () => {
    const payload = await createBackup(stores, settings);
    payload.stores.bookmarks.push({ questionId: "evil" });
    const result = await verifyBackup(payload);
    expect(result).toEqual({ ok: false, error: expect.stringMatching(/sửa đổi|hỏng/) });
  });

  it("tu choi version la va app la", async () => {
    const payload = await createBackup(stores, settings);
    expect((await verifyBackup({ ...payload, version: 999 })).ok).toBe(false);
    expect((await verifyBackup({ ...payload, app: "other" })).ok).toBe(false);
    expect((await verifyBackup({ ...payload, stores: {} })).ok).toBe(false);
    expect((await verifyBackup("khong phai object")).ok).toBe(false);
    expect((await verifyBackup(null)).ok).toBe(false);
  });

  it("app name khop cau hinh", () => {
    expect(BACKUP_APP).toBe("on-thi-cong-nghe-cn");
  });
});
