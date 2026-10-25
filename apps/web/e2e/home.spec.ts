import { expect, test } from "@playwright/test"

test("home route shows the starter heading and main landmark", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Smart Base", level: 1 })).toBeVisible()
  await expect(page.getByRole("main")).toBeVisible()
})
