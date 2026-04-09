import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export default function Booking() {
  const [step, setStep] = useState(1) // 1: serviço, 2: data, 3: horário, 4: dados, 5: confirmado
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [ocupados, setOcupados] = useState([])
  const [form, setForm] = useState({ nome: '', telefone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const dias = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))

  useEffect(() => {
    supabase.from('servicos').select('*').then(({ data }) => {
      if (data) setServices(data)
    })
  }, [])

  useEffect(() => {
    if (!selectedDate) return
    const dia = format(selectedDate, 'yyyy-MM-dd')
    supabase
      .from('agendamentos')
      .select('horario')
      .eq('data', dia)
      .neq('status', 'cancelado')
      .then(({ data }) => {
        if (data) setOcupados(data.map(a => a.horario))
      })
  }, [selectedDate])

  async function confirmar() {
    if (!form.nome || !form.telefone) {
      setError('Preencha todos os campos')
      return
    }
    setLoading(true)
    setError('')
    const dia = format(selectedDate, 'yyyy-MM-dd')

    const { error: err } = await supabase.from('agendamentos').insert({
      nome_cliente: form.nome,
      telefone_cliente: form.telefone,
      servico_id: selectedService.id,
      servico_nome: selectedService.nome,
      data: dia,
      horario: selectedTime,
      status: 'confirmado'
    })

    if (err) {
      setError('Erro ao agendar. Tente novamente.')
      setLoading(false)
      return
    }

    // Notifica via WhatsApp (serverless function)
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome,
        telefone: form.telefone,
        servico: selectedService.nome,
        data: format(selectedDate, "dd 'de' MMMM", { locale: ptBR }),
        horario: selectedTime
      })
    })

    setLoading(false)
    setStep(5)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8 pt-6">
          <h1 className="text-3xl font-bold text-indigo-700">📅 Agendamento Online</h1>
          <p className="text-gray-500 mt-1">Rápido, fácil e sem precisar ligar</p>
        </div>

        {/* Progress */}
        {step < 5 && (
          <div className="flex justify-between mb-6 px-2">
            {['Serviço', 'Data', 'Horário', 'Dados'].map((label, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className="text-xs mt-1 text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">

          {/* Step 1: Serviço */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Qual serviço deseja?</h2>
              {services.length === 0 && <p className="text-gray-400">Carregando serviços...</p>}
              <div className="space-y-3">
                {services.map(s => (
                  <button key={s.id} onClick={() => { setSelectedService(s); setStep(2) }}
                    className="w-full text-left p-4 border-2 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                    <div className="font-semibold text-gray-800">{s.nome}</div>
                    <div className="text-sm text-gray-500">{s.duracao_min} min · R$ {Number(s.preco).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Data */}
          {step === 2 && (
            <div>
              <button onClick={() => setStep(1)} className="text-indigo-500 text-sm mb-3">← Voltar</button>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Escolha o dia</h2>
              <div className="grid grid-cols-3 gap-2">
                {dias.map(dia => (
                  <button key={dia} onClick={() => { setSelectedDate(dia); setStep(3) }}
                    className="p-3 border-2 rounded-xl text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                    <div className="text-xs text-gray-400 capitalize">{format(dia, 'EEE', { locale: ptBR })}</div>
                    <div className="font-bold text-gray-800">{format(dia, 'dd')}</div>
                    <div className="text-xs text-gray-400">{format(dia, 'MMM', { locale: ptBR })}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Horário */}
          {step === 3 && (
            <div>
              <button onClick={() => setStep(2)} className="text-indigo-500 text-sm mb-3">← Voltar</button>
              <h2 className="text-xl font-semibold mb-1 text-gray-700">Escolha o horário</h2>
              <p className="text-sm text-gray-400 mb-4">
                {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {HORARIOS.map(h => {
                  const ocupado = ocupados.includes(h)
                  return (
                    <button key={h} disabled={ocupado}
                      onClick={() => { setSelectedTime(h); setStep(4) }}
                      className={`p-3 border-2 rounded-xl font-medium transition-all
                        ${ocupado ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'hover:border-indigo-500 hover:bg-indigo-50 text-gray-700'}`}>
                      {ocupado ? <s>{h}</s> : h}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Dados */}
          {step === 4 && (
            <div>
              <button onClick={() => setStep(3)} className="text-indigo-500 text-sm mb-3">← Voltar</button>
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Seus dados</h2>

              <div className="bg-indigo-50 rounded-xl p-3 mb-4 text-sm text-indigo-700">
                <p>🛠 <strong>{selectedService?.nome}</strong></p>
                <p>📅 {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}</p>
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Seu nome completo"
                  value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none" />
                <input type="tel" placeholder="WhatsApp (com DDD)"
                  value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                  className="w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none" />
              </div>

              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

              <button onClick={confirmar} disabled={loading}
                className="w-full mt-4 bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all">
                {loading ? 'Agendando...' : 'Confirmar Agendamento ✓'}
              </button>
            </div>
          )}

          {/* Step 5: Confirmado */}
          {step === 5 && (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Agendado com sucesso!</h2>
              <p className="text-gray-500 mb-6">Você receberá uma confirmação no WhatsApp.</p>
              <div className="bg-green-50 rounded-xl p-4 text-left text-sm text-green-700 mb-6">
                <p>✅ <strong>{selectedService?.nome}</strong></p>
                <p>📅 {format(selectedDate, "dd/MM/yyyy")} às {selectedTime}</p>
                <p>👤 {form.nome}</p>
              </div>
              <button onClick={() => { setStep(1); setSelectedService(null); setSelectedDate(null); setSelectedTime(null); setForm({ nome: '', telefone: '' }) }}
                className="text-indigo-600 font-semibold hover:underline">
                Fazer outro agendamento
              </button>
            </div>
          )}

        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-gray-500 mb-1">Acesso do estabelecimento</p>
          <Link to="/admin" className="text-sm font-semibold text-indigo-600 hover:underline">
            Entrar no Painel Admin
          </Link>
        </div>
      </div>
    </div>
  )
}
