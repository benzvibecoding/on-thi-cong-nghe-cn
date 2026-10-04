import { test, expect } from "@playwright/test";

test("trang chu tai duoc va dieu huong duoc", async ({ page }) => {
  await page.goto("/");
  // Onboarding hien lan dau: bo qua de tiep tuc.
  const skip = page.getByRole("button", { name: /bỏ qua/i });
  if (await skip.isVisible()) await skip.click();
  await expect(page.getByRole("heading", { name: /ôn thi công nghệ/i })).toBeVisible();
  await page.getByRole("link", { name: /thông tin kỳ thi/i }).first().click();
  await expect(page).toHaveURL(/thong-tin-ky-thi/);
  await expect(page.getByRole("heading", { name: /thông tin kỳ thi/i })).toBeVisible();
});

test("trang thi thu kiem tra ngan hang that va bao thieu trung thuc", async ({ page }) => {
  await page.goto("/thi-thu");
  await expect(page.getByRole("heading", { name: /thi thử/i })).toBeVisible();
  // Seed hien tai toan draft nen phai thay thong bao trung thuc, khong phai nut bat dau.
  await expect(page.getByText(/chưa có câu hỏi đã kiểm duyệt|chưa đủ câu/i).first()).toBeVisible();
});
