import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { loginRequest } from '../lib/api'
import { useAuth } from '../lib/auth'

// Giriş sayfası (docs/design/login.png tasarımına sadık)
function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  // Kayıt sonrası yönlendirmede gelen bilgi mesajı
  const infoMessage = (useLocation().state as { message?: string } | null)?.message

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const user = await loginRequest(email.trim(), password)
      login(user)
      navigate('/')
    } catch (err: unknown) {
      setError(
        err instanceof TypeError
          ? 'Sunucuya ulaşılamadı. Backend çalışıyor mu?'
          : err instanceof Error
            ? err.message
            : 'Beklenmeyen bir hata oluştu.',
      )
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-surface font-sans text-slate-200">
      {/* Dekoratif ikonlar (tasarımdaki köşe süslemeleri) */}
      <svg className="absolute left-10 top-10 text-accent-soft/60" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" strokeLinejoin="round" />
      </svg>
      <svg className="absolute bottom-16 right-14 text-accent/60" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 018 0v3" />
        <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      </svg>

      <main className="flex flex-1 items-center justify-center px-6">
        <div className="glass-card w-full max-w-sm p-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-accent-soft">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="mt-3 text-sm font-extrabold tracking-widest text-white">
              SECURE<span className="text-accent-soft">LYTIX</span>
            </span>
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold text-white">Giriş Yap</h1>
          <p className="mt-1 text-center text-sm text-slate-400">
            Analiz paneline erişmek için bilgilerinizi girin.
          </p>

          {infoMessage && <p className="mt-4 text-center text-sm text-emerald-400">{infoMessage}</p>}

          <form className="mt-6" onSubmit={handleSubmit}>
            <label className="text-[11px] font-semibold tracking-widest text-slate-500">
              E-POSTA
            </label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-accent-soft"
              placeholder="ornek@securelytix.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="mt-4 flex items-end justify-between">
              <label className="text-[11px] font-semibold tracking-widest text-slate-500">
                ŞİFRE
              </label>
              <span className="cursor-pointer text-xs font-semibold text-accent">
                Şifremi Unuttum
              </span>
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 pr-10 text-sm outline-none transition placeholder:text-slate-600 focus:border-accent-soft"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {/* Şifre göster/gizle */}
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Şifreyi göster/gizle"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" className="accent-cyan-500" />
              Beni hatırla
            </label>

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

            <button type="submit" className="btn-primary mt-5 w-full justify-center" disabled={isLoading}>
              {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Hesabınız yok mu?{' '}
            <Link to="/kayit" className="font-semibold text-accent hover:text-cyan-300">
              Kayıt olun
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
        © 2026 Securelytix Security Analysis. Tüm hakları saklıdır.
      </footer>
    </div>
  )
}

export default LoginPage
