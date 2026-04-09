import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function moeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function csvCell(valor) {
  const texto = String(valor ?? '')
  return `"${texto.replaceAll('"', '""')}"`
}

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState([])
  const [analyticsData, setAnalyticsData] = useState([])
  const [precoPorServico, setPrecoPorServico] = useState({})
  const [secaoAtiva, setSecaoAtiva] = useState('dashboard') // 'dashboard', 'agenda', 'analises'
  const [temaEscuro, setTemaEscuro] = useState(false)
  const [sidebarCompacta, setSidebarCompacta] = useState(false)
  const [filtroData, setFiltroData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [vizaoAtiva, setVizaoAtiva] = useState('hoje') // 'hoje', 'proximos', 'todos'
  const [loading, setLoading] = useState(true)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)
  const navigate = useNavigate()

  const shellClass = temaEscuro
    ? 'min-h-screen bg-[radial-gradient(circle_at_15%_20%,#0f172a,transparent_30%),radial-gradient(circle_at_85%_5%,#1e293b,transparent_35%),#020617] text-slate-100 md:flex'
    : 'min-h-screen bg-[radial-gradient(circle_at_15%_20%,#dbeafe,transparent_30%),radial-gradient(circle_at_85%_5%,#cffafe,transparent_35%),#f1f5f9] md:flex'

  useEffect(() => {
    if (!sessionStorage.getItem('admin_ok')) {
      navigate('/admin')
    }
  }, [navigate])

  useEffect(() => {
    carregarServicos()
    carregarAnalytics()
  }, [])

  useEffect(() => {
    carregar()
  }, [filtroData, vizaoAtiva])

  async function carregarServicos() {
    const { data } = await supabase.from('servicos').select('nome, preco')
    const mapa = (data || []).reduce((acc, item) => {
      acc[item.nome] = Number(item.preco || 0)
      return acc
    }, {})
    setPrecoPorServico(mapa)
  }

  async function carregar() {
    setLoading(true)
    let query = supabase.from('agendamentos').select('*')

    if (vizaoAtiva === 'hoje') {
      query = query.eq('data', filtroData)
    } else if (vizaoAtiva === 'proximos') {
      const hoje = format(new Date(), 'yyyy-MM-dd')
      query = query.gte('data', hoje).neq('status', 'cancelado')
    } else if (vizaoAtiva === 'todos') {
      query = query.gte('data', format(new Date(), 'yyyy-MM-dd'))
    }

    const { data } = await query.order('data', { ascending: true }).order('horario', { ascending: true })
    setAgendamentos(data || [])
    setLoading(false)
  }

  async function carregarAnalytics() {
    setLoadingAnalytics(true)
    const inicio = format(subDays(new Date(), 29), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .gte('data', inicio)
      .order('data', { ascending: true })
      .order('horario', { ascending: true })

    setAnalyticsData(data || [])
    setLoadingAnalytics(false)
  }

  async function atualizarStatus(id, status) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    await Promise.all([carregar(), carregarAnalytics()])
  }

  async function cancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return
    await atualizarStatus(id, 'cancelado')
  }

  async function concluir(id) {
    if (!confirm('Marcar este agendamento como concluido?')) return
    await atualizarStatus(id, 'concluido')
  }

  function sair() {
    sessionStorage.removeItem('admin_ok')
    navigate('/admin')
  }

  function exportarAgendaCsv() {
    const header = ['Data', 'Horario', 'Cliente', 'Telefone', 'Servico', 'Status']
    const linhas = agendamentos.map(item => [
      item.data,
      item.horario,
      item.nome_cliente,
      item.telefone_cliente,
      item.servico_nome,
      item.status
    ])

    const csv = [header, ...linhas].map(colunas => colunas.map(csvCell).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `agenda-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const confirmados = agendamentos.filter(a => a.status === 'confirmado')
  const cancelados = agendamentos.filter(a => a.status === 'cancelado')
  const concluidos = agendamentos.filter(a => a.status === 'concluido')
  const totalAtivos = confirmados.length + concluidos.length
  const taxaComparecimento = totalAtivos === 0 ? 0 : Math.round((concluidos.length / totalAtivos) * 100)

  const faturamentoEstimado = agendamentos
    .filter(a => a.status !== 'cancelado')
    .reduce((acc, item) => acc + Number(precoPorServico[item.servico_nome] || 0), 0)

  const ticketMedio = totalAtivos === 0 ? 0 : faturamentoEstimado / totalAtivos
  const clientesUnicosPeriodo = new Set(agendamentos.map(a => a.telefone_cliente)).size

  const rankingServicos = Object.values(
    agendamentos.reduce((acc, item) => {
      if (item.status === 'cancelado') return acc
      if (!acc[item.servico_nome]) {
        acc[item.servico_nome] = { nome: item.servico_nome, total: 0 }
      }
      acc[item.servico_nome].total += 1
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  const diasGrafico = Array.from({ length: 14 }, (_, i) => {
    const dia = subDays(new Date(), 13 - i)
    return {
      key: format(dia, 'yyyy-MM-dd'),
      label: format(dia, 'dd/MM')
    }
  })

  const volumePorDia = diasGrafico.map(d => {
    const total = analyticsData.filter(a => a.data === d.key && a.status !== 'cancelado').length
    return { ...d, total }
  })

  const maxVolume = Math.max(1, ...volumePorDia.map(d => d.total))

  const horariosPico = Object.values(
    analyticsData.reduce((acc, item) => {
      if (item.status === 'cancelado') return acc
      if (!acc[item.horario]) {
        acc[item.horario] = { horario: item.horario, total: 0 }
      }
      acc[item.horario].total += 1
      return acc
    }, {})
  )
    .sort((a, b) => b.total - a.total)
    .slice(0, 6)

  const maxPico = Math.max(1, ...horariosPico.map(h => h.total))

  const analyticsConfirmados = analyticsData.filter(a => a.status === 'confirmado')
  const analyticsConcluidos = analyticsData.filter(a => a.status === 'concluido')
  const analyticsCancelados = analyticsData.filter(a => a.status === 'cancelado')
  const analyticsAtivos = analyticsConfirmados.length + analyticsConcluidos.length
  const analyticsTaxaComparecimento = analyticsAtivos === 0 ? 0 : Math.round((analyticsConcluidos.length / analyticsAtivos) * 100)
  const analyticsFaturamento = analyticsData
    .filter(a => a.status !== 'cancelado')
    .reduce((acc, item) => acc + Number(precoPorServico[item.servico_nome] || 0), 0)
  const analyticsTicketMedio = analyticsAtivos === 0 ? 0 : analyticsFaturamento / analyticsAtivos
  const analyticsClientesUnicos = new Set(analyticsData.map(a => a.telefone_cliente)).size

  const rankingServicosAnalytics = Object.values(
    analyticsData.reduce((acc, item) => {
      if (item.status === 'cancelado') return acc
      if (!acc[item.servico_nome]) {
        acc[item.servico_nome] = { nome: item.servico_nome, total: 0 }
      }
      acc[item.servico_nome].total += 1
      return acc
    }, {})
  ).sort((a, b) => b.total - a.total)

  return (
    <div className={shellClass}>
      <aside className={`hidden md:flex ${sidebarCompacta ? 'md:w-20' : 'md:w-64 lg:w-72'} bg-slate-900 text-slate-100 flex-col p-4 shadow-2xl transition-all duration-300`}>
        <div className="flex items-center justify-between mb-8 px-2">
          <h1 className={`text-xl font-black tracking-wide ${sidebarCompacta ? 'hidden' : 'block'}`}>Painel Agendamento</h1>
          <button
            onClick={() => setSidebarCompacta(!sidebarCompacta)}
            className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700"
            title="Expandir/recolher menu"
          >
            {sidebarCompacta ? '>>' : '<<'}
          </button>
        </div>
        <nav className="space-y-2">
          <button
            onClick={() => setSecaoAtiva('dashboard')}
            className={`w-full text-left px-3 py-2 rounded-xl font-semibold ${
              secaoAtiva === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {sidebarCompacta ? 'D' : '▣ Dashboard'}
          </button>
          <button
            onClick={() => setSecaoAtiva('agenda')}
            className={`w-full text-left px-3 py-2 rounded-xl font-semibold ${
              secaoAtiva === 'agenda' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {sidebarCompacta ? 'A' : '☰ Agenda'}
          </button>
          <button
            onClick={() => setSecaoAtiva('analises')}
            className={`w-full text-left px-3 py-2 rounded-xl font-semibold ${
              secaoAtiva === 'analises' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {sidebarCompacta ? 'N' : '◉ Analises'}
          </button>
        </nav>
        <div className="mt-auto">
          {!sidebarCompacta && <p className="text-xs text-slate-400 mb-2">Acesso rapido</p>}
          {!sidebarCompacta && <p className="text-sm break-all text-slate-200">{window.location.origin}</p>}
          {!sidebarCompacta && (
            <Link to="/" className="mt-3 inline-flex text-sm text-cyan-300 hover:underline">
              Voltar para o site
            </Link>
          )}
          <button onClick={sair} className="mt-4 text-sm text-red-300 hover:underline">{sidebarCompacta ? 'Sair' : 'Encerrar sessao'}</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className={`backdrop-blur border rounded-2xl shadow-sm p-3 mb-4 flex items-center justify-between md:hidden ${temaEscuro ? 'bg-slate-900/70 border-slate-700' : 'bg-white/80 border-white'}`}>
            <Link to="/" className={`text-sm font-semibold hover:underline ${temaEscuro ? 'text-cyan-300' : 'text-slate-700'}`}>← Voltar</Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTemaEscuro(!temaEscuro)}
                className={`text-sm font-semibold ${temaEscuro ? 'text-cyan-300' : 'text-slate-700'} hover:underline`}
              >
                {temaEscuro ? 'Claro' : 'Escuro'}
              </button>
              <button onClick={sair} className="text-sm font-semibold text-red-500 hover:underline">Sair</button>
            </div>
          </div>

          <div className="flex gap-2 mb-4 md:hidden overflow-x-auto pb-1">
            <button
              onClick={() => setSecaoAtiva('dashboard')}
              className={`px-4 py-2 whitespace-nowrap rounded-xl font-semibold text-sm ${
                secaoAtiva === 'dashboard' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setSecaoAtiva('agenda')}
              className={`px-4 py-2 whitespace-nowrap rounded-xl font-semibold text-sm ${
                secaoAtiva === 'agenda' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setSecaoAtiva('analises')}
              className={`px-4 py-2 whitespace-nowrap rounded-xl font-semibold text-sm ${
                secaoAtiva === 'analises' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              Analises
            </button>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-3xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-indigo-100">
                  {secaoAtiva === 'dashboard' ? 'Dashboard Avancado' : secaoAtiva === 'agenda' ? 'Agenda Operacional' : 'Analises de Performance'}
                </p>
                <h2 className="text-2xl md:text-3xl font-black">
                  {secaoAtiva === 'dashboard' ? 'Visao de desempenho do negocio' : secaoAtiva === 'agenda' ? 'Gestao dos agendamentos' : 'Leitura estrategica dos resultados'}
                </h2>
                <p className="text-indigo-100 mt-1">
                  {secaoAtiva === 'dashboard'
                    ? 'Acompanhe agenda, receita e horarios de pico em tempo real.'
                    : secaoAtiva === 'agenda'
                      ? 'Filtre por periodo e gerencie cada atendimento com poucos cliques.'
                      : 'Acompanhe ultimos 30 dias para apoiar decisoes de crescimento.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTemaEscuro(!temaEscuro)}
                  className="px-4 py-2 bg-white/15 border border-white/30 text-white rounded-xl font-bold hover:bg-white/25"
                >
                  {temaEscuro ? 'Tema claro' : 'Tema escuro'}
                </button>
                <button
                  onClick={exportarAgendaCsv}
                  className="px-4 py-2 bg-emerald-300 text-emerald-950 rounded-xl font-bold hover:bg-emerald-200"
                >
                  Exportar CSV
                </button>
                <button
                  onClick={() => {
                    carregar()
                    carregarAnalytics()
                  }}
                  className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-bold hover:bg-indigo-50"
                >
                  Recarregar
                </button>
              </div>
            </div>
          </div>

          {secaoAtiva === 'dashboard' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 mb-6">
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Total no periodo</p>
                  <p className="text-2xl font-black text-gray-800">{agendamentos.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Confirmados</p>
                  <p className="text-2xl font-black text-green-600">{confirmados.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Concluidos</p>
                  <p className="text-2xl font-black text-blue-600">{concluidos.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Faturamento estimado</p>
                  <p className="text-xl font-black text-emerald-600">{moeda(faturamentoEstimado)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Ticket medio</p>
                  <p className="text-xl font-black text-indigo-600">{moeda(ticketMedio)}</p>
                  <p className="text-xs text-gray-400 mt-1">Comparecimento: {taxaComparecimento}%</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Clientes unicos</p>
                  <p className="text-2xl font-black text-cyan-700">{clientesUnicosPeriodo}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
                <div className="xl:col-span-2 bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Grafico de agendamentos (ultimos 14 dias)</h3>
                  {loadingAnalytics ? (
                    <p className="text-sm text-gray-400">Carregando grafico...</p>
                  ) : (
                    <div className="h-56 flex items-end gap-2">
                      {volumePorDia.map((item, index) => (
                        <div key={item.key} className="flex-1 min-w-0 flex flex-col items-center justify-end">
                          <div className="text-[10px] text-gray-400 mb-1">{item.total}</div>
                          <div
                            className="w-full rounded-t-md bg-gradient-to-t from-indigo-600 to-cyan-400"
                            style={{
                              height: `${Math.max(8, Math.round((item.total / maxVolume) * 150))}px`,
                              transition: 'height 600ms ease',
                              transitionDelay: `${index * 30}ms`
                            }}
                          />
                          <div className="text-[10px] text-gray-500 mt-1">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Horarios de pico</h3>
                  {horariosPico.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem dados suficientes.</p>
                  ) : (
                    <div className="space-y-3">
                      {horariosPico.map((item, index) => (
                        <div key={item.horario}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-700">{item.horario}</span>
                            <span className="text-gray-500">{item.total}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-600"
                              style={{
                                width: `${Math.round((item.total / maxPico) * 100)}%`,
                                transition: 'width 700ms ease',
                                transitionDelay: `${index * 50}ms`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {secaoAtiva === 'agenda' && (
            <>
              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => setVizaoAtiva('hoje')}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    vizaoAtiva === 'hoje'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-400'
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => setVizaoAtiva('proximos')}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    vizaoAtiva === 'proximos'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-400'
                  }`}
                >
                  Proximos (confirmados)
                </button>
                <button
                  onClick={() => setVizaoAtiva('todos')}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    vizaoAtiva === 'todos'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-400'
                  }`}
                >
                  Todos (proximos)
                </button>
              </div>

              {vizaoAtiva === 'hoje' && (
                <div className="bg-white rounded-2xl shadow p-4 mb-4 flex items-center gap-3 flex-wrap">
                  <label className="text-gray-600 font-medium">Data:</label>
                  <input
                    type="date"
                    value={filtroData}
                    onChange={e => setFiltroData(e.target.value)}
                    className="border-2 rounded-lg p-2 focus:border-indigo-500 outline-none"
                  />
                  <span className="text-gray-400 text-sm">
                    {confirmados.length} confirmado(s) · {concluidos.length} concluido(s) · {cancelados.length} cancelado(s)
                  </span>
                </div>
              )}

              {loading ? (
                <p className="text-center text-gray-400 py-8">Carregando...</p>
              ) : agendamentos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-8 text-center">
                  <p className="text-gray-400 text-lg">Nenhum agendamento no periodo selecionado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {agendamentos.map(a => (
                    <div
                      key={a.id}
                      className={`bg-white rounded-2xl shadow p-4 border-l-4 ${
                        a.status === 'confirmado'
                          ? 'border-green-400'
                          : a.status === 'concluido'
                            ? 'border-blue-400'
                            : 'border-red-300 opacity-70'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">
                            {a.horario} — {a.nome_cliente}
                            {vizaoAtiva !== 'hoje' && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({format(new Date(a.data + 'T00:00:00'), 'dd/MM', { locale: ptBR })})
                              </span>
                            )}
                          </p>
                          <p className="text-indigo-600 font-medium">{a.servico_nome}</p>
                          <p className="text-gray-500 text-sm">{a.telefone_cliente}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              a.status === 'confirmado'
                                ? 'bg-green-100 text-green-700'
                                : a.status === 'concluido'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-600'
                            }`}
                          >
                            {a.status}
                          </span>
                          {a.status === 'confirmado' && (
                            <div className="flex items-center gap-3">
                              <button onClick={() => concluir(a.id)} className="text-xs text-blue-600 hover:underline">
                                Concluir
                              </button>
                              <button onClick={() => cancelar(a.id)} className="text-xs text-red-500 hover:underline">
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {secaoAtiva === 'analises' && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-6 gap-3 mb-6">
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Ultimos 30 dias</p>
                  <p className="text-2xl font-black text-gray-800">{analyticsData.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Confirmados</p>
                  <p className="text-2xl font-black text-green-600">{analyticsConfirmados.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Concluidos</p>
                  <p className="text-2xl font-black text-blue-600">{analyticsConcluidos.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Cancelados</p>
                  <p className="text-2xl font-black text-red-600">{analyticsCancelados.length}</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Faturamento 30d</p>
                  <p className="text-xl font-black text-emerald-600">{moeda(analyticsFaturamento)}</p>
                  <p className="text-xs text-gray-400 mt-1">Ticket: {moeda(analyticsTicketMedio)} · Comparecimento: {analyticsTaxaComparecimento}%</p>
                </div>
                <div className="bg-white rounded-2xl shadow p-4">
                  <p className="text-xs text-gray-500">Clientes unicos 30d</p>
                  <p className="text-2xl font-black text-cyan-700">{analyticsClientesUnicos}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Top servicos (30 dias)</h3>
                  {rankingServicosAnalytics.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem dados suficientes.</p>
                  ) : (
                    <div className="space-y-3">
                      {rankingServicosAnalytics.slice(0, 8).map((servico, index) => (
                        <div key={servico.nome} className="flex items-center justify-between text-sm">
                          <p className="text-gray-700">{index + 1}. {servico.nome}</p>
                          <span className="font-semibold text-indigo-600">{servico.total}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-bold text-gray-800 mb-4">Horarios de pico (30 dias)</h3>
                  {horariosPico.length === 0 ? (
                    <p className="text-sm text-gray-400">Sem dados suficientes.</p>
                  ) : (
                    <div className="space-y-3">
                      {horariosPico.map((item, index) => (
                        <div key={item.horario}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-semibold text-gray-700">{item.horario}</span>
                            <span className="text-gray-500">{item.total}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-cyan-400 to-indigo-600"
                              style={{
                                width: `${Math.round((item.total / maxPico) * 100)}%`,
                                transition: 'width 700ms ease',
                                transitionDelay: `${index * 50}ms`
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Link
          to="/agendar"
          className="fixed bottom-5 right-5 z-20 px-5 py-3 rounded-2xl bg-cyan-400 text-slate-900 font-black shadow-xl hover:bg-cyan-300 transition-all"
        >
          + Novo agendamento
        </Link>
      </main>
    </div>
  )
}
