import { useEffect, useRef } from 'react'
import { useAnims } from '../../lib/anims'

// react-bits arka plan esintili, repoya kopyalanmış bileşen: düşük opaklıkta
// karakter yağmuru (matrix). Canvas + requestAnimationFrame; sekme arka plandayken
// duraklatılır. Renk accent token'ından okunur (sabit renk yazılmaz).
// Opaklık çok düşük (className'de opacity-[0.06]); metin okunabilirliğini bozmaz.
export default function MatrixRain() {
  const { reduce } = useAnims()
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim() ||
      '#00ff41'
    const glyphs = '01<>/\|=+*ABCDEF0123456789'
    const fontSize = 14
    let drops: number[] = []
    let raf = 0
    let running = false

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const cols = Math.max(1, Math.floor(canvas.width / fontSize))
      drops = Array.from({ length: cols }, () => Math.random() * (canvas.height / fontSize))
    }
    resize()

    const drawFrame = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = accent
      ctx.font = `${fontSize}px monospace`
      for (let i = 0; i < drops.length; i++) {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
        ctx.fillText(ch, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i] += 0.5
      }
    }

    // reduced-motion: tek kare çiz, animasyon yok
    if (reduce) {
      drawFrame()
      return
    }

    const loop = () => {
      drawFrame()
      if (running) raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }
    // Performans: sekme arka plandayken duraklat
    const onVisibility = () => (document.hidden ? stop() : start())

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', resize)
    start()

    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', resize)
    }
  }, [reduce])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.06]"
    />
  )
}
