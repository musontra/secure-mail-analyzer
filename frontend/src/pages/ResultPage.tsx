import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAnalysisById } from '../lib/api'
import { RISK_META } from '../lib/format'
import RiskGauge from '../components/RiskGauge'
import SignalCard from '../components/SignalCard'
import type { AnalysisResponse } from '../types'

// Yapay zeka kartı: aiAssessment ileride API'den gelecek (Adım 7).
// null/undefined ise placeholder gösterilir; kart tamamen gizlenebilir yapıda.
function AiAssessmentCard({ aiText }: { aiText?: string | null }) {
  return (
    <div className="glass-card crt-exempt mt-6 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
          {/* Kıvılcım ikonu */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z" />
          </svg>
        </span>
        <h3 className="term-head font-semibold text-fg">Yapay Zeka Değerlendirmesi</h3>
      </div>
      {/* En okunaklı kademe (text-fg): AI açıklaması sönük tona düşmez */}
      <p className="mt-3 text-sm leading-relaxed text-fg">
        {aiText ?? 'Yapay zeka analizi bu kayıt için mevcut değil.'}
      </p>
    </div>
  )
}

// Sonuç sayfası: URL'deki id ile kaydı çeker, gauge + sinyalleri gösterir
function ResultPage() {
  const { id } = useParams<{ id: string }>()
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getAnalysisById(id)
      .then(setAnalysis)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Kayıt yüklenemedi.'),
      )
  }, [id])

  if (error) {
    return (
      <div className="pt-10 text-center">
        <p className="text-risk-high">{error}</p>
        <Link to="/" className="btn-primary mt-6">
          Yeni Analiz
        </Link>
      </div>
    )
  }

  if (!analysis) {
    return <p className="pt-10 text-center text-fg-soft">Sonuç yükleniyor...</p>
  }

  const meta = RISK_META[analysis.riskLevel]
  // Sinyaller önem sırasına göre (puanı yüksek olan üstte)
  const sortedSignals = [...analysis.detectedSignals].sort((a, b) => b.score - a.score)

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="text-sm text-fg-soft transition hover:text-fg">
        ← Yeni Analiz
      </Link>

      {/* Skor kartı */}
      <div className="glass-card mt-4 flex flex-col items-center px-6 py-8">
        <RiskGauge
          score={analysis.riskScore}
          color={meta.hex}
          label={`${meta.label} RİSK`}
        />
        <h1 className="mt-4 text-3xl font-bold text-fg">{meta.verdict}</h1>
        <p className="mt-2 max-w-xl text-center text-sm text-fg-soft">{meta.verdictSub}</p>
      </div>

      {/* Sinyal listesi */}
      <div className="mt-8 flex items-end justify-between">
        <h2 className="term-head text-lg font-semibold text-fg">
          Tespit Edilen Sinyaller ({sortedSignals.length})
        </h2>
        <span className="text-[11px] font-semibold tracking-widest text-fg-dim">
          ÖNEM SIRASINA GÖRE
        </span>
      </div>

      {sortedSignals.length === 0 ? (
        <p className="glass-card mt-4 p-5 text-sm text-fg-soft">
          Herhangi bir risk sinyali tespit edilmedi.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {sortedSignals.map((signal, index) => (
            <SignalCard key={signal.code} signal={signal} defaultOpen={index === 0} />
          ))}
        </div>
      )}

      <AiAssessmentCard aiText={analysis.educationalExplanation} />

      {/* Alt aksiyonlar */}
      <div className="mt-8 flex justify-center gap-4">
        <Link to="/gecmis" className="btn-ghost">
          Geçmişte Görüntüle
        </Link>
        <Link to="/" className="btn-primary">
          Yeni Analiz
        </Link>
      </div>
    </div>
  )
}

export default ResultPage
