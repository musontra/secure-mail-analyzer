import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { RequireAdmin, RequireAuth } from './components/RequireAuth'
import AnalyzePage from './pages/AnalyzePage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Rota haritası: login/kayıt herkese açık; diğer sayfalar giriş ister,
// admin sayfası ayrıca admin rolü ister
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/kayit" element={<RegisterPage />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<AnalyzePage />} />
        <Route path="/sonuc/:id" element={<ResultPage />} />
        <Route path="/gecmis" element={<HistoryPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
