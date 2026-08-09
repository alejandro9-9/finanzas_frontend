import { apiRequest, clearAccessToken, saveAccessToken } from "./client";
import type {
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResendEmailVerificationRequest,
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

export function logout() {
  clearAccessToken();
}

export function getCurrentUser() {
  return apiRequest<UserResponse>("/api/users/me");
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
