import { test, expect } from "@playwright/test";

test("cai dat + trang phap ly hien du", async ({ page }) => {
  await page.goto("/cai-dat");
  await expect(page.getByRole("button", { name: /xuất bản sao lưu/i })).toBeVisible();
  await expect(page.getByText(/nhập bản sao lưu/i)).toBeVisible();
  await page.goto("/chinh-sach-rieng-tu");
  await expect(page.getByRole("heading", { name: /riêng tư/i })).toBeVisible();
  await page.goto("/dieu-khoan");
  await expect(page.getByRole("heading", { name: /điều khoản/i })).toBeVisible();
  await page.goto("/ghi-cong");
  await expect(page.getByText(/ts-fsrs@5\.4\.2/)).toBeVisible();
});

test("offline sau lan tai dau van dung duoc", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("heading", { name: /ôn thi công nghệ/i }).first().waitFor();
  // Doi service worker san sang roi ngat mang, tai lai.
  await page.evaluate(() => {
    if (navigator.serviceWorker) return navigator.serviceWorker.ready.then(() => undefined);
  });
  await page.waitForTimeout(1000);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /ôn thi công nghệ/i }).first()).toBeVisible({ timeout: 15000 });
  await context.setOffline(false);
});
