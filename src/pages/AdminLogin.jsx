import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  function entrar() {
    const correta = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
    if (senha === correta) {
      sessionStorage.setItem('admin_ok', '1')
      navigate('/admin/painel')
    } else {
      setErro('Senha incorreta')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-700 mb-6 text-center">🔐 Painel Admin</h1>
        <input type="password" placeholder="Senha"
          value={senha} onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          className="w-full border-2 rounded-xl p-3 mb-3 focus:border-indigo-500 outline-none" />
        {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}
        <button onClick={entrar}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">
          Entrar
        </button>
      </div>
    </div>
  )
}
