import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function perfilKey(userId) {
  return `cliente_perfil_${userId}`
}

function parseAgendamentoDataHora(item) {
  return new Date(`${item.data}T${item.horario}:00`)
}

function salvarRascunhoReagendamento(item) {
  localStorage.setItem(
    'cliente_reagendar',
    JSON.stringify({
      servico_id: item.servico_id,
      servico_nome: item.servico_nome
    })
  )
}

export default function ClientAccount() {
  const [authUser, setAuthUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [erro, setErro] = useState('')
  const [msg, setMsg] = useState('')
  const [perfil, setPerfil] = useState({ nome: '', telefone: '' })
  const [agendamentos, setAgendamentos] = useState([])
  const [abaAtiva, setAbaAtiva] = useState('proximos') // 'proximos', 'historico'
  const navigate = useNavigate()

  async function carregarPerfilCliente(user) {
    const { data, error } = await supabase
      .from('clientes')
      .select('nome, telefone')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!error && data) {
      setPerfil({ nome: data.nome || '', telefone: data.telefone || '' })
      return
    }

    const salvo = localStorage.getItem(perfilKey(user.id))
    if (salvo) {
      try {
        const dados = JSON.parse(salvo)
        setPerfil({ nome: dados.nome || '', telefone: dados.telefone || '' })
      } catch {
        setPerfil({ nome: '', telefone: '' })
      }
    }
  }

  useEffect(() => {
    let ativo = true

    async function init() {
      const { data } = await supabase.auth.getUser()
      if (!ativo) return
      const user = data?.user || null
      if (!user) {
        navigate('/cliente')
        return
      }

      setAuthUser(user)
      await carregarPerfilCliente(user)
      setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null
      if (!user) {
        navigate('/cliente')
      } else {
        setAuthUser(user)
        await carregarPerfilCliente(user)
      }
    })

    return () => {
      ativo = false
      listener.subscription.unsubscribe()
    }
  }, [navigate])

  useEffect(() => {
    if (!authUser) {
      setAgendamentos([])
      return
    }
    carregarHistorico(authUser.id, perfil.telefone)
  }, [authUser, perfil.telefone])

  async function carregarHistorico(userId, telefoneFallback) {
    setCarregandoHistorico(true)
    setErro('')

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('cliente_user_id', userId)
      .order('data', { ascending: false })
      .order('horario', { ascending: false })

    // Fallback de compatibilidade para dados antigos sem cliente_user_id.
    if (error && telefoneFallback) {
      const { data: dataOld, error: errorOld } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('telefone_cliente', telefoneFallback)
        .order('data', { ascending: false })
        .order('horario', { ascending: false })

      if (!errorOld) {
        setAgendamentos(dataOld || [])
        setCarregandoHistorico(false)
        return
      }
    }

    if (error) {
      setErro('Nao foi possivel carregar o historico do cliente.')
      setCarregandoHistorico(false)
      return
    }

    setAgendamentos(data || [])
    setCarregandoHistorico(false)
  }

  async function salvarPerfil() {
    if (!authUser) return
    if (!perfil.nome || !perfil.telefone) {
      setErro('Preencha nome e telefone para salvar o perfil.')
      return
    }

    setSalvando(true)
    setErro('')
    setMsg('')

    await supabase.from('clientes').upsert({
      user_id: authUser.id,
      email: authUser.email,
      nome: perfil.nome,
      telefone: perfil.telefone,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

    localStorage.setItem(perfilKey(authUser.id), JSON.stringify(perfil))

    await carregarHistorico(authUser.id, perfil.telefone)
    setSalvando(false)
    setMsg('Perfil salvo com sucesso.')
  }

  async function cancelarAgendamento(id) {
    if (!confirm('Deseja cancelar este agendamento?')) return
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    if (authUser) {
      await carregarHistorico(authUser.id, perfil.telefone)
    }
  }

  const agora = new Date()
  const proximos = useMemo(
    () => agendamentos.filter(item => parseAgendamentoDataHora(item) >= agora && item.status !== 'cancelado'),
    [agendamentos, agora]
  )
  const historico = useMemo(
    () => agendamentos.filter(item => parseAgendamentoDataHora(item) < agora || item.status === 'cancelado'),
    [agendamentos, agora]
  )

  const totalCancelados = agendamentos.filter(item => item.status === 'cancelado').length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Carregando conta...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_35%),radial-gradient(circle_at_85%_5%,#cffafe,transparent_35%),#f8fafc] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 to-cyan-900 text-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Minha Conta</h1>
              <p className="text-cyan-100 text-sm mt-1">Gerencie seus dados e acompanhe seus agendamentos.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="px-4 py-2 rounded-xl bg-white/15 border border-white/20 text-white font-semibold hover:bg-white/25">
                Voltar para inicio
              </Link>
              <Link to="/agendar" className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">
                Novo agendamento
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/cliente')
                }}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-semibold hover:bg-red-100"
              >
                Sair
              </button>
            </div>
          </div>

          <p className="text-xs text-cyan-100/90 mt-4">Conta: {authUser?.email}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-black text-slate-800">{agendamentos.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-slate-500">Proximos</p>
            <p className="text-2xl font-black text-cyan-700">{proximos.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-slate-500">Historico</p>
            <p className="text-2xl font-black text-indigo-700">{historico.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-slate-500">Cancelados</p>
            <p className="text-2xl font-black text-red-600">{totalCancelados}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl shadow p-6 xl:col-span-1 h-fit">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Perfil do cliente</h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={perfil.nome}
                onChange={e => setPerfil({ ...perfil, nome: e.target.value })}
                className="w-full border-2 rounded-xl p-3 focus:border-cyan-500 outline-none"
              />
              <input
                type="tel"
                placeholder="WhatsApp com DDD"
                value={perfil.telefone}
                onChange={e => setPerfil({ ...perfil, telefone: e.target.value })}
                className="w-full border-2 rounded-xl p-3 focus:border-cyan-500 outline-none"
              />

              {erro && <p className="text-sm text-red-500">{erro}</p>}
              {msg && <p className="text-sm text-green-600">{msg}</p>}

              <button
                onClick={salvarPerfil}
                disabled={salvando}
                className="w-full bg-cyan-500 text-slate-900 rounded-xl py-3 font-black hover:bg-cyan-400 disabled:opacity-60"
              >
                {salvando ? 'Salvando...' : 'Salvar perfil'}
              </button>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow p-3 flex gap-2">
              <button
                onClick={() => setAbaAtiva('proximos')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  abaAtiva === 'proximos' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Proximos
              </button>
              <button
                onClick={() => setAbaAtiva('historico')}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  abaAtiva === 'historico' ? 'bg-cyan-500 text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Historico
              </button>
            </div>

            {abaAtiva === 'proximos' && (
            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Proximos agendamentos</h2>
              {carregandoHistorico ? (
                <p className="text-slate-400 text-sm">Carregando...</p>
              ) : proximos.length === 0 ? (
                <p className="text-slate-400 text-sm">Nenhum agendamento futuro encontrado para este telefone.</p>
              ) : (
                <div className="space-y-3">
                  {proximos.map(item => (
                    <div key={item.id} className="border rounded-xl p-4 flex justify-between items-start gap-3">
                      <div>
                        <p className="font-bold text-slate-800">{item.servico_nome}</p>
                        <p className="text-sm text-slate-500">
                          {format(parseAgendamentoDataHora(item), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Status: {item.status}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            salvarRascunhoReagendamento(item)
                            navigate('/agendar')
                          }}
                          className="text-xs px-3 py-1 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-semibold"
                        >
                          Reagendar
                        </button>
                        {item.status === 'confirmado' && (
                          <button
                            onClick={() => cancelarAgendamento(item.id)}
                            className="text-xs px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {abaAtiva === 'historico' && (
            <div className="bg-white rounded-3xl shadow p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Historico</h2>
              {historico.length === 0 ? (
                <p className="text-slate-400 text-sm">Sem historico ainda.</p>
              ) : (
                <div className="space-y-3">
                  {historico.slice(0, 20).map(item => (
                    <div key={item.id} className="border rounded-xl p-4 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800">{item.servico_nome}</p>
                        <p className="text-sm text-slate-500">
                          {format(parseAgendamentoDataHora(item), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Status: {item.status}</p>
                      </div>
                      <button
                        onClick={() => {
                          salvarRascunhoReagendamento(item)
                          navigate('/agendar')
                        }}
                        className="text-xs px-3 py-1 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 font-semibold"
                      >
                        Agendar de novo
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}