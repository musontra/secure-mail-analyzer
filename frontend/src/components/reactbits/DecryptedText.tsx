import { useEffect, useState } from 'react'
import { useAnims } from '../../lib/anims'

// react-bits "DecryptedText" esintili, repoya kopyalanmış bileşen (npm bağımlılığı değil).
// Karakterler rastgele başlar, soldan sağa doğru metne oturur. Bir kez çalışır (döngü yok).
// Renk miras alınır (accent token'ı dışarıdan className ile gelir; sabit renk yazılmaz).
const GLYPHS = '!<>-_\/[]{}=+*^?#0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

interface DecryptedTextProps {
  text: string
  className?: string
  speed?: number // karakter başına ms
}

export default function DecryptedText({ text, className, speed = 45 }: DecryptedTextProps) {
  const { reduce } = useAnims()
  const [display, setDisplay] = useState(() => (reduce ? text : ''))

  useEffect(() => {
    // reduced-motion: anında son metin, animasyon yok
    if (reduce) {
      setDisplay(text)
      return
    }
    let revealed = 0
    const id = setInterval(() => {
      revealed += 1
      const out = text
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' '
          if (i < revealed) return ch
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        })
        .join('')
      setDisplay(out)
      if (revealed >= text.length) {
        clearInterval(id)
        setDisplay(text)
      }
    }, speed)
    return () => clearInterval(id)
  }, [text, speed, reduce])

  // aria-label: ekran okuyucular her zaman doğru metni okur
  return (
    <span className={className} aria-label={text}>
      {display}
    </span>
  )
}
