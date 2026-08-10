import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileScreen } from "../../app/components/profile-screen";
import type {
  FeedbackMessageResponse,
  UserResponse,
} from "../../app/api/contracts";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  resendEmailVerification: vi.fn(),
  updateCurrentUser: vi.fn(),
  getFeedbackMessages: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: mocks.push }),
}));

vi.mock("../../app/api/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  logout: mocks.logout,
  resendEmailVerification: mocks.resendEmailVerification,
  updateCurrentUser: mocks.updateCurrentUser,
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

const feedbackMessage: FeedbackMessageResponse = {
  id: "feedback-1",
  userId: "user-1",
  userName: "Beatriz Usuario",
  userEmail: "beatriz@example.com",
  message: "Necesito exportar mis inversiones.",
  createdAt: "2026-08-10T18:00:00Z",
};

describe("ProfileScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(administrator);
    mocks.getFeedbackMessages.mockResolvedValue([feedbackMessage]);
  });

  it("shows received messages in an administrator profile", async () => {
    render(<ProfileScreen />);

    expect(
      await screen.findByRole("heading", { name: "Mensajes de los usuarios" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Beatriz Usuario")).toBeInTheDocument();
    expect(screen.getByText("beatriz@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("Necesito exportar mis inversiones."),
    ).toBeInTheDocument();
  });
});
