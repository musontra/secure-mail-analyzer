interface RiskGaugeProps {
  score: number // 0-100
  color: string // risk seviyesinin hex rengi
  label: string // "YÜKSEK RİSK" gibi
}

// Yarım daire gauge, kütüphanesiz saf SVG.
// Mantık: 180°'lik yay çizilir; skorun yüzdesi kadar kısmı renkli çizgiyle boyanır.
function RiskGauge({ score, color, label }: RiskGaugeProps) {
  const radius = 80
  // Yarım dairenin toplam yay uzunluğu = π * r
  const arcLength = Math.PI * radius
  // Skor kadar boyanacak kısım (0-100 -> 0-arcLength)
  const progress = (Math.min(Math.max(score, 0), 100) / 100) * arcLength

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
        {/* Skor yayı: dasharray ile yalnızca 'progress' kadarı çizilir */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${arcLength}`}
        />
        {/* Ortadaki skor yazısı */}
        <text x="100" y="88" textAnchor="middle" fontSize="34" fontWeight="700" fill={color}>
          {score}
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
