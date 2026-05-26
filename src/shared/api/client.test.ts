/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import {
  ApiClient,
  ApiError,
  forgotPassword,
  resetPassword,
  register,
  updateUserProfile,
  deleteUser,
  uploadUserAvatar,
  deleteUserAvatar,
  getUserAvatarUrl,
} from "./client";

describe("ApiClient", () => {
  let client: ApiClient;
  let mockFetch: Mock;

  beforeEach(() => {
    client = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  const mockResponse = (
    data: any,
    ok = true,
    status = 200,
    headers: any = {},
  ) => {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: async () => data,
      headers: {
        get: (name: string) => headers[name] || null,
      },
    });
  };

  it("performs a GET request successfully", async () => {
    mockResponse({ foo: "bar" });
    const result = await client.get("/test");
    expect(result).toEqual({ foo: "bar" });
  });

  it("handles timeout", async () => {
    vi.useFakeTimers();
    mockFetch.mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted.");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    const promise = client.get("/test");
    vi.advanceTimersByTime(11000);
    await expect(promise).rejects.toThrow("Network timeout");
    vi.useRealTimers();
  });

  it("throws ApiError on failure", async () => {
    mockResponse({ error: "Fail" }, false, 400);
    await expect(client.get("/test")).rejects.toThrow(ApiError);
  });

  it("parses pagination headers", async () => {
    mockResponse([], true, 200, {
      "X-Page": "2",
      "X-Total-Pages": "10",
      "X-Total": "100",
      "X-Per-Page": "50",
    });
    const result = await client.getPaginated("/test", { page: 2 });
    expect(result.page).toBe(2);
    expect(result.totalPages).toBe(10);
    expect(result.total).toBe(100);
    expect(result.perPage).toBe(50);
  });

  it("handles 204 No Content successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error("Should not be called");
      },
      headers: { get: () => null },
    });
    const result = await client.post("/test");
    expect(result).toEqual({});
  });

  it("triggers onAuthError on 401 status", async () => {
    const onAuthError = vi.fn();
    client.setAuthErrorHandler(onAuthError);
    mockResponse({ message: "Unauthorized" }, false, 401);
    await expect(client.get("/test")).rejects.toThrow(ApiError);
    expect(onAuthError).toHaveBeenCalled();
  });

  it("handles non-JSON error responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("Not JSON");
      },
      headers: { get: () => null },
    });
    await expect(client.get("/test")).rejects.toThrow("Internal Server Error");
  });

  it("supports PUT, DELETE and POST with bodies", async () => {
    mockResponse({ success: true });
    await client.post("/post", { data: 1 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ data: 1 }),
      }),
    );

    mockResponse({ success: true });
    await client.put("/put", { data: 2 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ data: 2 }),
      }),
    );

    mockResponse({ success: true });
    await client.delete("/delete", { data: 3 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ data: 3 }),
      }),
    );
  });
});

describe("ApiError", () => {
  it("identifies auth and forbidden errors", () => {
    const authErr = new ApiError(401, {});
    expect(authErr.isAuthError()).toBe(true);
    expect(authErr.isForbiddenError()).toBe(false);

    const forbiddenErr = new ApiError(403, {});
    expect(forbiddenErr.isAuthError()).toBe(false);
    expect(forbiddenErr.isForbiddenError()).toBe(true);

    const otherErr = new ApiError(500, {}, "Custom Message");
    expect(otherErr.message).toBe("Custom Message");
  });
});

describe("Auth and User Functions", () => {
  let mockFetch: Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  const mockResponse = (data: any, ok = true, status = 200) => {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: async () => data,
      headers: { get: () => null },
    });
  };

  it("forgotPassword and resetPassword call correct endpoints", async () => {
    mockResponse({});
    await forgotPassword("email@test.com");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/forgot-password"),
      expect.anything(),
    );

    mockResponse({});
    await resetPassword("token", "pass");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/reset-password"),
      expect.anything(),
    );
  });

  it("register calls correct endpoint", async () => {
    mockResponse({});
    await register("Name", "user", "email", "pass", "Midfielder", "123");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/register"),
      expect.objectContaining({
        body: expect.stringContaining('"position":"Midfielder"'),
      }),
    );
  });

  it("updateUserProfile and deleteUser call correct endpoints", async () => {
    mockResponse({ id: "u1" });
    await updateUserProfile("u1", { name: "New Name" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/user/u1/profile"),
      expect.objectContaining({ method: "PUT" }),
    );

    mockResponse({});
    await deleteUser("u1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/user/u1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("uploadUserAvatar handles success and failure", async () => {
    mockResponse({ avatar_filename: "img.png" });
    const file = new File([""], "img.png", { type: "image/png" });
    const res = await uploadUserAvatar("u1", file);
    expect(res.avatar_filename).toBe("img.png");

    mockResponse({ message: "Upload failed" }, false, 400);
    await expect(uploadUserAvatar("u1", file)).rejects.toThrow("Upload failed");
  });

  it("deleteUserAvatar and getUserAvatarUrl work correctly", async () => {
    mockResponse({});
    await deleteUserAvatar("u1");
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/user/u1/avatar"),
      expect.objectContaining({ method: "DELETE" }),
    );

    const url = getUserAvatarUrl("u1", "img.png");
    expect(url).toContain("/api/user/u1/avatar");
    expect(url).toContain("t=img.png");

    expect(getUserAvatarUrl("u1", null)).toBeUndefined();
  });
});
