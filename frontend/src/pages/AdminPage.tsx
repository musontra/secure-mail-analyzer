import { Link } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

// NOT: Bu sayfa şimdilik STATİK tasarım. Gerçek istatistik endpoint'i
// Adım 8'de eklenecek; aşağıdaki tüm veriler placeholder.
const RISK_DISTRIBUTION = [
  { name: 'Düşük', value: 45, color: '#2dd4bf' },
  { name: 'Orta', value: 30, color: '#fbbf24' },
  { name: 'Yüksek', value: 25, color: '#f87171' },
]

const TOP_SIGNALS = [
  { label: 'Aciliyet dili', percent: 84 },
  { label: 'Marka taklidi', percent: 72 },
  { label: 'HTTP kullanımı', percent: 65 },
  { label: 'Hassas bilgi talebi', percent: 48 },
  { label: 'Kısaltılmış link', percent: 39 },
  { label: 'Şüpheli ek', percent: 33 },
]

const RECENT_ANALYSES = [
  { content: 'Fatura_Odeme_Hatirlatmasi.pdf', level: 'Yüksek', levelClass: 'bg-red-400/10 text-red-400', score: '92/100', date: 'Bugün, 14:20' },
  { content: 'api-v1-secure-auth.xyz/login', level: 'Yüksek', levelClass: 'bg-red-400/10 text-red-400', score: '86/100', date: 'Bugün, 13:45' },
  { content: 'Musteri_Veri_Export_Q4.csv', level: 'Düşük', levelClass: 'bg-emerald-400/10 text-emerald-400', score: '12/100', date: 'Bugün, 11:10' },
  { content: 'Yonetim_Toplantisi_Notlari.docx', level: 'Orta', levelClass: 'bg-amber-400/10 text-amber-400', score: '46/100', date: 'Dün, 18:55' },
  { content: 'System_Log_Security_Report.txt', level: 'Düşük', levelClass: 'bg-emerald-400/10 text-emerald-400', score: '05/100', date: 'Dün, 17:30' },
]

// Yönetim paneli: özet kartlar + risk dağılımı + en sık sinyaller (statik)
function AdminPage() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sistem güvenliği ve analiz metriklerine genel bakış.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn-ghost text-sm">Rapor Al</button>
          <Link to="/" className="btn-primary text-sm">Yeni Analiz</Link>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest text-slate-500">
              TOPLAM ANALİZ
            </span>
            <span className="rounded-full bg-accent-soft/15 px-2 py-0.5 text-xs font-bold text-accent-soft">
              +12%
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold text-white">1.248</p>
          <p className="mt-1 text-xs text-slate-500">geçen aya göre</p>
        </div>

        <div className="glass-card p-5">
          <span className="text-[11px] font-semibold tracking-widest text-slate-500">
            YÜKSEK RİSKLİ
          </span>
          <p className="mt-3 text-4xl font-bold text-red-400">312</p>
          <p className="mt-1 text-xs text-slate-500">%25 toplam içindeki pay</p>
        </div>

        <div className="glass-card border-accent/30 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest text-slate-500">
              BUGÜNKÜ ANALİZLER
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              CANLI
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold text-white">42</p>
          <p className="mt-1 text-xs text-slate-500">Veriler anlık güncelleniyor</p>
        </div>
      </div>

      {/* Grafikler */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Donut: risk dağılımı */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white">Risk Dağılımı</h3>
          <div className="relative mx-auto h-56 w-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={RISK_DISTRIBUTION}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  stroke="none"
                >
                  {RISK_DISTRIBUTION.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Donut ortası */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">1.2k</span>
              <span className="text-xs text-slate-500">Vaka</span>
            </div>
          </div>
          <div className="flex justify-center gap-8 text-center text-xs">
            {RISK_DISTRIBUTION.map((entry) => (
              <div key={entry.name}>
                <p className="font-semibold" style={{ color: entry.color }}>
                  {entry.name}
                </p>
                <p className="text-slate-500">%{entry.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Yatay barlar: en sık sinyaller */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white">En Sık Görülen Sinyaller</h3>
          <div className="mt-5 space-y-4">
            {TOP_SIGNALS.map((signal) => (
              <div key={signal.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">{signal.label}</span>
                  <span className="text-slate-500">{signal.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500"
                    style={{ width: `${signal.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Son analizler (statik placeholder) */}
      <div className="glass-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="font-semibold text-white">Son Analizler</h3>
          <Link to="/gecmis" className="text-xs font-semibold text-accent hover:text-cyan-300">
            Tümünü Gör
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-t border-b border-white/10 text-[11px] font-semibold tracking-widest text-slate-500">
              <th className="px-5 py-3">İÇERİK</th>
              <th className="px-5 py-3">RİSK</th>
              <th className="px-5 py-3">SKOR</th>
              <th className="px-5 py-3">TARİH</th>
            </tr>
          </thead>
          <tbody>
            {RECENT_ANALYSES.map((row) => (
              <tr key={row.content} className="border-b border-white/5 transition hover:bg-white/5">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-300">{row.content}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${row.levelClass}`}>
                    {row.level}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-300">{row.score}</td>
                <td className="px-5 py-3.5 text-slate-500">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPage
