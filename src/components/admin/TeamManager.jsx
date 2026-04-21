import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sab' }
];

export const TeamManager = ({ secao = 'profissionais' }) => {
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [erro, setErro] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    jornada_inicio: '08:00',
    jornada_fim: '18:00',
    dias_trabalho: [1, 2, 3, 4, 5]
  });

  useEffect(() => { carregarProfissionais(); }, []);

  async function carregarProfissionais() {
    setLoading(true);
    const { data } = await supabase
      .from('profissionais')
      .select('*')
      .order('nome');

    setProfissionais(data || []);
    setLoading(false);
  }

  async function salvarProfissional(e) {
    e.preventDefault();
    setErro('');
    setMsg('');

    if (!formData.nome.trim()) {
      setErro('Informe o nome do profissional.');
      return;
    }

    const payload = {
      nome: formData.nome.trim(),
      telefone: formData.telefone.trim() || null,
      ativo: true,
      jornada_inicio: formData.jornada_inicio,
      jornada_fim: formData.jornada_fim,
      dias_trabalho: formData.dias_trabalho
    };

    const { error } = await supabase.from('profissionais').insert([payload]);

    if (error) {
      setErro('Erro ao salvar: ' + error.message);
      return;
    }

    setMsg('Profissional adicionado.');
    setMostrarForm(false);
    setFormData({ nome: '', telefone: '', jornada_inicio: '08:00', jornada_fim: '18:00', dias_trabalho: [1, 2, 3, 4, 5] });
    await carregarProfissionais();
  }

  async function toggleAtivo(id, ativoAtual) {
    await supabase.from('profissionais').update({ ativo: !ativoAtual }).eq('id', id);
    await carregarProfissionais();
  }

  async function removerProfissional(id, nome) {
    if (!confirm(`Remover ${nome}? Esta acao nao remove agendamentos existentes.`)) return;
    await supabase.from('profissionais').delete().eq('id', id);
    await carregarProfissionais();
  }

  function toggleDia(dia) {
    setFormData(prev => {
      const dias = prev.dias_trabalho.includes(dia)
        ? prev.dias_trabalho.filter(d => d !== dia)
        : [...prev.dias_trabalho, dia].sort();
      return { ...prev, dias_trabalho: dias };
    });
  }

  const ativos = profissionais.filter(p => p.ativo).length;
  const total = profissionais.length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h3 className="text-lg font-black text-slate-800">Equipe / Profissionais</h3>
            <p className="text-sm text-slate-500">{ativos} ativo(s) de {total} profissional(is)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all"
            >
              {mostrarForm ? 'Cancelar' : '+ Profissional'}
            </button>
            <button
              onClick={carregarProfissionais}
              className="px-3 py-2 bg-slate-100 rounded-xl font-bold text-slate-700 hover:bg-slate-200"
            >
              Recarregar
            </button>
          </div>
        </div>

        {mostrarForm && (
          <form onSubmit={salvarProfissional} className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(88) 99999-9999"
                  className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Inicio jornada</label>
                <input
                  type="time"
                  value={formData.jornada_inicio}
                  onChange={e => setFormData({ ...formData, jornada_inicio: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Fim jornada</label>
                <input
                  type="time"
                  value={formData.jornada_fim}
                  onChange={e => setFormData({ ...formData, jornada_fim: e.target.value })}
                  className="w-full border-2 border-slate-200 rounded-lg p-2 bg-white"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-2 block">Dias de trabalho</label>
              <div className="flex gap-2 flex-wrap">
                {DIAS_SEMANA.map(d => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDia(d.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                      formData.dias_trabalho.includes(d.value)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500">
              Salvar profissional
            </button>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            {msg && <p className="text-sm text-green-600">{msg}</p>}
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-400 py-6">Carregando...</p>
        ) : profissionais.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum profissional cadastrado.</p>
            <p className="text-sm text-slate-400 mt-1">Clique em + Profissional para adicionar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {profissionais.map(p => (
              <div key={p.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ${p.ativo ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                      {p.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{p.nome}</p>
                      <p className="text-xs text-slate-500">{p.jornada_inicio} - {p.jornada_fim}</p>
                      <p className="text-xs text-slate-400">
                        {p.dias_trabalho?.map(d => DIAS_SEMANA.find(x => x.value === d)?.label).join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {p.ativo ? 'ativo' : 'inativo'}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => toggleAtivo(p.id, p.ativo)}
                    className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                      p.ativo
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => removerProfissional(p.id, p.nome)}
                    className="text-xs px-3 py-1 rounded-lg bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-600 font-bold transition-all"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamManager;