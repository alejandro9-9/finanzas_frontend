import { expect, test } from "@playwright/test";

const admin = {
  id: "11111111-1111-1111-1111-111111111111",
  name: "Alejandro Admin",
  email: "admin@flujo.test",
  emailVerified: true,
  isActive: true,
  status: "active",
  role: "Administrator",
  createdAt: "2026-08-01T12:00:00Z",
  updatedAt: "2026-08-01T12:00:00Z",
};

const users = [
  admin,
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Lucía Torres",
    email: "lucia@flujo.test",
    emailVerified: true,
    isActive: true,
    status: "active",
    role: "User",
    createdAt: "2026-08-02T12:00:00Z",
    updatedAt: "2026-08-02T12:00:00Z",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Mario Pérez",
    email: "mario@flujo.test",
    emailVerified: false,
    isActive: false,
    status: "blocked",
    role: "User",
    createdAt: "2026-08-03T12:00:00Z",
    updatedAt: "2026-08-03T12:00:00Z",
  },
];

test("an administrator can review statistics and block a user", async ({ page }) => {
  await page.addInitScript(() => {
    window.sessionStorage.setItem("flujo-access-token", "admin-token");
  });

  await page.route("http://localhost:5260/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/users/me") {
      await route.fulfill({ json: admin });
      return;
    }

    if (path === "/api/admin/users/count") {
      await route.fulfill({ json: { total: 2 } });
      return;
    }

    if (path === "/api/admin/users" && request.method() === "GET") {
      await route.fulfill({ json: users });
      return;
    }

    if (
      path === "/api/admin/users/22222222-2222-2222-2222-222222222222" &&
      request.method() === "DELETE"
    ) {
      await route.fulfill({ status: 204 });
      return;
    }

    await route.abort();
  });

  await page.goto("/administracion");

  await expect(
    page.getByRole("heading", { name: "Administración de usuarios" }),
  ).toBeVisible();
  await expect(page.getByText("Total registrados").locator("..").getByText("3")).toBeVisible();
  await expect(page.getByText("Usuarios activos").locator("..").getByText("2")).toBeVisible();

  const userRow = page.getByRole("row").filter({ hasText: "Lucía Torres" });
  await userRow.getByRole("button", { name: "Bloquear" }).click();
  await page.getByRole("button", { name: "Sí, bloquear usuario" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Lucía Torres fue bloqueado correctamente.",
  );
  await expect(userRow.getByRole("button", { name: "Bloqueado" })).toBeDisabled();
});
