import { expect, test } from "@playwright/test";

test("loads the dashboard and navigates to writing", async ({ page }) => {
  await page.goto("/");
  const signInHeading = page.getByRole("heading", { name: "로그인" });

  await expect(page.getByRole("heading", { name: "With the door closed" })).toBeVisible({ timeout: 15_000 });

  if (await signInHeading.isVisible()) {
    await expect(page.getByLabel("이메일")).toBeVisible();
    await expect(page.getByLabel("비밀번호", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "첫 로그인 또는 비밀번호 재설정" })).toBeVisible();
    return;
  }

  await page.getByRole("link", { name: /작문/ }).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(page.getByRole("heading").first()).toBeVisible();
});
