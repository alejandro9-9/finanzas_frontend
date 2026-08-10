import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminDashboard } from "../../app/components/admin-dashboard";
import type {
  AdminUserResponse,
  FeedbackMessageResponse,
  UserResponse,
} from "../../app/api/contracts";

const mocks = vi.hoisted(() => {
  const replace = vi.fn();

  return {
    replace,
    router: { replace },
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getAdminUsers: vi.fn(),
    getActiveUserCount: vi.fn(),
    blockAdminUser: vi.fn(),
    unblockAdminUser: vi.fn(),
    getFeedbackMessages: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.router,
}));

vi.mock("../../app/api/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  logout: mocks.logout,
}));

vi.mock("../../app/api/admin", () => ({
  getAdminUsers: mocks.getAdminUsers,
  getActiveUserCount: mocks.getActiveUserCount,
  blockAdminUser: mocks.blockAdminUser,
  unblockAdminUser: mocks.unblockAdminUser,
}));

vi.mock("../../app/api/feedback", () => ({
  getFeedbackMessages: mocks.getFeedbackMessages,
}));

vi.mock("../../app/components/app-topbar", () => ({
  AppTopbar: () => <div data-testid="app-topbar" />,
}));

const administrator: UserResponse = {
  id: "admin-1",
  name: "Manuel Administrador",
  email: "admin@example.com",
  emailVerified: true,
  isActive: true,
  status: "active",
  role: "Administrator",
  createdAt: "2026-08-01T12:00:00Z",
  updatedAt: "2026-08-01T12:00:00Z",
};

const regularUser: AdminUserResponse = {
  id: "user-1",
  name: "Beatriz Usuario",
  email: "beatriz@example.com",
  emailVerified: true,
  isActive: true,
  status: "active",
  role: "User",
  createdAt: "2026-08-02T12:00:00Z",
  updatedAt: "2026-08-02T12:00:00Z",
};

const pendingUser: AdminUserResponse = {
  id: "user-2",
  name: "Carlos Pendiente",
  email: "carlos@example.com",
  emailVerified: false,
  isActive: true,
  status: "pendingEmailConfirmation",
  role: "User",
  createdAt: "2026-08-03T12:00:00Z",
  updatedAt: "2026-08-03T12:00:00Z",
};

const feedbackMessage: FeedbackMessageResponse = {
  id: "feedback-1",
  userId: regularUser.id,
  userName: regularUser.name,
  userEmail: regularUser.email,
  message: "Necesito exportar mis inversiones.",
  createdAt: "2026-08-10T18:00:00Z",
};

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(administrator);
    mocks.getAdminUsers.mockResolvedValue([
      administrator,
      regularUser,
      pendingUser,
    ]);
    mocks.getActiveUserCount.mockResolvedValue({ total: 3 });
    mocks.blockAdminUser.mockResolvedValue(undefined);
    mocks.unblockAdminUser.mockResolvedValue(undefined);
    mocks.getFeedbackMessages.mockResolvedValue([feedbackMessage]);
  });

  it("shows user statistics and the complete directory", async () => {
    render(<AdminDashboard />);

    expect(
      await screen.findByRole("heading", { name: "Administración de usuarios" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Total registrados")).toBeInTheDocument();
    expect(screen.getByText("Usuarios activos")).toBeInTheDocument();
    expect(screen.getByText("Por verificar")).toBeInTheDocument();
    const directory = screen.getByRole("table", { name: "Directorio de usuarios" });
    expect(within(directory).getByText("Beatriz Usuario")).toBeInTheDocument();
    expect(within(directory).getByText("Carlos Pendiente")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Mensajes de los usuarios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Necesito exportar mis inversiones."),
    ).toBeInTheDocument();
  });

  it("blocks and then unblocks a user only after confirmation", async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />);

    const directory = await screen.findByRole("table", {
      name: "Directorio de usuarios",
    });
    const userName = within(directory).getByText("Beatriz Usuario");
    const row = userName.closest("tr");
    expect(row).not.toBeNull();
    await user.click(within(row!).getByRole("button", { name: "Bloquear" }));

    expect(
      screen.getByRole("alertdialog", { name: /Bloquear a Beatriz Usuario/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, bloquear usuario" }));

    await waitFor(() => {
      expect(mocks.blockAdminUser).toHaveBeenCalledWith("user-1");
    });
    expect(
      screen.getByText("Beatriz Usuario fue bloqueado correctamente."),
    ).toBeInTheDocument();
    const updatedRow = screen.getByRole("row", { name: /Beatriz Usuario.*Bloqueado/ });
    const unblockButton = within(updatedRow).getByRole("button", {
      name: "Desbloquear",
    });
    expect(unblockButton).toBeEnabled();

    await user.click(unblockButton);
    expect(
      screen.getByRole("alertdialog", { name: /Desbloquear a Beatriz Usuario/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, desbloquear usuario" }));

    await waitFor(() => {
      expect(mocks.unblockAdminUser).toHaveBeenCalledWith("user-1");
    });
    expect(
      screen.getByText("Beatriz Usuario fue desbloqueado correctamente."),
    ).toBeInTheDocument();
  });

  it("redirects a regular user away from administration", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      ...regularUser,
      role: "User",
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(mocks.replace).toHaveBeenCalledWith("/panel");
    });
    expect(mocks.getAdminUsers).not.toHaveBeenCalled();
  });
});
