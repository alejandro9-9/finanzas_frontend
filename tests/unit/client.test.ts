import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiRequest,
  getAccessToken,
  saveAccessToken,
} from "../../app/api/client";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("API client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    window.sessionStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("sends public requests without attempting a refresh", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "ok" }));

    const result = await apiRequest<{ status: string }>(
      "/api/public",
      { method: "GET" },
      false,
    );

    expect(result).toEqual({ status: "ok" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/public");
  });

  it("refreshes the session before an authenticated request without access token", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ token: "renewed-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }));

    const result = await apiRequest<{ id: string }>("/api/users/me");

    expect(result).toEqual({ id: "user-1" });
    expect(getAccessToken()).toBe("renewed-token");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/auth/refresh");

    const requestHeaders = new Headers(fetchMock.mock.calls[1][1]?.headers);
    expect(requestHeaders.get("Authorization")).toBe("Bearer renewed-token");
  });

  it("renews and retries once when the backend returns 401", async () => {
    saveAccessToken("expired-token");
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "Expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ token: "new-token" }))
      .mockResolvedValueOnce(jsonResponse({ id: "user-1" }));

    const result = await apiRequest<{ id: string }>("/api/users/me");

    expect(result).toEqual({ id: "user-1" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAccessToken()).toBe("new-token");
    const retryHeaders = new Headers(fetchMock.mock.calls[2][1]?.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer new-token");
  });

  it("throws an ApiError using the backend problem response", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { code: "Validation.Error", detail: "Datos inválidos" },
        422,
      ),
    );

    await expect(
      apiRequest("/api/public", { method: "POST" }, false),
    ).rejects.toEqual(
      expect.objectContaining({
        name: "ApiError",
        status: 422,
        message: "Datos inválidos",
      }),
    );
  });

  it("exposes backend failures as ApiError instances", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "No encontrado" }, 404));

    try {
      await apiRequest("/api/public", {}, false);
      expect.fail("The request should have failed");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });
});
