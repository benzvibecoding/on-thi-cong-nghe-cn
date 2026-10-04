import { test, expect } from "@playwright/test";

test("thong ke hien dem nguoc, du doan thieu du lieu, ke hoach", async ({ page }) => {
  await page.goto("/thong-ke");
  await expect(page.getByRole("heading", { name: /thống kê/i })).toBeVisible();
  await expect(page.getByText(/điểm dự kiến/i)).toBeVisible();
  await expect(page.getByText(/chưa đủ dữ liệu|ước lượng từ/i)).toBeVisible();
  await expect(page.getByText(/nên ôn gì tiếp/i)).toBeVisible();
  await expect(page.getByText(/kế hoạch ôn/i)).toBeVisible();
});
