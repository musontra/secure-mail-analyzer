import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAnalysis } from '../lib/api'
import type { InputType } from '../types'

// Alttaki bilgi chip'leri (tasarımdaki üç rozet)
const INFO_CHIPS = [
  'Analizleriniz geçmişinizde saklanır',
  '12 kural + yapay zeka analizi',
  'Eğitim amaçlıdır',
]

// Ana analiz sayfası: tür seçimi + içerik + Analiz Et
function AnalyzePage() {
  const navigate = useNavigate()
  const [inputType, setInputType] = useState<InputType>('email')
  const [inputContent, setInputContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    if (!inputContent.trim()) {
      setError('Lütfen analiz edilecek içeriği girin.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const result = await createAnalysis(inputType, inputContent)
      // Kayıt oluştu; sonuç sayfası id üzerinden veriyi kendisi çeker
      navigate(`/sonuc/${result.id}`)
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? 'Sunucuya ulaşılamadı. Backend çalışıyor mu? (dotnet run)'
          : err instanceof Error
            ? err.message
            : 'Beklenmeyen bir hata oluştu.',
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl pt-6">
      <h1 className="text-center text-4xl font-bold tracking-tight text-fg">
        E-posta veya Linki Analiz Edin
      </h1>
      <p className="mt-3 text-center text-fg-soft">
        Şüpheli içerikleri saniyeler içinde tarayın, kimlik avı saldırılarından korunun.
      </p>

      <div className="glass-card mt-8 p-6">
        {/* Segmented toggle: E-posta / Link */}
        <div className="inline-flex rounded-lg border border-accent/15 bg-black/30 p-1">
          {(
            [
              ['email', 'E-posta İçeriği'],
              ['link', 'Link'],
            ] as [InputType, string][]
          ).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => setInputType(type)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${
                inputType === type
                  ? 'bg-accent text-slate-950'
                  : 'text-fg-soft hover:text-fg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <textarea
          className="mt-4 h-52 w-full resize-none rounded-xl border border-accent/15 bg-black/30 p-4 text-fg-soft placeholder-fg-dim outline-none transition focus:border-accent-soft"
          placeholder={
            inputType === 'email'
              ? 'E-posta içeriğini buraya yapıştırın...'
              : 'Analiz edilecek linki buraya yapıştırın...'
          }
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
        />

        {error && <p className="mt-2 text-sm text-risk-high">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button type="button" className="btn-primary" onClick={handleAnalyze} disabled={isLoading}>
            {/* Kalkan-tarama ikonu */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" strokeLinejoin="round" />
            </svg>
            {isLoading ? 'Analiz ediliyor...' : 'Analiz Et'}
          </button>
        </div>
      </div>

      {/* Bilgi chip'leri */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {INFO_CHIPS.map((chip) => (
          <span
            key={chip}
            className="flex items-center gap-1.5 rounded-full border border-accent/15 bg-white/5 px-3.5 py-1.5 text-xs text-fg-soft"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent-soft">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

export default AnalyzePage
