import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerRequest } from '../lib/api'

// Kayıt sayfası: login ile aynı kalıptan basit form
function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const message = await registerRequest(email.trim(), password)
      // Başarılı kayıt: login sayfasına bilgi mesajıyla dön
      navigate('/login', { state: { message } })
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
    <div className="flex min-h-screen flex-col bg-surface font-sans text-fg-soft">
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="glass-card w-full max-w-sm p-8">
          <div className="flex flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-accent-soft">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="mt-3 text-sm font-extrabold tracking-widest text-fg">
              SECURE<span className="text-accent-soft">LYTIX</span>
            </span>
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold text-fg">Kayıt Ol</h1>
          <p className="mt-1 text-center text-sm text-fg-soft">
            Ücretsiz hesap oluşturun, analizlerinizi saklayın.
          </p>

          <form className="mt-6" onSubmit={handleSubmit}>
            <label className="text-[11px] font-semibold tracking-widest text-fg-dim">
              E-POSTA
            </label>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-accent/15 bg-black/30 px-3 py-2.5 text-sm outline-none transition placeholder:text-fg-dim focus:border-accent-soft"
              placeholder="ornek@eposta.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="mt-4 block text-[11px] font-semibold tracking-widest text-fg-dim">
              ŞİFRE
            </label>
            <input
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-accent/15 bg-black/30 px-3 py-2.5 text-sm outline-none transition placeholder:text-fg-dim focus:border-accent-soft"
              placeholder="En az 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && <p className="mt-3 text-sm text-risk-high">{error}</p>}

            <button type="submit" className="btn-primary mt-5 w-full justify-center" disabled={isLoading}>
              {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-fg-soft">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-semibold text-accent hover:text-accent">
              Giriş yapın
            </Link>
          </p>
        </div>
      </main>

      <footer className="border-t border-accent/15 py-5 text-center text-xs text-fg-dim">
        © 2026 Securelytix Security Analysis. Tüm hakları saklıdır.
      </footer>
    </div>
  )
}

export default RegisterPage
