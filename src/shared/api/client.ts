export type ApiConfig = {
  baseUrl?: string
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '' // use vite proxy in dev
  const globalAny = globalThis as { process?: { env?: Record<string, string | undefined> } } | undefined
  const fromNode = globalAny?.process?.env?.API_BASE_URL
  return fromNode ?? ''
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
    message?: string
  ) {
    super(message || `API Error: ${status}`)
    this.name = 'ApiError'
  }

  isAuthError(): boolean {
    return this.status === 401
  }

  isForbiddenError(): boolean {
    return this.status === 403
  }
}

export class ApiClient {
  private token: string | null
  private baseUrl: string
  private onAuthError?: () => void

  constructor(config?: ApiConfig) {
    this.baseUrl = config?.baseUrl ?? getBaseUrl()
    // Initialize token early to avoid first-render race conditions
    this.token = (typeof window !== 'undefined') ? (localStorage.getItem('authToken') || null) : null
  }

  setToken(token: string | null) {
    this.token = token
  }

  setAuthErrorHandler(handler: () => void) {
    this.onAuthError = handler
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (this.token) headers['Authorization'] = `Token ${this.token}`
    return headers
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: res.statusText }))
      const apiError = new ApiError(res.status, errorData, errorData.error || errorData.message)
      
      // Trigger auth error handler for 401 errors
      if (apiError.isAuthError() && this.onAuthError) {
        this.onAuthError()
      }
      
      throw apiError
    }
    return (await res.json()) as T
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.headers(),
    })
    return this.handleResponse<T>(res)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(res)
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(res)
  }

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    return this.handleResponse<T>(res)
  }
}

export type LoginResponse = { 
  token: string
  user: User
}

export type User = {
  id: number
  name: string
  email: string
}

export type UserProfileUpdate = {
  name?: string
  email?: string
  password?: string
}

export const api = new ApiClient()

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, password })
}

export async function register(name: string, email: string, password: string): Promise<void> {
  await api.post('/auth/register', { name, email, password })
}

export async function getUser(userId: number): Promise<User> {
  return api.get<User>(`/api/user/${userId}`)
}

export async function updateUserProfile(userId: number, updates: UserProfileUpdate): Promise<User> {
  return api.put<User>(`/api/user/${userId}/profile`, updates)
}
