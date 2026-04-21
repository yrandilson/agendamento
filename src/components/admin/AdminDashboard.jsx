import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DASHBOARD } from '../../config/constants';

/**
 * Dashboard do Admin com KPIs e gráficos
 */
export const AdminDashboard = ({ onRefresh }) => {
  const [metrics, setMetrics] = useState({
    total: 0,
    confirmados: 0,
    concluidos: 0,
    cancelados: 0,
    faturamento: 0,
    ticket_medio: 0,
    clientes_unicos: 0
  });
  
  const [analytics, setAnalytics] = useState({
    ultimos_30_dias: [],
    ranking_servicos: [],
    comparativo_mensal: { mes_atual: 0, mes_anterior: 0, variacao: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchMetrics = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      // Buscar agendamentos do dia
      const { data: hojeData } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('data', hoje);

      const hojeAppointments = hojeData || [];
      
      // Calcular métricas do dia
      const total = hojeAppointments.length;
      const confirmados = hojeAppointments.filter(a => a.status === 'confirmado').length;
      const concluidos = hojeAppointments.filter(a => a.status === 'concluido').length;
      const cancelados = hojeAppointments.filter(a => a.status === 'cancelado').length;
      
      // Calcular faturamento (simplificado)
      const faturamento = hojeAppointments.reduce((sum, appointment) => {
        // Aqui você poderia buscar o preço real do serviço
        return sum + 50; // Valor fixo para exemplo
      }, 0);
      
      const ticket_medio = total > 0 ? faturamento / total : 0;
      const clientes_unicos = new Set(hojeAppointments.map(a => a.telefone_cliente)).size;

      setMetrics({
        total,
        confirmados,
        concluidos,
        cancelados,
        faturamento,
        ticket_medio,
        clientes_unicos
      });
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Buscar dados dos últimos 30 dias
      const { data: ultimos30Dias } = await supabase
        .rpc('agendamentos_ultimos_30_dias');

      // Buscar ranking de serviços
      const { data: rankingServicos } = await supabase
        .rpc('servicos_ranking');

      // Buscar comparativo mensal
      const { data: comparativoMensal } = await supabase
        .rpc('comparativo_mensal');

      setAnalytics({
        ultimos_30_dias: ultimos30Dias || [],
        ranking_servicos: rankingServicos || [],
        comparativo_mensal: comparativoMensal || { mes_atual: 0, mes_anterior: 0, variacao: 0 }
      });
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchAnalytics()]);
      setLoading(false);
    };
    
    fetchData();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <button 
          onClick={() => {
            fetchMetrics();
            fetchAnalytics();
            onRefresh?.();
          }}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hoje</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmados</p>
              <p className="text-3xl font-bold text-blue-600">{metrics.confirmados}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-3xl font-bold text-green-600">{metrics.concluidos}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Faturamento</p>
              <p className="text-3xl font-bold text-gray-900">R$ {metrics.faturamento.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de agendamentos dos últimos 14 dias */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendamentos - Últimos {DASHBOARD.chartDays} dias</h3>
        <div className="h-64">
          <div className="flex items-end justify-between h-full">
            {analytics.ultimos_30_dias.slice(-DASHBOARD.chartDays).map((dia, index) => (
              <div key={dia.data} className="flex flex-col items-center flex-1">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                  style={{ height: `${(dia.agendamentos / Math.max(...analytics.ultimos_30_dias.map(d => d.agendamentos), 1)) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{dia.data.split('-').reverse().join('/')}</span>
                <span className="text-xs font-medium text-gray-900">{dia.agendamentos}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ranking de serviços */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviços mais agendados</h3>
        <div className="space-y-3">
          {analytics.ranking_servicos.slice(0, 5).map((servico, index) => (
            <div key={servico.servico} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                <span className="font-medium text-gray-900">{servico.servico}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{servico.quantidade} agendamentos</p>
                <p className="text-xs text-gray-600">R$ {servico.faturamento.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};