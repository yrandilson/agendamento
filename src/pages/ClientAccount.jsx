import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const HORARIOS_RAPIDOS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

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
          <aside className="bg-slate-900 text-slate-100 rounded-3xl shadow-xl p-4 h-fit">
            <p className="text-xs uppercase tracking-widest text-cyan-300 mb-3">Dashboard do Cliente</p>
            <div className="space-y-2">
              {[
                { id: 'visao-geral', label: 'Visao Geral' },
                { id: 'calendario', label: 'Calendario de Agendamento' },
                { id: 'contatos', label: 'Contatos' },
                { id: 'chat', label: 'Chat' },
                { id: 'configuracoes', label: 'Configuracoes' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setSecaoAtiva(item.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                    secaoAtiva === item.id ? 'bg-cyan-400 text-slate-900' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            {secaoAtiva === 'visao-geral' && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/95 rounded-2xl shadow p-4 border border-slate-100">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-2xl font-black text-slate-800">{agendamentos.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-white rounded-2xl shadow p-4 border border-cyan-100">
                    <p className="text-xs text-slate-500">Proximos</p>
                    <p className="text-2xl font-black text-cyan-700">{proximos.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl shadow p-4 border border-indigo-100">
                    <p className="text-xs text-slate-500">Historico</p>
                    <p className="text-2xl font-black text-indigo-700">{historico.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl shadow p-4 border border-rose-100">
                    <p className="text-xs text-slate-500">Cancelados</p>
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
                  <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Proximos agendamentos</h2>
                    {carregandoHistorico ? (
                      <p className="text-slate-400 text-sm">Carregando...</p>
                    ) : proximos.length === 0 ? (
                      <p className="text-slate-400 text-sm">Nenhum agendamento futuro encontrado para este telefone.</p>
                    ) : (
                      <div className="space-y-3">
                        {proximos.map(item => (
                          <div key={item.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-start gap-3 bg-slate-50/40">
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
                  <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Historico</h2>
                    {historico.length === 0 ? (
                      <p className="text-slate-400 text-sm">Sem historico ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {historico.slice(0, 20).map(item => (
                          <div key={item.id} className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-2 bg-slate-50/40">
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
              </>
            )}

            {secaoAtiva === 'calendario' && (
              <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800">Calendario de Agendamento</h2>
                <p className="text-sm text-slate-500 mt-1 mb-5">Selecione data e horario para abrir a tela de agendamento com os dados predefinidos.</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700">Data</label>
                    <input
                      type="date"
                      value={dataRapida}
                      onChange={e => setDataRapida(e.target.value)}
                      className="mt-2 w-full border-2 border-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700">Horario (opcional)</label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {HORARIOS_RAPIDOS.map(h => (
                        <button
                          key={h}
                          onClick={() => setHorarioRapido(prev => (prev === h ? '' : h))}
                          className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            horarioRapido === h
                              ? 'bg-cyan-500 text-slate-900 border-cyan-500'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-400'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={abrirAgendamentoRapido}
                    className="px-5 py-3 rounded-2xl bg-cyan-500 text-slate-900 font-black hover:bg-cyan-400"
                  >
                    Ir para tela de agendamento
                  </button>
                  <p className="text-sm text-slate-500 self-center">Ao abrir a tela, voce continua pelo fluxo normal com data/horario sugeridos.</p>
                </div>
              </div>
            )}

            {secaoAtiva === 'contatos' && (
              <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800">Contatos</h2>
                <p className="text-sm text-slate-500 mt-1 mb-5">Fale com a equipe para duvidas, suporte e remarcacoes.</p>
                <div className="grid md:grid-cols-3 gap-3">
                  <a href="tel:+5588999999999" className="rounded-2xl border border-slate-200 p-4 hover:border-cyan-400 hover:bg-cyan-50 transition-all">
                    <p className="text-xs text-slate-500">Telefone</p>
                    <p className="font-bold text-slate-800">(88) 99999-9999</p>
                  </a>
                  <a href="https://wa.me/5588999999999" target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                    <p className="text-xs text-slate-500">WhatsApp</p>
                    <p className="font-bold text-slate-800">Falar no WhatsApp</p>
                  </a>
                  <a href="mailto:contato@agendamento.local" className="rounded-2xl border border-slate-200 p-4 hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                    <p className="text-xs text-slate-500">E-mail</p>
                    <p className="font-bold text-slate-800">contato@agendamento.local</p>
                  </a>
                </div>
              </div>
            )}

            {secaoAtiva === 'chat' && (
              <div className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800">Chat</h2>
                <p className="text-sm text-slate-500 mt-1 mb-4">Canal rapido para falar com suporte.</p>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 h-72 overflow-y-auto space-y-3">
                  {chatMensagens.map(msgItem => (
                    <div key={msgItem.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${msgItem.autor === 'cliente' ? 'ml-auto bg-cyan-500 text-slate-900' : 'bg-white border border-slate-200 text-slate-700'}`}>
                      {msgItem.texto}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviarMensagemChat()}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 border-2 border-slate-200 rounded-xl p-3 focus:border-cyan-500 outline-none"
                  />
                  <button onClick={enviarMensagemChat} className="px-4 py-3 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800">Enviar</button>
                </div>
              </div>
            )}

            {secaoAtiva === 'configuracoes' && (
              <div id="perfil-cliente-card" className="bg-white rounded-3xl shadow p-6 border border-slate-100">
                <h2 className="text-xl font-black text-slate-800 mb-4">Configuracoes de Perfil</h2>
                <div className="grid md:grid-cols-2 gap-3">
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
                </div>

                {erro && <p className="text-sm text-red-500 mt-3">{erro}</p>}
                {msg && <p className="text-sm text-green-600 mt-3">{msg}</p>}

                <button
                  onClick={salvarPerfil}
                  disabled={salvando}
                  className="mt-4 px-5 py-3 bg-cyan-500 text-slate-900 rounded-xl font-black hover:bg-cyan-400 disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : 'Salvar perfil'}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}