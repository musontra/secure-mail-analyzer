import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAnalyses } from '../lib/api'
import { RISK_META, formatRelativeTime, truncate } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import type { AnalysisResponse, RiskLevel } from '../types'

type Filter = 'all' | RiskLevel

const FILTER_OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Tümü' },
  { value: 'low', label: 'Düşük' },
  { value: 'medium', label: 'Orta' },
  { value: 'high', label: 'Yüksek' },
]

// Tür ikonu: e-posta zarfı veya link zinciri
function TypeIcon({ type }: { type: 'email' | 'link' }) {
  return type === 'email' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4cd7f6" strokeWidth="2">
      <path d="M10 14a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" strokeLinecap="round" />
      <path d="M14 10a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7L12 18" strokeLinecap="round" />
    </svg>
  )
}

// Geçmiş sayfası: tüm analizler tablo halinde, client-side risk filtresiyle
function HistoryPage() {
  const navigate = useNavigate()
  const [analyses, setAnalyses] = useState<AnalysisResponse[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAnalyses()
      .then(setAnalyses)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Geçmiş yüklenemedi.'),
      )
      .finally(() => setIsLoading(false))
  }, [])

  const filtered =
    filter === 'all' ? analyses : analyses.filter((a) => a.riskLevel === filter)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Analiz Geçmişi</h1>

        {/* Filtre chip'leri (client-side) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-widest text-slate-500">
            FİLTRELE:
          </span>
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                filter === option.value
                  ? 'bg-accent-soft/20 text-accent-soft'
                  : 'border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="mt-10 text-center text-slate-400">Geçmiş yükleniyor...</p>}
      {error && <p className="mt-10 text-center text-red-400">{error}</p>}

      {!isLoading && !error && (
        <div className="glass-card mt-6 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-semibold tracking-widest text-slate-500">
                <th className="px-5 py-3">TÜR</th>
                <th className="px-5 py-3">İÇERİK ÖNİZLEME</th>
                <th className="px-5 py-3">RİSK SEVİYESİ</th>
                <th className="px-5 py-3">RİSK PUANI</th>
                <th className="px-5 py-3">TARİH</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                    {analyses.length === 0
                      ? 'Henüz analiz yapılmadı. İlk analizinizi ana sayfadan başlatın.'
                      : 'Bu filtreyle eşleşen kayıt yok.'}
                  </td>
                </tr>
              ) : (
                filtered.map((analysis) => (
                  <tr
                    key={analysis.id}
                    className="cursor-pointer border-b border-white/5 transition hover:bg-white/5"
                    onClick={() => navigate(`/sonuc/${analysis.id}`)}
                  >
                    <td className="px-5 py-4">
                      <TypeIcon type={analysis.inputType} />
                    </td>
                    <td className="max-w-md px-5 py-4 text-slate-300">
                      {truncate(analysis.inputContent)}
                    </td>
                    <td className="px-5 py-4">
                      <RiskBadge level={analysis.riskLevel} />
                    </td>
                    {/* Risk puanı: yüksek sayı = kırmızı (güven puanı DEĞİL) */}
                    <td
                      className={`px-5 py-4 font-mono font-bold ${RISK_META[analysis.riskLevel].textClass}`}
                    >
                      {analysis.riskScore}/100
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {formatRelativeTime(analysis.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">›</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="px-5 py-3 text-xs text-slate-500">
            Toplam {filtered.length} analiz gösteriliyor
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
