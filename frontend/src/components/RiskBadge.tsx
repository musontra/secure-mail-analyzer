import type { RiskLevel } from '../types'
import { RISK_META } from '../lib/format'

// Risk seviyesi rozeti: "DÜŞÜK" / "ORTA" / "YÜKSEK" renkli pill
function RiskBadge({ level }: { level: RiskLevel }) {
  const meta = RISK_META[level]
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-wider ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  )
}

export default RiskBadge
