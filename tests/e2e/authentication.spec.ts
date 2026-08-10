import { expect, test } from "@playwright/test";

test("the user can navigate from login to registration", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Ingresa a tu cuenta" }),
  ).toBeVisible();

  const password = page.getByLabel(/Contrase/);
  await password.fill("Password123!");
  await page.getByRole("button", { name: /Mostrar/ }).click();
  await expect(password).toHaveAttribute("type", "text");

  await page.getByRole("link", { name: /Crear cuenta/ }).click();

  await expect(page).toHaveURL(/\/registro$/);
  await expect(
    page.getByRole("heading", { name: "Comienza en Flujo" }),
  ).toBeVisible();
});
