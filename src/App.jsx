import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Booking from './pages/Booking'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import ClientAuth from './pages/ClientAuth'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/agendar" element={<Booking />} />
      <Route path="/cliente" element={<ClientAuth />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/painel" element={<Admin />} />
    </Routes>
  )
}
