import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const POLITICAS = [
  { chave: 'antecedencia_cancelamento_horas', label: 'Horas para cancelar sem taxa', tipo: 'number', sufixo: 'horas' },
  { chave: 'antecedencia_reagendamento_horas', label: 'Horas minimas para reagendar', tipo: 'number', sufixo: 'horas' },
  { chave: 'buffer_minutos', label: 'Intervalo entre atendimentos', tipo: 'number', sufixo: 'minutos' },
  { chave: 'max_agendamentos_por_dia', label: 'Limite de agendamentos/dia', tipo: 'number', sufixo: 'agendamentos' },
  { chave: 'permitir_cancelamento_apos_confirmacao', label: 'Permitir cancelar apos confirmacao', tipo: 'boolean' }
];

export const SettingsPolicies = () => {
  const [politicas, setPoliticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { carregarPoliticas(); }, []);

  async function carregarPoliticas() {
    setLoading(true);
    const { data } = await supabase
      .from('config_politicas')
      .select('chave, valor');

    const mapa = {};
    (data || []).forEach(item => { mapa[item.chave] = item.valor; });
    setPoliticas(mapa);
    setLoading(false);
  }

  async function salvarPolitica(chave, valorNovo) {
    setSalvando(true);
    setMsg('');

    const { error } = await supabase
      .from('config_politicas')
      .upsert({ chave, valor: String(valorNovo) }, { onConflict: 'chave' });

    setSalvando(false);

    if (error) {
      setMsg('Erro ao salvar: ' + error.message);
      return;
    }

    setPoliticas(prev => ({ ...prev, [chave]: String(valorNovo) }));
    setMsg('Politica salva com sucesso.');
  }

  if (loading) {
    return <div className="bg-white rounded-2xl shadow p-6 text-center text-slate-400">Carregando politicas...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-800">Politicas do Sistema</h3>
          <p className="text-sm text-slate-500">Configure regras de negocio.</p>
        </div>
        <button
          onClick={carregarPoliticas}
          className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200"
        >
          Recarregar
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {POLITICAS.map(p => (
          <div key={p.chave} className="py-3 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-slate-700">{p.label}</p>
              <p className="text-xs text-slate-400">{p.chave}</p>
            </div>
            <div className="flex items-center gap-2">
              {p.tipo === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={politicas[p.chave] === 'true'}
                    onChange={e => salvarPolitica(p.chave, e.target.checked ? 'true' : 'false')}
                    disabled={salvando}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm text-slate-600">
                    {politicas[p.chave] === 'true' ? 'Sim' : 'Nao'}
                  </span>
                </label>
              ) : (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    defaultValue={politicas[p.chave] || ''}
                    onBlur={e => salvarPolitica(p.chave, e.target.value)}
                    disabled={salvando}
                    className="w-20 border-2 border-slate-200 rounded-lg p-2 text-center font-bold"
                  />
                  {p.sufixo && <span className="text-sm text-slate-500">{p.sufixo}</span>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {msg && <p className={`text-sm font-bold ${msg.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
    </div>
  );
};

export default SettingsPolicies;