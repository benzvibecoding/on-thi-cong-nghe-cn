import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a11y: trang chu khong co loi nghiem trong", async ({ page }) => {
  await page.goto("/");
  const skip = page.getByRole("button", { name: /bỏ qua/i });
  if (await skip.isVisible()) await skip.click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical.map((v) => v.id))).toEqual([]);
});

test("a11y: luyen tap khong co loi nghiem trong", async ({ page }) => {
  await page.goto("/luyen-tap?topic=dien-dai-cuong");
  await page.getByRole("button", { name: /bắt đầu luyện/i }).click();
  await expect(page.getByText(/câu 1\//i)).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical.map((v) => v.id))).toEqual([]);
});
