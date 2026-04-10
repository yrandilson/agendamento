import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isAdminUser } from '../lib/adminAuth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function entrar() {
    setErro('')

    if (!email || !senha) {
      setErro('Informe e-mail e senha do admin')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error || !data?.user) {
      setErro('Nao foi possivel entrar. Verifique as credenciais.')
      setLoading(false)
      return
    }

    const permitido = await isAdminUser(data.user)

    if (!permitido) {
      await supabase.auth.signOut()
      setErro('Usuario sem permissao de administrador.')
      setLoading(false)
      return
    }

    sessionStorage.setItem('admin_ok', '1')
    sessionStorage.setItem('admin_uid', data.user.id)
    setLoading(false)
    navigate('/admin/painel')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-700 mb-6 text-center">🔐 Painel Admin</h1>
        <input type="email" placeholder="E-mail admin"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          className="w-full border-2 rounded-xl p-3 mb-3 focus:border-indigo-500 outline-none" />
        <input type="password" placeholder="Senha"
          value={senha} onChange={e => setSenha(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && entrar()}
          className="w-full border-2 rounded-xl p-3 mb-3 focus:border-indigo-500 outline-none" />
        {erro && <p className="text-red-500 text-sm mb-2">{erro}</p>}
        <button onClick={entrar} disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-60">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}
