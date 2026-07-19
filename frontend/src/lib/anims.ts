import { useCallback } from 'react'
import { useReducedMotion } from 'motion/react'

// Tek kaynak: prefers-reduced-motion aktifse tüm süreler/gecikmeler 0'a iner,
// böylece her bileşen animasyonu anında son duruma geçer. Bileşenler bu hook'u
// çağırıp süreleri d() üzerinden geçirir; reduced-motion kontrolünü tekrar etmez.
export function useAnims() {
  const reduce = useReducedMotion() ?? false
  // Saniye cinsinden süreyi reduced-motion ise 0'a indirir.
  // useCallback: kimliği sabit kalır; useEffect bağımlılıklarında güvenle kullanılır.
  const d = useCallback((seconds: number): number => (reduce ? 0 : seconds), [reduce])
  return { reduce, d }
}
