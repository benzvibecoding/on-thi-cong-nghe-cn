import { test, expect } from "@playwright/test";

test("dong bo hien trang thai chua cau hinh (khong chan app)", async ({ page }) => {
  await page.goto("/cai-dat");
  await expect(page.getByText(/chưa được cấu hình/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /xuất bản sao lưu/i })).toBeVisible();
});

test("api reports tra 503 than thien khi chua cau hinh", async ({ request }) => {
  const res = await request.post("/api/reports", { data: { questionId: "x" } });
  expect(res.status()).toBe(503);
  const body = await res.json();
  expect(body.code).toBe("E199");
});
