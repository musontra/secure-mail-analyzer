import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { getAdminStats } from '../lib/api'
import { RISK_META, formatRelativeTime } from '../lib/format'
import RiskBadge from '../components/RiskBadge'
import type { AdminStats } from '../types'

// Yönetim paneli: tüm veriler GET /api/admin/stats endpoint'inden gelir
function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'İstatistikler yüklenemedi.'),
      )
  }, [])

  if (error) {
    return <p className="mt-10 text-center text-red-400">{error}</p>
  }

  if (!stats) {
    return <p className="mt-10 text-center text-slate-400">İstatistikler yükleniyor...</p>
  }

  const { riskDistribution: dist } = stats
  const hasData = stats.totalAnalyses > 0

  // Donut verisi: adetler sıfırken recharts'a boş dilim göndermeyiz
  const donutData = [
    { name: 'Düşük', value: dist.low, percent: dist.lowPercent, color: RISK_META.low.hex },
    { name: 'Orta', value: dist.medium, percent: dist.mediumPercent, color: RISK_META.medium.hex },
    { name: 'Yüksek', value: dist.high, percent: dist.highPercent, color: RISK_META.high.hex },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Yönetim Paneli</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sistem güvenliği ve analiz metriklerine genel bakış.
          </p>
        </div>
        <Link to="/" className="btn-primary text-sm">Yeni Analiz</Link>
      </div>

      {/* Özet kartlar */}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="glass-card p-5">
          <span className="text-[11px] font-semibold tracking-widest text-slate-500">
            TOPLAM ANALİZ
          </span>
          <p className="mt-3 text-4xl font-bold text-white">
            {stats.totalAnalyses.toLocaleString('tr-TR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">tüm zamanlar</p>
        </div>

        <div className="glass-card p-5">
          <span className="text-[11px] font-semibold tracking-widest text-slate-500">
            YÜKSEK RİSKLİ
          </span>
          <p className="mt-3 text-4xl font-bold text-red-400">
            {dist.high.toLocaleString('tr-TR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">%{dist.highPercent} toplam içindeki pay</p>
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
          <p className="mt-3 text-4xl font-bold text-white">
            {stats.todayAnalyses.toLocaleString('tr-TR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">UTC gününe göre</p>
        </div>
      </div>

      {/* Grafikler */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Donut: risk dağılımı */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white">Risk Dağılımı</h3>
          {hasData ? (
            <>
              <div className="relative mx-auto h-56 w-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {stats.totalAnalyses.toLocaleString('tr-TR')}
                  </span>
                  <span className="text-xs text-slate-500">Vaka</span>
                </div>
              </div>
              <div className="flex justify-center gap-8 text-center text-xs">
                {donutData.map((entry) => (
                  <div key={entry.name}>
                    <p className="font-semibold" style={{ color: entry.color }}>
                      {entry.name}
                    </p>
                    <p className="text-slate-500">%{entry.percent}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="flex h-56 items-center justify-center text-sm text-slate-500">
              Henüz analiz yapılmadı.
            </p>
          )}
        </div>

        {/* Yatay barlar: en sık sinyaller */}
        <div className="glass-card p-5">
          <h3 className="font-semibold text-white">En Sık Görülen Sinyaller</h3>
          {stats.topSignals.length === 0 ? (
            <p className="flex h-56 items-center justify-center text-sm text-slate-500">
              Henüz sinyal verisi yok.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              {stats.topSignals.map((signal) => (
                <div key={signal.code}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-300">{signal.title}</span>
                    <span className="text-slate-500">
                      {signal.count} analiz · %{signal.percent}
                    </span>
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
          )}
        </div>
      </div>

      {/* Son analizler: satıra tıklayınca sonuç sayfası açılır */}
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
            {stats.recentAnalyses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  Henüz analiz yapılmadı.
                </td>
              </tr>
            ) : (
              stats.recentAnalyses.map((row) => (
                <tr
                  key={row.id}
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/5"
                  onClick={() => navigate(`/sonuc/${row.id}`)}
                >
                  <td className="max-w-md px-5 py-3.5 text-slate-300">{row.preview}</td>
                  <td className="px-5 py-3.5">
                    <RiskBadge level={row.riskLevel} />
                  </td>
                  <td className={`px-5 py-3.5 font-mono font-bold ${RISK_META[row.riskLevel].textClass}`}>
                    {row.riskScore}/100
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formatRelativeTime(row.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminPage
