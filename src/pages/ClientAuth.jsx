import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ClientAuth() {
  const [modoCadastro, setModoCadastro] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const navigate = useNavigate()

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!email || !senha) {
      setErro('Preencha e-mail e senha')
      return
    }

    setLoading(true)

    if (modoCadastro) {
      const { error } = await supabase.auth.signUp({ email, password: senha })
      if (error) {
        setErro(error.message)
        setLoading(false)
        return
      }
      setSucesso('Conta criada. Se necessário, confirme seu e-mail e faça login.')
      setModoCadastro(false)
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro('Nao foi possivel entrar. Verifique seus dados.')
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/agendar')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.2),transparent_45%),radial-gradient(circle_at_80%_5%,rgba(99,102,241,0.2),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.18),transparent_40%)]" />

      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-slate-200">
        <h1 className="text-2xl font-black text-slate-800 mb-2 text-center">
          {modoCadastro ? 'Criar conta do cliente' : 'Entrar como cliente'}
        </h1>
        <p className="text-sm text-slate-500 text-center mb-6">
          {modoCadastro
            ? 'Use e-mail e senha para criar sua conta.'
            : 'Entre para confirmar seus agendamentos com seguranca.'}
        </p>

        <form onSubmit={enviar} className="space-y-3">
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border-2 rounded-xl p-3 focus:border-cyan-500 outline-none"
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="w-full border-2 rounded-xl p-3 focus:border-cyan-500 outline-none"
          />

          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm">{sucesso}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Processando...' : modoCadastro ? 'Criar conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            onClick={() => {
              setModoCadastro(!modoCadastro)
              setErro('')
              setSucesso('')
            }}
            className="text-cyan-700 font-semibold hover:underline"
          >
            {modoCadastro ? 'Ja tenho conta' : 'Ainda nao tenho conta'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-slate-500 hover:underline">
            Voltar para pagina inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
