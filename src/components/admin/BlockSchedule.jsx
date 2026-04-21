import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HORARIOS = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];

const TIPOS_BLOQUEIO = [
  { value: 'bloqueio', label: 'Bloqueio' },
  { value: 'pausa', label: 'Pausa/Almoco' },
  { value: 'feriado', label: 'Feriado/Folga' }
];

export const BlockSchedule = () => {
  const [bloqueios, setBloqueios] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [politicas, setPoliticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mostrarForm, setMostrarForm] = useState(false);
  const [formData, setFormData] = useState({
    horario_inicio: '',
    horario_fim: '',
    tipo: 'bloqueio',
    motivo: '',
    profissional_id: ''
  });
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarTudo();
  }, [dataSelecionada]);

  async function carregarTudo() {
    setLoading(true);
    await Promise.all([
      carregarBloqueios(),
      carregarProfissionais(),
      carregarPoliticas()
    ]);
    setLoading(false);
  }

  async function carregarBloqueios() {
    const { data } = await supabase
      .from('bloqueios')
      .select('*, profissionais(nome)')
      .eq('data', dataSelecionada)
      .order('horario_inicio', { nullsFirst: true });

    setBloqueios(data || []);
  }

  async function carregarProfissionais() {
    const { data } = await supabase
      .from('profissionais')
      .select('id, nome')
      .eq('ativo', true)
      .order('nome');

    setProfissionais(data || []);
  }

  async function carregarPoliticas() {
    const { data } = await supabase
      .from('config_politicas')
      .select('chave, valor');

    const mapa = (data || []).reduce((acc, item) => {
      acc[item.chave] = item.valor;
      return acc;
    }, {});
    setPoliticas(mapa);
  }

  async function salvarBloqueio(e) {
    e.preventDefault();
    setErro('');
    setMsg('');

    const payload = {
      data: dataSelecionada,
      horario_inicio: formData.horario_inicio || null,
      horario_fim: formData.horario_fim || null,
      tipo: formData.tipo,
      motivo: formData.motivo || null,
      profissional_id: formData.profissional_id || null
    };

    const { error } = await supabase.from('bloqueios').insert([payload]);

    if (error) {
      setErro('Nao foi possivel criar o bloqueio: ' + error.message);
      return;
    }

    setMsg('Bloqueio criado com sucesso.');
    setMostrarForm(false);
    setFormData({ horario_inicio: '', horario_fim: '', tipo: 'bloqueio', motivo: '', profissional_id: '' });
    await carregarBloqueios();
  }

  async function removerBloqueio(id) {
    if (!confirm('Remover este bloqueio?')) return;
    await supabase.from('bloqueios').delete().eq('id', id);
    await carregarBloqueios();
  }

  const bloqueiosPorHorario = useMemo(() => {
    const mapa = {};
    HORARIOS.forEach(h => { mapa[h] = []; });

    bloqueios.forEach(b => {
      if (b.horario_inicio && b.horario_fim) {
        const idxIni = HORARIOS.indexOf(b.horario_inicio);
        const idxFim = HORARIOS.indexOf(b.horario_fim);
        if (idxIni >= 0 && idxFim >= 0) {
          for (let i = idxIni; i <= idxFim; i++) {
            mapa[HORARIOS[i]].push(b);
          }
        }
      } else {
        Object.keys(mapa).forEach(h => { mapa[h].push(b); });
      }
    });

    return mapa;
  }, [bloqueios]);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-black text-slate-800">Bloquear Horarios</h3>
          <p className="text-sm text-slate-500">Pausa almoco, folga ou bloqueio pontual.</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-all"
        >
          {mostrarForm ? 'Cancelar' : '+ Bloquear'}
        </button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <button
          onClick={() => setDataSelecionada(format(subDays(new Date(dataSelecionada), 1), 'yyyy-MM-dd'))}
          className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200"
        >
          {'<'} Anterior
        </button>
        <div className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-xl font-bold">
          {format(new Date(dataSelecionada + 'T00:00:00'), "dd/MM/yyyy", { locale: ptBR })}
        </div>
        <button
          onClick={() => setDataSelecionada(format(addDays(new Date(dataSelecionada), 1), 'yyyy-MM-dd'))}
          className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200"
        >
          Proximo {'>'}
        </button>
        <button
          onClick={() => setDataSelecionada(format(new Date(), 'yyyy-MM-dd'))}
          className="px-3 py-2 bg-cyan-100 text-cyan-700 rounded-xl font-bold hover:bg-cyan-200"
        >
          Hoje
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={salvarBloqueio} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Hora inicio</label>
              <select
                value={formData.horario_inicio}
                onChange={e => setFormData({ ...formData, horario_inicio: e.target.value })}
                className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="">Geral (dia inteiro)</option>
                {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Hora fim</label>
              <select
                value={formData.horario_fim}
                onChange={e => setFormData({ ...formData, horario_fim: e.target.value })}
                className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="">Geral (dia inteiro)</option>
                {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Tipo</label>
              <select
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
              >
                {TIPOS_BLOQUEIO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1 block">Profissional</label>
              <select
                value={formData.profissional_id}
                onChange={e => setFormData({ ...formData, profissional_id: e.target.value })}
                className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
              >
                <option value="">Todos</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Motivo (opcional)</label>
            <input
              type="text"
              value={formData.motivo}
              onChange={e => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Ex: Feriado de Finados"
              className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500"
          >
            Confirmar bloqueio
          </button>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </form>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2">
        {HORARIOS.map(horario => {
          const bloqueiosHorario = bloqueiosPorHorario[horario];
          const temBloqueio = bloqueiosHorario.length > 0;
          const unicoBloqueio = temBloqueio ? bloqueiosHorario[0] : null;

          return (
            <div
              key={horario}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all ${
                temBloqueio
                  ? unicoBloqueio?.tipo === 'pausa'
                    ? 'bg-yellow-100 border-2 border-yellow-300 text-yellow-700'
                    : unicoBloqueio?.tipo === 'feriado'
                      ? 'bg-red-100 border-2 border-red-300 text-red-700'
                      : 'bg-slate-800 text-white'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-indigo-400'
              }`}
            >
              <span>{horario}</span>
              {temBloqueio && (
                <span className="text-[10px] mt-1 opacity-80">
                  {unicoBloqueio?.profissionais?.nome || unicoBloqueio?.tipo}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {bloqueios.length === 0 && !mostrarForm && (
        <p className="text-sm text-slate-400 text-center py-4">Nenhum bloqueio neste dia.</p>
      )}

      {bloqueios.length > 0 && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-bold text-slate-600">Bloqueios do dia:</h4>
          {bloqueios.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  b.tipo === 'pausa' ? 'bg-yellow-100 text-yellow-700' :
                  b.tipo === 'feriado' ? 'bg-red-100 text-red-600' :
                  'bg-slate-800 text-white'
                }`}>
                  {b.tipo}
                </span>
                <span className="text-sm text-slate-700">
                  {b.horario_inicio || '00:00'} - {b.horario_fim || '23:59'}
                  {b.profissionais?.nome && ` · ${b.profissionais.nome}`}
                </span>
                {b.motivo && <span className="text-xs text-slate-400">{b.motivo}</span>}
              </div>
              <button
                onClick={() => removerBloqueio(b.id)}
                className="text-xs text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockSchedule;