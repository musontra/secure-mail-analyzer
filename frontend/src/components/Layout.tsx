import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

// Navbar link stili: aktif sayfa cyan, diğerleri soluk
function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `text-sm font-medium transition ${
    isActive ? 'text-accent' : 'text-fg-soft hover:text-fg'
  }`
}

// Tüm sayfaları saran ortak çerçeve: navbar + içerik (Outlet) + footer
function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface font-sans text-fg-soft">
      <header className="sticky top-0 z-10 border-b border-accent/15 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft/15 text-accent-soft">
              {/* Kalkan ikonu */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l8 3v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V6l8-3z" strokeLinejoin="round" />
                <path d="M8.5 11.5l2.5 2.5 4.5-4.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-lg font-extrabold tracking-widest text-fg">
              SECURE<span className="text-accent-soft">LYTIX</span>
            </span>
          </NavLink>

          {/* Sayfa linkleri */}
          <nav className="flex items-center gap-8">
            <NavLink to="/" className={navLinkClass} end>
              Analiz
            </NavLink>
            <NavLink to="/gecmis" className={navLinkClass}>
              Geçmiş
            </NavLink>
            {/* Admin linki sadece admin rolünde görünür */}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
          </nav>

          {/* Sağ taraf: oturumdaki kullanıcı + çıkış */}
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-fg-soft sm:block">{user?.email}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-400 text-xs font-bold uppercase text-slate-950">
              {user?.email.slice(0, 2)}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-accent/15 px-3 py-1.5 text-xs font-semibold text-fg-soft transition hover:bg-white/10 hover:text-fg"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Aktif rotanın sayfası buraya çizilir */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-accent/15">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 text-xs text-fg-dim">
          <span>© 2026 Securelytix Security Analysis. Tüm hakları saklıdır.</span>
          <div className="flex gap-6">
            <span className="cursor-pointer hover:text-fg-soft">Gizlilik Politikası</span>
            <span className="cursor-pointer hover:text-fg-soft">Kullanım Şartları</span>
            <span className="cursor-pointer hover:text-fg-soft">Destek</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
