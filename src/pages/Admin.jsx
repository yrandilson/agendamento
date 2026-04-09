import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState([])
  const [filtroData, setFiltroData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [vizaoAtiva, setVizaoAtiva] = useState('hoje') // 'hoje', 'proximos', 'todos'
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('admin_ok')) {
      navigate('/admin')
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [filtroData, vizaoAtiva])

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

  async function atualizarStatus(id, status) {
    await supabase.from('agendamentos').update({ status }).eq('id', id)
    carregar()
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

  const confirmados = agendamentos.filter(a => a.status === 'confirmado')
  const cancelados = agendamentos.filter(a => a.status === 'cancelado')
  const concluidos = agendamentos.filter(a => a.status === 'concluido')
  const totalAtivos = confirmados.length + concluidos.length
  const taxaComparecimento = totalAtivos === 0 ? 0 : Math.round((concluidos.length / totalAtivos) * 100)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-800">📋 Agendamentos</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => carregar()} className="px-3 py-1 text-sm bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 font-semibold">
              🔄 Recarregar
            </button>
            <button onClick={sair} className="text-sm text-red-500 hover:underline">Sair</button>
          </div>
        </div>

        {/* Abas de visualização */}
        <div className="flex gap-2 mb-4">
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
            Próximos (confirmados)
          </button>
          <button
            onClick={() => setVizaoAtiva('todos')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              vizaoAtiva === 'todos'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-400'
            }`}
          >
            Todos (próximos)
          </button>
        </div>

        {/* Filtro data (apenas para vizão 'hoje') */}
        {vizaoAtiva === 'hoje' && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4 flex items-center gap-3">
            <label className="text-gray-600 font-medium">Data:</label>
            <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
              className="border-2 rounded-lg p-2 focus:border-indigo-500 outline-none" />
            <span className="text-gray-400 text-sm">
              {confirmados.length} confirmado(s) · {concluidos.length} concluido(s) · {cancelados.length} cancelado(s)
            </span>
          </div>
        )}

        {/* Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-gray-500">Total do dia</p>
            <p className="text-2xl font-bold text-gray-800">{agendamentos.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-gray-500">Confirmados</p>
            <p className="text-2xl font-bold text-green-600">{confirmados.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-gray-500">Concluidos</p>
            <p className="text-2xl font-bold text-blue-600">{concluidos.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs text-gray-500">Comparecimento</p>
            <p className="text-2xl font-bold text-indigo-600">{taxaComparecimento}%</p>
          </div>
        </div>

        {rankingServicos.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Servicos mais agendados (dia)</h2>
            <div className="space-y-2">
              {rankingServicos.slice(0, 5).map((servico, index) => (
                <div key={servico.nome} className="flex items-center justify-between text-sm">
                  <p className="text-gray-700">{index + 1}. {servico.nome}</p>
                  <span className="font-semibold text-indigo-600">{servico.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <p className="text-center text-gray-400 py-8">Carregando...</p>
        ) : agendamentos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-gray-400 text-lg">Nenhum agendamento neste dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agendamentos.map(a => (
              <div key={a.id}
                className={`bg-white rounded-2xl shadow p-4 border-l-4
                  ${a.status === 'confirmado' ? 'border-green-400' : a.status === 'concluido' ? 'border-blue-400' : 'border-red-300 opacity-60'}`}>
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
                    <p className="text-gray-500 text-sm">📱 {a.telefone_cliente}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${a.status === 'confirmado' ? 'bg-green-100 text-green-700' : a.status === 'concluido' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600'}`}>
                      {a.status}
                    </span>
                    {a.status === 'confirmado' && (
                      <div className="flex items-center gap-3">
                        <button onClick={() => concluir(a.id)}
                          className="text-xs text-blue-600 hover:underline">
                          Concluir
                        </button>
                        <button onClick={() => cancelar(a.id)}
                          className="text-xs text-red-500 hover:underline">
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

        {/* Link para página de agendamento */}
        <div className="mt-6 bg-indigo-50 rounded-2xl p-4 text-center">
          <p className="text-indigo-600 text-sm">Link para seus clientes:</p>
          <p className="font-bold text-indigo-800 break-all">{window.location.origin}/</p>
        </div>

      </div>
    </div>
  )
}
