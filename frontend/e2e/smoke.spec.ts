import { test, expect } from "@playwright/test";

test("login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("ParkingPro").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /đăng nhập|log in/i }).first()).toBeVisible();
});
