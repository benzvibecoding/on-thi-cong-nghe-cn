import { test, expect } from "@playwright/test";

test("bai hoc hien noi dung + the ghi nho + lien ket luyen", async ({ page }) => {
  await page.goto("/hoc/dien-dai-cuong");
  await expect(page.getByRole("heading", { name: /kĩ thuật điện$/i }).first()).toBeVisible();
  await expect(page.getByText(/thẻ ghi nhớ/i)).toBeVisible();
  await page.getByRole("link", { name: /luyện .* câu/i }).click();
  await expect(page).toHaveURL(/luyen-tap\?topic=dien-dai-cuong/);
});

test("on tap hien so cau sai + srs; tim kiem khong dau", async ({ page }) => {
  await page.goto("/on-tap");
  await expect(page.getByRole("heading", { name: /ôn tập/i })).toBeVisible();
  await expect(page.getByText(/sổ câu sai/i)).toBeVisible();
  await page.goto("/tim-kiem");
  await page.getByLabel(/từ khóa/i).fill("dien tro");
  await expect(page.getByText(/bài học/i)).toBeVisible();
});
