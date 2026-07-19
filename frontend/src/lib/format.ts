import type { RiskLevel } from '../types'

// Risk seviyesine bağlı tüm görsel/metinsel karşılıklar tek yerde
export const RISK_META: Record<
  RiskLevel,
  {
    label: string
    badgeClass: string
    textClass: string
    hex: string
    verdict: string
    verdictSub: string
  }
> = {
  low: {
    label: 'DÜŞÜK',
    badgeClass: 'bg-risk-low/10 text-risk-low',
    textClass: 'text-risk-low',
    hex: '#00e676', // --color-risk-low ile aynı (SVG gauge/donut için somut değer)
    verdict: 'İçerik Güvenli Görünüyor',
    verdictSub:
      'Belirgin bir risk sinyali tespit edilmedi. Yine de tanımadığınız gönderenlerden gelen içeriklere karşı her zaman dikkatli olun.',
  },
  medium: {
    label: 'ORTA',
    badgeClass: 'bg-risk-medium/10 text-risk-medium',
    textClass: 'text-risk-medium',
    hex: '#ffc400', // --color-risk-medium ile aynı
    verdict: 'Şüpheli İçerik',
    verdictSub:
      'Bu içerikte dikkat gerektiren sinyaller tespit edildi. Bağlantılara tıklamadan ve herhangi bir bilgi paylaşmadan önce iki kez düşünün.',
  },
  high: {
    label: 'YÜKSEK',
    badgeClass: 'bg-risk-high/10 text-risk-high',
    textClass: 'text-risk-high',
    hex: '#ff5252', // --color-risk-high ile aynı
    verdict: 'Tehdit Tespit Edildi',
    verdictSub:
      'Bu içerik yüksek ihtimalle bir kimlik avı (phishing) girişimidir. Hassas bilgilerinizi paylaşmayın, bağlantılara tıklamayın.',
  },
}

// Göreli tarih: "az önce", "5 dakika önce", "2 saat önce", "Dün", "3 gün önce"...
export function formatRelativeTime(isoDate: string): string {
  const diffMinutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60_000)

  if (diffMinutes < 1) return 'az önce'
  if (diffMinutes < 60) return `${diffMinutes} dakika önce`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} saat önce`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Dün'
  if (diffDays < 7) return `${diffDays} gün önce`

  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 5) return `${diffWeeks} hafta önce`

  return new Date(isoDate).toLocaleDateString('tr-TR')
}

// İçerik önizlemesi: ilk N karakter + üç nokta
export function truncate(text: string, maxLength = 60): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}…`
}
