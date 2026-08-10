import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedbackScreen } from "../../app/components/feedback-screen";
import type { UserResponse } from "../../app/api/contracts";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  createFeedbackMessage: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock("../../app/api/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  logout: mocks.logout,
}));

vi.mock("../../app/api/feedback", () => ({
  createFeedbackMessage: mocks.createFeedbackMessage,
}));

vi.mock("../../app/components/app-topbar", () => ({
  AppTopbar: () => <div data-testid="app-topbar" />,
}));

const regularUser: UserResponse = {
  id: "user-1",
  name: "Beatriz Usuario",
  email: "beatriz@example.com",
  emailVerified: true,
  isActive: true,
  status: "active",
  role: "User",
  createdAt: "2026-08-01T12:00:00Z",
  updatedAt: "2026-08-01T12:00:00Z",
};

describe("FeedbackScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue(regularUser);
    mocks.createFeedbackMessage.mockResolvedValue({ id: "feedback-1" });
  });

  it("sends an identified message to the backend", async () => {
    const user = userEvent.setup();
    render(<FeedbackScreen />);

    const messageInput = await screen.findByLabelText("Mensaje");
    await user.type(messageInput, "Me gustaría exportar mis inversiones.");
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() => {
      expect(mocks.createFeedbackMessage).toHaveBeenCalledWith({
        message: "Me gustaría exportar mis inversiones.",
      });
    });
    expect(
      screen.getByText("Gracias. Tu mensaje fue enviado al equipo de Flujo."),
    ).toBeInTheDocument();
    expect(messageInput).toHaveValue("");
  });
});
