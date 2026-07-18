import { expect, test } from "@playwright/test";

test("loads the dashboard and navigates to writing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "With the door closed" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("link", { name: /작문/ }).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(page.getByRole("heading").first()).toBeVisible();
});
