import { useEffect, useState } from 'react'
import { animate, motion } from 'motion/react'
import { useAnims } from '../lib/anims'

interface RiskGaugeProps {
  score: number // 0-100
  color: string // risk seviyesinin hex rengi
  label: string // "YÜKSEK RİSK" gibi
}

// Yarım daire gauge, kütüphanesiz saf SVG.
// Mantık: 180°'lik yay çizilir; skorun yüzdesi kadar kısmı renkli çizgiyle boyanır.
// Animasyon: yay 0'dan hedefe dolar, sayı 0'dan hedefe sayar (~1sn, easeOut).
function RiskGauge({ score, color, label }: RiskGaugeProps) {
  const { d } = useAnims()
  const radius = 80
  // Yarım dairenin toplam yay uzunluğu = π * r
  const arcLength = Math.PI * radius
  // Skor kadar boyanacak kısım (0-100 -> 0-arcLength)
  const progress = (Math.min(Math.max(score, 0), 100) / 100) * arcLength

  // Sayının 0'dan hedefe saydığı görünen değer
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const controls = animate(0, score, {
      duration: d(1),
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    })
    return () => controls.stop()
  }, [score, d])

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 115" className="w-56">
        {/* Arka plan yayı (soluk iz) */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Skor yayı: strokeDashoffset ile dolum animasyonu (layout tetiklemez) */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={arcLength}
          initial={{ strokeDashoffset: arcLength }}
          animate={{ strokeDashoffset: arcLength - progress }}
          transition={{ duration: d(1), ease: 'easeOut' }}
        />
        {/* Ortadaki skor yazısı (0'dan sayar) */}
        <text x="100" y="88" textAnchor="middle" fontSize="34" fontWeight="700" fill={color}>
          {display}
          <tspan fontSize="16" fill="rgba(255,255,255,0.5)">
            /100
          </tspan>
        </text>
      </svg>
      <span
        className="mt-1 rounded-full px-3 py-1 text-xs font-semibold tracking-widest"
        style={{ color, backgroundColor: `${color}1a` }}
      >
        {label}
      </span>
    </div>
  )
}

export default RiskGauge
