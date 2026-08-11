// e2e/todo.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Todo App", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows empty state", async ({ page }) => {
    await expect(page.getByText("Chưa có việc nào")).toBeVisible();
  });

  test("adds and completes a todo", async ({ page }) => {
    await page.getByPlaceholder("Thêm việc...").fill("Mua sữa");
    await page.getByRole("button", { name: "Thêm" }).click();
    await expect(page.getByText("Mua sữa")).toBeVisible();

    await page.getByRole("checkbox").check();
    await expect(page.getByText("Mua sữa")).toHaveClass(/completed/);
  });

  test("persists after reload", async ({ page }) => {
    await page.getByPlaceholder("Thêm việc...").fill("Việc cố định");
    await page.getByRole("button", { name: "Thêm" }).click();
    await page.reload();
    await expect(page.getByText("Việc cố định")).toBeVisible();
  });
});
