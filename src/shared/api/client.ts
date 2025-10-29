export type ApiConfig = {
  baseUrl?: string
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') return '' // use vite proxy in dev
  const globalAny = globalThis as { process?: { env?: Record<string, string | undefined> } } | undefined
  const fromNode = globalAny?.process?.env?.API_BASE_URL
  return fromNode ?? ''
}

export class ApiClient {
  private token: string | null
  private baseUrl: string

  constructor(config?: ApiConfig) {
    this.baseUrl = config?.baseUrl ?? getBaseUrl()
    // Initialize token early to avoid first-render race conditions
    this.token = (typeof window !== 'undefined') ? (localStorage.getItem('authToken') || null) : null
  }

  setToken(token: string | null) {
    this.token = token
  }

  private headers(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (this.token) headers['Authorization'] = `Token ${this.token}`
    return headers
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.headers(),
    })
    if (!res.ok) throw await res.json().catch(() => new Error(res.statusText))
    return (await res.json()) as T
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw await res.json().catch(() => new Error(res.statusText))
    return (await res.json()) as T
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw await res.json().catch(() => new Error(res.statusText))
    return (await res.json()) as T
  }

  async delete<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw await res.json().catch(() => new Error(res.statusText))
    return (await res.json()) as T
  }
}

export type LoginResponse = { token: string }

export const api = new ApiClient()

export async function login(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, password })
}

export async function register(name: string, email: string, password: string): Promise<void> {
  await api.post('/auth/register', { name, email, password })
}
