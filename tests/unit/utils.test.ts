import { describe, expect, it } from "vitest";
import { removeVietnameseAccents, formatScore } from "@/lib/utils";

describe("utils", () => {
  it("bo dau tieng Viet de tim kiem khong dau", () => {
    expect(removeVietnameseAccents("điện tử số")).toBe("dien tu so");
    expect(removeVietnameseAccents("KĨ THUẬT ĐIỆN")).toBe("KI THUAT DIEN");
  });

  it("dinh dang diem 2 chu so thap phan", () => {
    expect(formatScore(7)).toBe("7.00");
    expect(formatScore(7.356)).toBe("7.36");
  });
});
