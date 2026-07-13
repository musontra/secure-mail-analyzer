import type { AnalysisResponse, InputType } from '../types'

// Geliştirme ortamında backend adresi (ileride ortam değişkenine taşınacak)
const API_BASE = 'http://localhost:5105'

// Backend'in { error: "..." } formatındaki Türkçe mesajını çıkarır
async function parseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null
  return body?.error ?? `Sunucu hatası (${response.status})`
}

export async function createAnalysis(
  inputType: InputType,
  inputContent: string,
): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/api/analyses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputType, inputContent }),
  })
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AnalysisResponse
}

export async function getAnalyses(): Promise<AnalysisResponse[]> {
  const response = await fetch(`${API_BASE}/api/analyses`)
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AnalysisResponse[]
}

export async function getAnalysisById(id: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE}/api/analyses/${id}`)
  if (!response.ok) throw new Error(await parseError(response))
  return (await response.json()) as AnalysisResponse
}
