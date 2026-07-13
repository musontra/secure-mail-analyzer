import { useState } from 'react'
import type { AnalysisResponse, InputType, RiskLevel } from './types'

// Geliştirme ortamında backend adresi (ileride ortam değişkenine taşınacak)
const API_URL = 'http://localhost:5105/api/analyses'

// Risk seviyesinin Türkçe etiketi ve basit renk sınıfı
const RISK_DISPLAY: Record<RiskLevel, { label: string; colorClass: string }> = {
  low: { label: 'Düşük Risk', colorClass: 'text-green-700' },
  medium: { label: 'Orta Risk', colorClass: 'text-yellow-700' },
  high: { label: 'Yüksek Risk', colorClass: 'text-red-700' },
}

function App() {
  const [inputType, setInputType] = useState<InputType>('email')
  const [inputContent, setInputContent] = useState('')
  const [result, setResult] = useState<AnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    if (!inputContent.trim()) {
      setError('Lütfen analiz edilecek içeriği girin.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputType, inputContent }),
      })

      if (!response.ok) {
        // Backend'in Türkçe hata mesajını göster; yoksa genel mesaj
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `Sunucu hatası (${response.status})`)
      }

      const data = (await response.json()) as AnalysisResponse
      setResult(data)
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? 'Sunucuya ulaşılamadı. Backend çalışıyor mu? (dotnet run)'
          : err instanceof Error
            ? err.message
            : 'Beklenmeyen bir hata oluştu.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Mail ve Link Güvenlik Analizi</h1>

      {/* Girdi türü seçimi */}
      <fieldset className="mb-3">
        <legend className="mb-1 font-medium">Ne analiz edilecek?</legend>
        <label className="mr-4">
          <input
            type="radio"
            name="inputType"
            value="email"
            checked={inputType === 'email'}
            onChange={() => setInputType('email')}
          />{' '}
          E-posta içeriği
        </label>
        <label>
          <input
            type="radio"
            name="inputType"
            value="link"
            checked={inputType === 'link'}
            onChange={() => setInputType('link')}
          />{' '}
          Link
        </label>
      </fieldset>

      {/* İçerik girişi */}
      <textarea
        className="mb-3 h-40 w-full border p-2"
        placeholder={
          inputType === 'email'
            ? 'E-posta içeriğini buraya yapıştırın...'
            : 'Analiz edilecek linki buraya yapıştırın...'
        }
        value={inputContent}
        onChange={(e) => setInputContent(e.target.value)}
      />

      <button
        type="button"
        className="border px-4 py-2 disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={isLoading}
      >
        {isLoading ? 'Analiz ediliyor...' : 'Analiz Et'}
      </button>

      {/* Hata durumu */}
      {error && <p className="mt-3 text-red-700">Hata: {error}</p>}

      {/* Sonuç alanı */}
      {result && (
        <section className="mt-6">
          <h2 className={`text-3xl font-bold ${RISK_DISPLAY[result.riskLevel].colorClass}`}>
            {RISK_DISPLAY[result.riskLevel].label} — {result.riskScore}/100
          </h2>

          {result.detectedSignals.length === 0 ? (
            <p className="mt-2">Herhangi bir risk sinyali tespit edilmedi.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {result.detectedSignals.map((signal) => (
                <li key={signal.code} className="border p-3">
                  <h3 className="font-semibold">
                    {signal.title} (+{signal.score} puan)
                  </h3>
                  <p className="mt-1">{signal.description}</p>
                  {signal.matchedText && (
                    <p className="mt-1 text-sm">
                      Tetikleyen: <code>{signal.matchedText}</code>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}

export default App
