import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { getAnalyses } from '../lib/api'
import { RISK_META, formatRelativeTime, truncate } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import { useAnims } from '../lib/anims'
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-soft">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
      <path d="M10 14a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.5 1.5" strokeLinecap="round" />
      <path d="M14 10a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7L12 18" strokeLinecap="round" />
    </svg>
  )
}

// Geçmiş sayfası: tüm analizler tablo halinde, client-side risk filtresiyle
function HistoryPage() {
  const navigate = useNavigate()
  const { d } = useAnims()
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
        <h1 className="term-head text-3xl font-bold text-fg">Analiz Geçmişi</h1>

        {/* Filtre chip'leri (client-side) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-widest text-fg-dim">
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
                  : 'border border-accent/15 text-fg-soft hover:text-fg'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="mt-10 text-center text-fg-soft">Geçmiş yükleniyor...</p>}
      {error && <p className="mt-10 text-center text-risk-high">{error}</p>}

      {!isLoading && !error && (
        <div className="glass-card mt-6 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-accent/15 text-[11px] font-semibold tracking-widest text-fg-dim">
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
                  <td colSpan={6} className="px-5 py-10 text-center text-fg-soft">
                    {analyses.length === 0
                      ? 'Henüz analiz yapılmadı. İlk analizinizi ana sayfadan başlatın.'
                      : 'Bu filtreyle eşleşen kayıt yok.'}
                  </td>
                </tr>
              ) : (
                // Yüklenirken hafif stagger; filtre değişiminde AnimatePresence ile yumuşak giriş/çıkış
                <AnimatePresence initial={true} mode="popLayout">
                  {filtered.map((analysis, i) => (
                    <motion.tr
                      key={analysis.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: d(0.2), delay: d(i * 0.04), ease: 'easeOut' }}
                      className="cursor-pointer border-b border-accent/10 transition hover:bg-white/5"
                      onClick={() => navigate(`/sonuc/${analysis.id}`)}
                    >
                      <td className="px-5 py-2.5">
                        <TypeIcon type={analysis.inputType} />
                      </td>
                      <td className="max-w-md px-5 py-2.5 text-fg-soft">
                        {truncate(analysis.inputContent)}
                      </td>
                      <td className="px-5 py-2.5">
                        <RiskBadge level={analysis.riskLevel} />
                      </td>
                      {/* Risk puanı: yüksek sayı = kırmızı (güven puanı DEĞİL) */}
                      <td
                        className={`px-5 py-2.5 font-mono font-bold ${RISK_META[analysis.riskLevel].textClass}`}
                      >
                        {analysis.riskScore}/100
                      </td>
                      <td className="px-5 py-2.5 text-fg-soft">
                        {formatRelativeTime(analysis.createdAt)}
                      </td>
                      <td className="px-5 py-2.5 text-fg-dim">›</td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>

          <div className="px-5 py-3 text-xs text-fg-dim">
            Toplam {filtered.length} analiz gösteriliyor
          </div>
        </div>
      )}
    </div>
  )
}

export default HistoryPage
