import type { AdminStats, AnalysisResponse, AuthUser, InputType } from '../types'

// Göreli taban: istekler her zaman sayfanın kendi origin'ine gider.
// Geliştirmede Vite proxy'si (vite.config.ts), container'da nginx
// bu istekleri backend'e iletir — ortama göre adres değişmez.
const API_BASE = '/api'

// Backend'in { error: "..." } formatındaki Türkçe mesajını çıkarır
async function parseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? `Sunucu hatası (${response.status})`
}

// Oturumdaki token'ı Authorization header'ına çevirir
function authHeaders(): Record<string, string> {
  const raw = sessionStorage.getItem('auth')
  if (!raw) return {}
  try {
    const { token } = JSON.parse(raw) as AuthUser
    return { Authorization: `Bearer ${token}` }
  } catch {
    return {}
  }
}

// 401 = token yok/geçersiz/süresi dolmuş: oturumu temizle, login'e dön
function redirectIfUnauthorized(response: Response): void {
  if (response.status === 401) {
    sessionStorage.removeItem('auth')
    window.location.href = '/login'
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AuthUser
}

export async function registerRequest(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  const body = (await response.json()) as { message: string }
  return body.message
}

export async function createAnalysis(
  inputType: InputType,
  inputContent: string,
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ inputType, inputContent }),
  })
  redirectIfUnauthorized(response)
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AnalysisResponse
}

export async function getAnalyses(): Promise<AnalysisResponse[]> {
  const response = await fetch(`${API_BASE}/analyses`, { headers: authHeaders() })
  redirectIfUnauthorized(response)
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AnalysisResponse[]
}

export async function getAnalysisById(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/analyses/${id}`, { headers: authHeaders() })
  redirectIfUnauthorized(response)
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AnalysisResponse
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${API_BASE}/admin/stats`, { headers: authHeaders() })
  redirectIfUnauthorized(response)
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AdminStats
}
