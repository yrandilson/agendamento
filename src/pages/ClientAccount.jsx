import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const HORARIOS_RAPIDOS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

// Ícones SVG simples
const IconEye = () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const IconCalendar = () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const IconPhone = () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
const IconChat = () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
const IconCog = () => <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>

function gerarCalendarioGrid(data) {
  const primeiroDia = startOfMonth(data)
  const ultimoDia = endOfMonth(data)
  const diasMes = eachDayOfInterval({ start: primeiroDia, end: ultimoDia })
  const semanaInicio = primeiroDia.getDay()
  const diasPreenchimento = Array(semanaInicio).fill(null)
  return [...diasPreenchimento, ...diasMes]
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

function iniciaisUsuario(nome, email) {
  const fonte = (nome || email || '').trim()
  if (!fonte) return 'CL'
  const partes = fonte.split(/\s+/).filter(Boolean)
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0] || ''}${partes[1][0] || ''}`.toUpperCase()
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
  const [secaoAtiva, setSecaoAtiva] = useState('visao-geral')
  const [menuUsuarioAberto, setMenuUsuarioAberto] = useState(false)
  const [dataRapida, setDataRapida] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [horarioRapido, setHorarioRapido] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [chatMensagens, setChatMensagens] = useState([
    { id: 1, autor: 'suporte', texto: 'Olá. Sou o assistente da agenda. Posso ajudar com reagendamento, cancelamento e dúvidas.' }
  ])
  const [mesCalendario, setMesCalendario] = useState(new Date())
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

    setPerfil({ nome: '', telefone: '' })
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
    carregarHistorico(authUser.id)
  }, [authUser])

  async function carregarHistorico(userId) {
    setCarregandoHistorico(true)
    setErro('')

    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('cliente_user_id', userId)
      .order('data', { ascending: false })
      .order('horario', { ascending: false })

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

    await carregarHistorico(authUser.id)
    setSalvando(false)
    setMsg('Perfil salvo com sucesso.')
  }

  async function cancelarAgendamento(id) {
    if (!confirm('Deseja cancelar este agendamento?')) return
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    if (authUser) {
      await carregarHistorico(authUser.id)
    }
  }

  function abrirAgendamentoRapido() {
    if (!dataRapida) {
      setErro('Selecione uma data para continuar.')
      return
    }

    localStorage.setItem('cliente_agenda_rapida', JSON.stringify({ data: dataRapida, horario: horarioRapido || null }))
    navigate('/agendar')
  }

  function enviarMensagemChat() {
    const texto = chatInput.trim()
    if (!texto) return

    const baseId = Date.now()
    setChatMensagens(prev => [
      ...prev,
      { id: baseId, autor: 'cliente', texto }
    ])
    setChatInput('')

    setTimeout(() => {
      setChatMensagens(prev => [
        ...prev,
        { id: baseId + 1, autor: 'suporte', texto: 'Recebemos sua mensagem. Nossa equipe retornará em breve no seu WhatsApp cadastrado.' }
      ])
    }, 350)
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

  const avatarLabel = iniciaisUsuario(perfil.nome, authUser?.email)
  const nomeExibicao = perfil.nome || 'Cliente'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#bfdbfe,transparent_25%),radial-gradient(circle_at_90%_0%,#67e8f9,transparent_22%),radial-gradient(circle_at_50%_100%,#a5b4fc,transparent_30%),#f8fafc] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="relative overflow-visible bg-gradient-to-br from-slate-900 via-cyan-900 to-indigo-900 text-white rounded-3xl shadow-xl p-6 md:p-8 mb-6">
          <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute -bottom-10 right-10 w-40 h-40 rounded-full bg-indigo-300/20 blur-3xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black">Minha Conta</h1>
              <p className="text-cyan-100 text-sm mt-1">Gerencie seus dados, acompanhe seus agendamentos e personalize sua conta.</p>
              <p className="text-xs text-cyan-100/90 mt-3">Conta: {authUser?.email}</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Link to="/" className="px-4 py-2 rounded-xl bg-white/15 border border-white/20 text-white font-semibold hover:bg-white/25">
                Voltar para inicio
              </Link>
              <Link to="/agendar" className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">
                Novo agendamento
              </Link>

              <div className="relative">
                <button
                  onClick={() => setMenuUsuarioAberto(!menuUsuarioAberto)}
                  className="w-11 h-11 rounded-full bg-white/20 border border-white/40 text-white font-black backdrop-blur hover:bg-white/30 transition-all"
                  title="Menu da conta"
                >
                  {avatarLabel}
                </button>

                {menuUsuarioAberto && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-slate-800 shadow-2xl border border-slate-100 p-2 z-20">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-sm">{nomeExibicao}</p>
                      <p className="text-xs text-slate-500 break-all">{authUser?.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setMenuUsuarioAberto(false)
                        document.getElementById('perfil-cliente-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-slate-100"
                    >
                      Configuracoes de perfil
                    </button>
                    <button
                      onClick={() => {
                        setMenuUsuarioAberto(false)
                        setSecaoAtiva('visao-geral')
                        setAbaAtiva('proximos')
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-slate-100"
                    >
                      Proximos agendamentos
                    </button>
                    <button
                      onClick={() => {
                        setMenuUsuarioAberto(false)
                        setSecaoAtiva('visao-geral')
                        setAbaAtiva('historico')
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-slate-100"
                    >
                      Historico
                    </button>
                    <Link
                      to="/agendar"
                      onClick={() => setMenuUsuarioAberto(false)}
                      className="block px-3 py-2 rounded-xl text-sm hover:bg-slate-100"
                    >
                      Novo agendamento
                    </Link>
                    <button
                      onClick={async () => {
                        setMenuUsuarioAberto(false)
                        await supabase.auth.signOut()
                        navigate('/cliente')
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50"
                    >
                      Sair da conta
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-4">
          <aside className="bg-slate-900 text-slate-100 rounded-3xl shadow-xl p-4 h-fit sticky top-4">
            <p className="text-xs uppercase tracking-widest text-cyan-300 mb-3 font-bold">🎯 Dashboard</p>
            <div className="space-y-2">
              {[
                { id: 'visao-geral', label: 'Visao Geral', icon: IconEye },
                { id: 'calendario', label: 'Calendario', icon: IconCalendar },
                { id: 'contatos', label: 'Contatos', icon: IconPhone },
                { id: 'chat', label: 'Chat', icon: IconChat },
                { id: 'configuracoes', label: 'Configuracoes', icon: IconCog }
              ].map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setSecaoAtiva(item.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                      secaoAtiva === item.id 
                        ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-slate-900 scale-105 shadow-lg' 
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:translate-x-1'
                    }`}
                  >
                    <Icon />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </aside>

          <section className="space-y-4 animate-fade-in">
            {secaoAtiva === 'visao-geral' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/95 rounded-2xl shadow p-4 border border-slate-100 hover:shadow-lg hover:scale-105 transition-all group cursor-pointer">
                    <p className="text-xs text-slate-500 group-hover:text-slate-700">📊 Total</p>
                    <p className="text-2xl font-black text-slate-800">{agendamentos.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl shadow p-4 border border-cyan-100 hover:shadow-lg hover:scale-105 transition-all group cursor-pointer">
                    <p className="text-xs text-slate-500 group-hover:text-cyan-700">📅 Proximos</p>
                    <p className="text-2xl font-black text-cyan-700">{proximos.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow p-4 border border-indigo-100 hover:shadow-lg hover:scale-105 transition-all group cursor-pointer">
                    <p className="text-xs text-slate-500 group-hover:text-indigo-700">✅ Historico</p>
                    <p className="text-2xl font-black text-indigo-700">{historico.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl shadow p-4 border border-rose-100 hover:shadow-lg hover:scale-105 transition-all group cursor-pointer">
                    <p className="text-xs text-slate-500 group-hover:text-red-700">❌ Cancelados</p>
                    <p className="text-2xl font-black text-red-600">{totalCancelados}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow p-3 flex gap-2 border border-slate-100">
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
                  <div className="bg-white rounded-3xl shadow p-6 border border-slate-100 animate-fade-in">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">📅 Proximos agendamentos</h2>
                    {carregandoHistorico ? (
                      <p className="text-slate-400 text-sm">Carregando...</p>
                    ) : proximos.length === 0 ? (
                      <p className="text-slate-400 text-sm">Nenhum agendamento futuro encontrado para este telefone.</p>
                    ) : (
                      <div className="space-y-3">
                        {proximos.map((item, idx) => (
                          <div 
                            key={item.id} 
                            className="border-2 border-slate-200 rounded-xl p-4 flex justify-between items-start gap-3 bg-gradient-to-r from-slate-50 to-cyan-50 hover:border-cyan-400 hover:shadow-lg hover:scale-102 transition-all group"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div>
                              <p className="font-bold text-slate-800 group-hover:text-cyan-700">✅ {item.servico_nome}</p>
                              <p className="text-sm text-slate-500">
                                🕐 {format(parseAgendamentoDataHora(item), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">Status: <span className="font-bold text-cyan-600">{item.status}</span></p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  salvarRascunhoReagendamento(item)
                                  navigate('/agendar')
                                }}
                                className="text-xs px-3 py-2 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-bold transition-all hover:scale-105"
                              >
                                🔄 Reagendar
                              </button>
                              {item.status === 'confirmado' && (
                                <button
                                  onClick={() => cancelarAgendamento(item.id)}
                                  className="text-xs px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-bold transition-all hover:scale-105"
                                >
                                  ❌ Cancelar
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
                  <div className="bg-white rounded-3xl shadow p-6 border border-slate-100 animate-fade-in">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">📜 Historico</h2>
                    {historico.length === 0 ? (
                      <p className="text-slate-400 text-sm">Sem historico ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {historico.slice(0, 20).map((item, idx) => (
                          <div 
                            key={item.id} 
                            className="border-2 border-slate-200 rounded-xl p-4 flex items-start justify-between gap-2 bg-gradient-to-r from-slate-50 to-indigo-50 hover:border-indigo-400 hover:shadow-lg hover:scale-102 transition-all group"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <div>
                              <p className="font-semibold text-slate-800 group-hover:text-indigo-700">{item.servico_nome}</p>
                              <p className="text-sm text-slate-500">
                                {format(parseAgendamentoDataHora(item), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">Status: <span className={`font-bold ${item.status === 'cancelado' ? 'text-red-600' : 'text-indigo-600'}`}>{item.status}</span></p>
                            </div>
                            <button
                              onClick={() => {
                                salvarRascunhoReagendamento(item)
                                navigate('/agendar')
                              }}
                              className="text-xs px-3 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-bold transition-all hover:scale-105 whitespace-nowrap"
                            >
                              🆕 Agendar de novo
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {secaoAtiva === 'calendario' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                  <h2 className="text-xl font-black text-slate-800 mb-2">📆 Calendario Mensal</h2>
                  <p className="text-sm text-slate-500 mb-5">Clique em uma data para visualizar horarios disponiveis.</p>

                  <div className="bg-gradient-to-r from-cyan-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                      <button
                        onClick={() => setMesCalendario(subMonths(mesCalendario, 1))}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 font-bold text-slate-700 transition-all"
                      >
                        ← Anterior
                      </button>
                      <h3 className="text-xl font-black text-slate-800">
                        {format(mesCalendario, 'MMMM yyyy', { locale: ptBR })}
                      </h3>
                      <button
                        onClick={() => setMesCalendario(addMonths(mesCalendario, 1))}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 font-bold text-slate-700 transition-all"
                      >
                        Proximo →
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(dia => (
                        <div key={dia} className="aspect-square flex items-center justify-center font-bold text-slate-700 text-sm">
                          {dia}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {gerarCalendarioGrid(mesCalendario).map((dia, idx) => {
                        const ehMeseAtual = dia && isSameMonth(dia, mesCalendario)
                        const ehHoje = dia && isSameDay(dia, new Date())
                        const ehSelecionado = dia && isSameDay(dia, new Date(dataRapida))

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if (dia && ehMeseAtual) {
                                setDataRapida(format(dia, 'yyyy-MM-dd'))
                              }
                            }}
                            disabled={!dia || !ehMeseAtual}
                            className={`aspect-square rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                              !dia || !ehMeseAtual
                                ? 'bg-transparent text-slate-300'
                                : ehSelecionado
                                ? 'bg-cyan-500 text-white scale-110 shadow-lg'
                                : ehHoje
                                ? 'bg-white border-2 border-cyan-500 text-slate-800 hover:bg-cyan-50'
                                : 'bg-white text-slate-700 hover:bg-cyan-100 hover:scale-105 cursor-pointer'
                            }`}
                          >
                            {dia && format(dia, 'd')}
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-6 p-4 bg-white/80 rounded-xl border border-slate-200">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Data selecionada:</p>
                      <div className="flex gap-3 flex-wrap">
                        <div className="px-4 py-2 bg-cyan-100 text-cyan-800 rounded-lg font-bold">
                          📍 {format(new Date(dataRapida), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        {horarioRapido && (
                          <div className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg font-bold">
                            ⏰ {horarioRapido}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                  <h3 className="text-lg font-black text-slate-800 mb-4">⏰ Selecionar Horario</h3>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-6">
                    {HORARIOS_RAPIDOS.map(h => (
                      <button
                        key={h}
                        onClick={() => setHorarioRapido(prev => (prev === h ? '' : h))}
                        className={`px-3 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                          horarioRapido === h
                            ? 'bg-indigo-500 text-white border-indigo-500 scale-110'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={abrirAgendamentoRapido}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black hover:shadow-lg hover:scale-105 transition-all"
                    >
                      ✨ Ir para Agendamento
                    </button>
                    <p className="text-sm text-slate-500 self-center">Data: {dataRapida} {horarioRapido && `• Horario: ${horarioRapido}`}</p>
                  </div>
                </div>
              </div>
            )}

            {secaoAtiva === 'contatos' && (
              <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800 mb-1">📞 Fale com a Gente</h2>
                <p className="text-sm text-slate-500 mb-6">Escolha o seu canal preferido para tirar duvidas e agendar.</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <a href="tel:+5588999999999" className="rounded-2xl border-2 border-slate-200 p-5 hover:border-cyan-400 hover:bg-cyan-50 hover:shadow-lg hover:scale-105 transition-all group">
                    <p className="text-2xl mb-2">☎️</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-700 font-bold">TELEFONE</p>
                    <p className="font-black text-slate-800 text-lg">(88) 99999-9999</p>
                    <p className="text-xs text-slate-400 mt-2">Ligacao rapida</p>
                  </a>
                  <a href="https://wa.me/5588999999999" target="_blank" rel="noreferrer" className="rounded-2xl border-2 border-slate-200 p-5 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-lg hover:scale-105 transition-all group">
                    <p className="text-2xl mb-2">💬</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-700 font-bold">WHATSAPP</p>
                    <p className="font-black text-slate-800 text-lg">Falar agora</p>
                    <p className="text-xs text-slate-400 mt-2">Resposta em minutos</p>
                  </a>
                  <a href="mailto:contato@agendamento.local" className="rounded-2xl border-2 border-slate-200 p-5 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-lg hover:scale-105 transition-all group">
                    <p className="text-2xl mb-2">✉️</p>
                    <p className="text-xs text-slate-500 group-hover:text-slate-700 font-bold">EMAIL</p>
                    <p className="font-black text-slate-800 text-lg">contato@agendamento.local</p>
                    <p className="text-xs text-slate-400 mt-2">Mensagem detalhada</p>
                  </a>
                </div>
              </div>
            )}

            {secaoAtiva === 'chat' && (
              <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800 mb-1">💬 Chat com Suporte</h2>
                <p className="text-sm text-slate-500 mb-4">Canal instantaneo para suas duvidas.</p>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-4 h-72 overflow-y-auto space-y-3">
                  {chatMensagens.map(msgItem => (
                    <div key={msgItem.id} className={`max-w-[85%] rounded-xl px-4 py-3 text-sm animate-pulse-once ${msgItem.autor === 'cliente' ? 'ml-auto bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 shadow-sm'}`}>
                      <p className="break-words">{msgItem.texto}</p>
                      <p className="text-xs mt-1 opacity-70">{format(new Date(), 'HH:mm')}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarMensagemChat()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 border-2 border-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none focus:bg-cyan-50 transition-all"
                  />
                  <button onClick={enviarMensagemChat} className="px-6 py-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold hover:shadow-lg hover:scale-105 transition-all">
                    📤 Enviar
                  </button>
                </div>
              </div>
            )}

            {secaoAtiva === 'configuracoes' && (
              <div id="perfil-cliente-card" className="bg-white rounded-3xl shadow p-6 border border-slate-100 animate-fade-in">
                <h2 className="text-xl font-black text-slate-800 mb-2">⚙️ Configuracoes de Perfil</h2>
                <p className="text-sm text-slate-500 mb-6">Mantenha suas informacoes atualizadas para melhor atendimento.</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                      👤 Nome Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Seu nome"
                      value={perfil.nome}
                      onChange={e => setPerfil({ ...perfil, nome: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-cyan-500 focus:bg-cyan-50 outline-none transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-2">
                      📱 WhatsApp com DDD
                    </label>
                    <input
                      type="tel"
                      placeholder="(88) 99999-9999"
                      value={perfil.telefone}
                      onChange={e => setPerfil({ ...perfil, telefone: e.target.value })}
                      className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-cyan-500 focus:bg-cyan-50 outline-none transition-all"
                    />
                  </div>
                </div>

                {erro && <div className="mt-4 p-4 bg-red-100 border-2 border-red-300 text-red-700 rounded-xl text-sm font-bold">❌ {erro}</div>}
                {msg && <div className="mt-4 p-4 bg-green-100 border-2 border-green-300 text-green-700 rounded-xl text-sm font-bold">✅ {msg}</div>}

                <button
                  onClick={salvarPerfil}
                  disabled={salvando}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white rounded-xl font-black hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {salvando ? '⏳ Salvando...' : '💾 Salvar Perfil'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}