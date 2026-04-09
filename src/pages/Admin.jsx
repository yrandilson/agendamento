import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Admin() {
  const [agendamentos, setAgendamentos] = useState([])
  const [filtroData, setFiltroData] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionStorage.getItem('admin_ok')) {
      navigate('/admin')
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [filtroData])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('data', filtroData)
      .order('horario', { ascending: true })
    setAgendamentos(data || [])
    setLoading(false)
  }

  async function cancelar(id) {
    if (!confirm('Cancelar este agendamento?')) return
    await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', id)
    carregar()
  }

  function sair() {
    sessionStorage.removeItem('admin_ok')
    navigate('/admin')
  }

  const confirmados = agendamentos.filter(a => a.status === 'confirmado')
  const cancelados = agendamentos.filter(a => a.status === 'cancelado')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 pt-4">
          <h1 className="text-2xl font-bold text-gray-800">📋 Agendamentos</h1>
          <button onClick={sair} className="text-sm text-red-500 hover:underline">Sair</button>
        </div>

        {/* Filtro data */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4 flex items-center gap-3">
          <label className="text-gray-600 font-medium">Data:</label>
          <input type="date" value={filtroData} onChange={e => setFiltroData(e.target.value)}
            className="border-2 rounded-lg p-2 focus:border-indigo-500 outline-none" />
          <span className="text-gray-400 text-sm">
            {confirmados.length} confirmado(s)
          </span>
        </div>

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
                  ${a.status === 'confirmado' ? 'border-green-400' : 'border-red-300 opacity-60'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-gray-800">{a.horario} — {a.nome_cliente}</p>
                    <p className="text-indigo-600 font-medium">{a.servico_nome}</p>
                    <p className="text-gray-500 text-sm">📱 {a.telefone_cliente}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                      ${a.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {a.status}
                    </span>
                    {a.status === 'confirmado' && (
                      <button onClick={() => cancelar(a.id)}
                        className="text-xs text-red-500 hover:underline">
                        Cancelar
                      </button>
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
