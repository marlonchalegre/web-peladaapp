import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { ApiClient, ApiError } from "./client";

describe("ApiClient", () => {
  let client: ApiClient;
  let mockFetch: Mock;

  beforeEach(() => {
    client = new ApiClient();
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication", () => {
    it("includes Authorization header when token is set", async () => {
      client.setToken("test-token");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await client.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/test"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Token test-token",
          }),
        }),
      );
    });

    it("does not include Authorization header when token is null", async () => {
      client.setToken(null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await client.get("/auth/login");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.anything(),
          }),
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("throws ApiError with 401 status for unauthorized requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: "Authentication required",
          type: "authentication",
        }),
      });

      try {
        await client.get("/api/users");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
        expect((error as ApiError).isAuthError()).toBe(true);
      }
    });

    it("throws ApiError with 403 status for forbidden requests", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "Access forbidden", type: "forbidden" }),
      });

      try {
        await client.get("/admin/settings");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(403);
        expect((error as ApiError).isForbiddenError()).toBe(true);
        expect((error as ApiError).isAuthError()).toBe(false);
      }
    });

    it("calls onAuthError handler when 401 error occurs", async () => {
      const onAuthError = vi.fn();
      client.setAuthErrorHandler(onAuthError);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: "Authentication required" }),
      });

      try {
        await client.get("/api/users");
      } catch {
        // Error should be thrown
      }

      expect(onAuthError).toHaveBeenCalled();
    });

    it("does not call onAuthError handler for non-401 errors", async () => {
      const onAuthError = vi.fn();
      client.setAuthErrorHandler(onAuthError);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: "Access forbidden" }),
      });

      try {
        await client.get("/admin/settings");
      } catch {
        // Error should be thrown
      }

      expect(onAuthError).not.toHaveBeenCalled();
    });

    it("handles network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.get("/api/users")).rejects.toThrow("Network error");
    });
  });

  describe("HTTP Methods", () => {
    it("performs GET requests correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "Test" }),
      });

      const result = await client.get("/api/users/1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/1"),
        expect.objectContaining({ method: "GET" }),
      );
      expect(result).toEqual({ id: 1, name: "Test" });
    });

    it("performs POST requests with body correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "New User" }),
      });

      const body = { name: "New User", email: "new@example.com" };
      const result = await client.post("/api/users", body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        }),
      );
      expect(result).toEqual({ id: 1, name: "New User" });
    });

    it("performs PUT requests with body correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: "Updated User" }),
      });

      const body = { name: "Updated User" };
      const result = await client.put("/api/users/1", body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(body),
        }),
      );
      expect(result).toEqual({ id: 1, name: "Updated User" });
    });

    it("performs DELETE requests correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await client.delete("/api/users/1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/1"),
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("ApiError", () => {
    it("correctly identifies auth errors (401)", () => {
      const error = new ApiError(401, { error: "Unauthorized" });
      expect(error.isAuthError()).toBe(true);
      expect(error.isForbiddenError()).toBe(false);
    });

    it("correctly identifies forbidden errors (403)", () => {
      const error = new ApiError(403, { error: "Forbidden" });
      expect(error.isAuthError()).toBe(false);
      expect(error.isForbiddenError()).toBe(true);
    });

    it("correctly identifies other errors", () => {
      const error = new ApiError(404, { error: "Not found" });
      expect(error.isAuthError()).toBe(false);
      expect(error.isForbiddenError()).toBe(false);
    });

    it("has correct error message", () => {
      const error = new ApiError(
        401,
        { error: "Unauthorized" },
        "Custom message",
      );
      expect(error.message).toBe("Custom message");
      expect(error.status).toBe(401);
    });

    it("defaults to generic message if not provided", () => {
      const error = new ApiError(500, { error: "Server error" });
      expect(error.message).toBe("API Error: 500");
    });
  });
});
