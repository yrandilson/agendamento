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
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-700 mb-2 text-center">
          {modoCadastro ? 'Criar conta do cliente' : 'Entrar como cliente'}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
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
            className="w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none"
          />
          <input
            type="password"
            placeholder="Sua senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none"
          />

          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm">{sucesso}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
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
            className="text-indigo-600 font-semibold hover:underline"
          >
            {modoCadastro ? 'Ja tenho conta' : 'Ainda nao tenho conta'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            Voltar para agendamento
          </Link>
        </div>
      </div>
    </div>
  )
}
