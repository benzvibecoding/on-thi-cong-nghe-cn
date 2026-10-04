import { test, expect } from "@playwright/test";

test("api ai tra 503 + fallback khi chua cau hinh", async ({ request }) => {
  const res = await request.post("/api/ai", {
    data: { questionId: "q1", version: 1, mode: "explain", stem: "s", explanation: "e" },
  });
  expect(res.status()).toBe(503);
});

test("api ai tu choi input sai", async ({ request }) => {
  const res = await request.post("/api/ai", { data: { questionId: "", mode: "nope" } });
  expect([400, 503]).toContain(res.status());
});

test("luyen tap hien nut AI va fallback than thien", async ({ page }) => {
  await page.goto("/luyen-tap?topic=dien-dai-cuong");
  await page.getByRole("checkbox", { name: /phần ii/i }).uncheck();
  await page.getByRole("button", { name: /bắt đầu luyện/i }).click();
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: /hỏi ai giải thích thêm/i }).click();
  await expect(page.getByText(/ai chưa sẵn sàng/i)).toBeVisible();
});
