import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { STATUS_COLORS } from '../../config/constants';

/**
 * Componente para gerenciar agendamentos
 */
export const AppointmentManager = ({ filters = {}, onRefresh }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { error, handleError, clearError } = useErrorHandler();

  const pageSize = 20;

  const fetchAppointments = async (page = 1, resetFilters = false) => {
    try {
      setLoading(true);
      clearError();

      let query = supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      // Aplicar filtros
      if (!resetFilters && filters.data) {
        query = query.eq('data', filters.data);
      }
      if (!resetFilters && filters.status) {
        query = query.eq('status', filters.status);
      }
      if (!resetFilters && filters.search) {
        query = query.or(`nome_cliente.ilike.%${filters.search}%,telefone_cliente.ilike.%${filters.search}%,servico_nome.ilike.%${filters.search}%`);
      }

      // Calcular paginação
      const { count } = await supabase
        .from('agendamentos')
        .select('*', { count: 'exact', head: true });

      setTotalItems(count || 0);
      const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
      setTotalPages(totalPages);

      // Buscar dados com paginação
      const { data, error: fetchError } = await query
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (fetchError) throw fetchError;
      setAppointments(data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments(prev => prev.map(app => app.id === id ? data : app));
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const deleteAppointment = async (id) => {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Telefone', 'Serviço', 'Data', 'Horário', 'Status'];
    const csvContent = [
      headers.join(','),
      ...appointments.map(app => [
        app.nome_cliente,
        app.telefone_cliente,
        app.servico_nome,
        app.data,
        app.horario,
        app.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `agenda_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  useEffect(() => {
    fetchAppointments(currentPage);
  }, [filters, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const resetPagination = () => {
    setCurrentPage(1);
    fetchAppointments(1, true);
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Agendamentos</h2>
        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Exportar CSV
          </button>
          <button
            onClick={() => resetPagination()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Lista de agendamentos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum agendamento encontrado
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.nome_cliente}</h3>
                        <p className="text-sm text-gray-600">{appointment.telefone_cliente}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {appointment.servico_nome}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_COLORS[appointment.status] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                      <span>{appointment.data}</span>
                      <span>{appointment.horario}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`https://wa.me/55${appointment.telefone_cliente.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      WhatsApp
                    </a>
                    {appointment.status === 'confirmado' && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteAppointment(appointment.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Página {currentPage} de {totalPages} ({totalItems} agendamentos)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};