import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import AnalyzePage from './pages/AnalyzePage'
import ResultPage from './pages/ResultPage'
import HistoryPage from './pages/HistoryPage'
import AdminPage from './pages/AdminPage'

// Rota haritası: tüm sayfalar ortak Layout'un (navbar+footer) içinde açılır.
// Login sayfası JWT adımında eklenecek.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<AnalyzePage />} />
        <Route path="/sonuc/:id" element={<ResultPage />} />
        <Route path="/gecmis" element={<HistoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}

export default App
