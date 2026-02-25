export type ApiConfig = {
  baseUrl?: string;
};

function getBaseUrl(): string {
  if (typeof window !== "undefined") return ""; // use vite proxy in dev
  const globalAny = globalThis as
    | { process?: { env?: Record<string, string | undefined> } }
    | undefined;
  const fromNode = globalAny?.process?.env?.API_BASE_URL;
  return fromNode ?? "";
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string,
  ) {
    super(message || `API Error: ${status}`);
    this.name = "ApiError";
  }

  isAuthError(): boolean {
    return this.status === 401;
  }

  isForbiddenError(): boolean {
    return this.status === 403;
  }
}

export class ApiClient {
  private token: string | null;
  private baseUrl: string;
  private onAuthError?: () => void;

  constructor(config?: ApiConfig) {
    this.baseUrl = config?.baseUrl ?? getBaseUrl();
    // Initialize token early to avoid first-render race conditions
    this.token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") || null
        : null;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setAuthErrorHandler(handler: () => void) {
    this.onAuthError = handler;
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (this.token) headers["Authorization"] = `Token ${this.token}`;
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ error: res.statusText }));
      const apiError = new ApiError(
        res.status,
        errorData,
        errorData.error || errorData.message,
      );

      // Trigger auth error handler for 401 errors
      if (apiError.isAuthError() && this.onAuthError) {
        this.onAuthError();
      }

      throw apiError;
    }

    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  }

  async get<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const fullPath = `${this.baseUrl}${path}`;
    const baseUrl =
      this.baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL(fullPath, baseUrl);

    if (params) {
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, String(params[key])),
      );
    }
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: this.headers(),
    });
    return this.handleResponse<T>(res);
  }

  async getPaginated<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Promise<{
    data: T;
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  }> {
    const fullPath = `${this.baseUrl}${path}`;
    const baseUrl =
      this.baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL(fullPath, baseUrl);

    if (params) {
      Object.keys(params).forEach((key) =>
        url.searchParams.append(key, String(params[key])),
      );
    }
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: this.headers(),
    });

    const data = await this.handleResponse<T>(res);

    return {
      data,
      total: parseInt(res.headers.get("X-Total") || "0", 10),
      page: parseInt(res.headers.get("X-Page") || "1", 10),
      perPage: parseInt(res.headers.get("X-Per-Page") || "20", 10),
      totalPages: parseInt(res.headers.get("X-Total-Pages") || "0", 10),
    };
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const fullPath = `${this.baseUrl}${path}`;
    const baseUrl =
      this.baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL(fullPath, baseUrl);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const fullPath = `${this.baseUrl}${path}`;
    const baseUrl =
      this.baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL(fullPath, baseUrl);

    const res = await fetch(url.toString(), {
      method: "PUT",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const fullPath = `${this.baseUrl}${path}`;
    const baseUrl =
      this.baseUrl ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL(fullPath, baseUrl);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }
}

export type LoginResponse = {
  token: string;
  user: User;
};

export type User = {
  id: number;
  name: string;
  username: string;
  email?: string;
  admin_orgs?: number[];
  position?: string;
};

export type UserProfileUpdate = {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  position?: string;
};

export const api = new ApiClient();

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", { email, password });
}

export async function register(
  name: string,
  username: string,
  email: string | undefined,
  password: string,
  position?: string,
): Promise<void> {
  await api.post("/auth/register", {
    name,
    username,
    email,
    password,
    position,
  });
}

export async function getUser(userId: number): Promise<User> {
  return api.get<User>(`/api/user/${userId}`);
}

export async function updateUserProfile(
  userId: number,
  updates: UserProfileUpdate,
): Promise<User> {
  return api.put<User>(`/api/user/${userId}/profile`, updates);
}

export async function deleteUser(userId: number): Promise<void> {
  return api.delete<void>(`/api/user/${userId}`);
}
