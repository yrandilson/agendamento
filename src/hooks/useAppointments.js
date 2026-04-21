import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gerenciar agendamentos
 * Fornece lógica comum para busca, criação e atualização de agendamentos
 */
export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Busca agendamentos com filtros opcionais
   * @param {Object} filters - Filtros de busca
   * @param {string} filters.data - Filtrar por data específica
   * @param {string} filters.status - Filtrar por status
   * @param {string} filters.search - Termo de busca
   */
  const fetchAppointments = async (filters = {}) => {
    try {
      setLoading(true);
      clearError();

      let query = supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: true })
        .order('horario', { ascending: true });

      // Aplicar filtros
      if (filters.data) {
        query = query.eq('data', filters.data);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.search) {
        query = query.or(`nome_cliente.ilike.%${filters.search}%,telefone_cliente.ilike.%${filters.search}%,servico_nome.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria um novo agendamento
   * @param {Object} appointmentData - Dados do agendamento
   */
  const createAppointment = async (appointmentData) => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from('agendamentos')
        .insert([appointmentData])
        .select()
        .single();

      if (error) throw error;
      
      setAppointments(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza um agendamento existente
   * @param {string} id - ID do agendamento
   * @param {Object} updates - Dados para atualizar
   */
  const updateAppointment = async (id, updates) => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from('agendamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAppointments(prev => prev.map(app => app.id === id ? data : app));
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exclui um agendamento
   * @param {string} id - ID do agendamento
   */
  const deleteAppointment = async (id) => {
    try {
      setLoading(true);
      clearError();

      const { error } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAppointments(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    clearError
  };
};