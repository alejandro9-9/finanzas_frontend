import { apiRequest, clearAccessToken, saveAccessToken } from "./client";
import type {
  ConfirmPasswordResetRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  RequestPasswordResetRequest,
  ResendEmailVerificationRequest,
  UpdateUserRequest,
  UserResponse,
  VerifyEmailRequest,
} from "./contracts";

export function register(request: RegisterRequest) {
  return apiRequest<RegisterResponse>("/api/users", { method: "POST", body: JSON.stringify(request) }, false);
}

export async function login(request: LoginRequest) {
  const response = await apiRequest<LoginResponse>("/api/auth", { method: "POST", body: JSON.stringify(request) }, false);
  saveAccessToken(response.token);
  return response;
}

export async function logout() {
  try {
    await apiRequest<void>("/api/auth/logout", { method: "POST" }, false);
  } catch {
    // La sesión local debe cerrarse incluso si el backend no está disponible.
  } finally {
    clearAccessToken();
  }
}

export function getCurrentUser() {
  return apiRequest<UserResponse>("/api/users/me");
}

export function updateCurrentUser(request: UpdateUserRequest) {
  return apiRequest<string>("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

export function resendEmailVerification(
  request: ResendEmailVerificationRequest,
) {
  return apiRequest<MessageResponse>(
    "/api/auth/email-verification/resend",
    { method: "POST", body: JSON.stringify(request) },
    false,
  );
}

export function verifyEmail(request: VerifyEmailRequest) {
  return apiRequest<MessageResponse>(
    "/api/auth/email-verification/verify",
    { method: "POST", body: JSON.stringify(request) },
    false,
  );
}

export function requestPasswordReset(request: RequestPasswordResetRequest) {
  return apiRequest<MessageResponse>(
    "/api/auth/password-reset/request",
    { method: "POST", body: JSON.stringify(request) },
    false,
  );
}

export function confirmPasswordReset(request: ConfirmPasswordResetRequest) {
  return apiRequest<MessageResponse>(
    "/api/auth/password-reset/confirm",
    { method: "POST", body: JSON.stringify(request) },
    false,
  );
}
