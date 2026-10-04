import { test, expect } from "@playwright/test";

test("studio render + bao loi khi thieu truong", async ({ page }) => {
  await page.goto("/studio");
  await expect(page.getByRole("heading", { name: /question studio/i })).toBeVisible();
  await expect(page.getByText(/điền đủ các trường/i)).toBeVisible();
  await page.getByLabel(/đề bài/i).fill("Cau hoi thu?");
  await expect(page.getByText(/điền đủ các trường/i)).toBeVisible();
});
