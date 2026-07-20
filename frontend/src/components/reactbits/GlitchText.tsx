import { useAnims } from '../../lib/anims'

// react-bits "GlitchText" esintili, repoya kopyalanmış bileşen.
// active=true iken (yalnızca yüksek risk) çok hafif kanal-ayrımı glitch'i uygular;
// aksi halde düz metin. Renkler .glitch CSS'inde token'lardan (risk-high + accent) gelir.
interface GlitchTextProps {
  text: string
  className?: string
  active?: boolean
}

export default function GlitchText({ text, className, active = false }: GlitchTextProps) {
  const { reduce } = useAnims()
  const glitch = active && !reduce // reduced-motion'da glitch yok
  return (
    <span className={`${className ?? ''} ${glitch ? 'glitch' : ''}`} data-text={text}>
      {text}
    </span>
  )
}
