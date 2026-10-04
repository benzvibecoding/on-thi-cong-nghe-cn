import { test, expect } from "@playwright/test";

test("luyen tap: loc -> lam 1 cau co phan hoi tuc thi", async ({ page }) => {
  await page.goto("/luyen-tap?topic=dien-dai-cuong");
  // Chi luyen trac nghiem de cau dau chac chan la MCQ (co radio).
  await page.getByRole("checkbox", { name: /phần ii/i }).uncheck();
  await page.getByRole("button", { name: /bắt đầu luyện/i }).click();
  await expect(page.getByText(/câu 1\//i)).toBeVisible();
  // Chon dap an dau tien, che do phan hoi tuc thi phai hien loi giai.
  await page.getByRole("radio").first().click();
  await expect(page.getByText(/lời giải/i)).toBeVisible();
  // Dieu huong cau sau bang phim mui ten.
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText(/câu 2\//i)).toBeVisible();
});
