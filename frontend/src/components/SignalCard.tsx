import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import type { DetectedSignal } from '../types'
import { useAnims } from '../lib/anims'

interface SignalCardProps {
  signal: DetectedSignal
  defaultOpen?: boolean
  index?: number // giriş stagger'ı için sıra (log akışı hissi)
}

// Sinyal puanına göre önem rengi (nokta + puan chip'i)
// Risk token'larıyla aynı neon değerler (SVG/inline stil için somut hex).
function severityColor(score: number): string {
  if (score >= 25) return '#ff5252' // yüksek: en güçlü sinyaller
  if (score >= 15) return '#ffc400' // orta
  return '#00e676' // hafif
}

// Genişletilebilir sinyal kartı: başlık satırına tıklayınca açıklama açılır
function SignalCard({ signal, defaultOpen = false, index = 0 }: SignalCardProps) {
  const { d } = useAnims()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const color = severityColor(signal.score)

  // "görünen: x → gerçek: y" formatındaysa iki satır halinde gösterilir
  const mismatchParts = signal.matchedText?.includes('→')
    ? signal.matchedText.split('→').map((part) => part.trim())
    : null

  return (
    <motion.div
      className="glass-card overflow-hidden"
      // Giriş: sırayla belir (kart başına ~60ms) — log akışı hissi
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: d(0.25), delay: d(index * 0.06), ease: 'easeOut' }}
    >
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-white/5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="flex-1 font-semibold text-fg">{signal.title}</span>
        {/* Sabit genişlik + tabular sayı: puan chip'leri alt alta hizalanır */}
        <span
          className="w-14 shrink-0 rounded-[3px] py-0.5 text-center text-xs font-bold tabular-nums"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          +{signal.score}
        </span>
        {/* Açık/kapalı ok ikonu */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-fg-dim transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Aç/kapa: yükseklik + opaklık yumuşasın (overflow-hidden ile taşma engellenir) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: d(0.25), ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-accent/15 px-5 py-4">
              <p className="text-sm leading-relaxed text-fg-soft">{signal.description}</p>

              {signal.matchedText && (
                <div className="mt-3 rounded-lg border border-accent/15 bg-black/40 p-3 font-mono text-sm">
                  {mismatchParts ? (
                    // "Görünen / Gerçek" karşılaştırması iki satır
                    <>
                      <div className="text-risk-low">{mismatchParts[0]}</div>
                      <div className="text-risk-high">{mismatchParts[1]}</div>
                    </>
                  ) : (
                    <span className="text-fg-soft">{signal.matchedText}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SignalCard
