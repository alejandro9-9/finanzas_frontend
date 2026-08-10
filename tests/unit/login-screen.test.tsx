import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../app/api/client";
import { LoginScreen } from "../../app/components/login-screen";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  login: vi.fn(),
  resendEmailVerification: vi.fn(),
  verifyEmail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("../../app/api/auth", () => ({
  login: mocks.login,
  resendEmailVerification: mocks.resendEmailVerification,
  verifyEmail: mocks.verifyEmail,
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form and account recovery links", () => {
    render(<LoginScreen />);

    expect(
      screen.getByRole("heading", { name: "Ingresa a tu cuenta" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo/)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(/Contrase/)).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: /Crear cuenta/ })).toHaveAttribute(
      "href",
      "/registro",
    );
    expect(screen.getByRole("link", { name: /Olvidaste/ })).toHaveAttribute(
      "href",
      "/recuperar-contrasena",
    );
  });

  it("allows the user to show and hide the password", async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);
    const password = screen.getByLabelText(/Contrase/);

    await user.click(screen.getByRole("button", { name: /Mostrar/ }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /Ocultar/ }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("navigates to the panel after a successful login", async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValueOnce({ token: "access-token" });
    render(<LoginScreen />);

    await user.type(screen.getByLabelText(/Correo/), "user@example.com");
    await user.type(screen.getByLabelText(/Contrase/), "Password123!");
    await user.click(screen.getByRole("button", { name: /Ingresar a Flujo/ }));

    await waitFor(() => {
      expect(mocks.login).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password123!",
      });
      expect(mocks.push).toHaveBeenCalledWith("/panel");
    });
  });

  it("opens inline verification when the email is pending", async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValueOnce(
      new ApiError(401, {
        code: "UserErrors.EmailNotVerified",
        detail: "El correo no está verificado.",
      }),
    );
    render(<LoginScreen />);

    await user.type(screen.getByLabelText(/Correo/), "pending@example.com");
    await user.type(screen.getByLabelText(/Contrase/), "Password123!");
    await user.click(screen.getByRole("button", { name: /Ingresar a Flujo/ }));

    expect(
      await screen.findByRole("heading", { name: "Verifica tu correo" }),
    ).toBeInTheDocument();
    expect(screen.getByText("pending@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/digo de verificaci/)).toHaveAttribute(
      "maxlength",
      "6",
    );
  });
});
