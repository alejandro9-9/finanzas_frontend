import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppTopbar } from "../../app/components/app-topbar";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/administracion",
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("../../app/api/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  logout: mocks.logout,
}));

describe("AppTopbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({
      id: "admin-1",
      name: "Administrador",
      email: "admin@example.com",
      emailVerified: true,
      isActive: true,
      status: "active",
      role: "Administrator",
      createdAt: "2026-08-01T12:00:00Z",
      updatedAt: "2026-08-01T12:00:00Z",
    });
  });

  it("hides feedback navigation from administrators", async () => {
    render(<AppTopbar userName="Administrador" userRole="Administrator" />);

    expect(
      screen.getByRole("link", { name: "Administración" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ayúdanos a mejorar" }),
    ).not.toBeInTheDocument();
  });
});
