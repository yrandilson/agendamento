import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook para gerenciar serviços
 * Fornece lógica para buscar, criar e atualizar serviços
 */
export const useServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { handleError, error } = useErrorHandler();

  /**
   * Busca todos os serviços ativos
   */
  const fetchServices = async () => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cria um novo serviço
   * @param {Object} serviceData - Dados do serviço
   */
  const createService = async (serviceData) => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from('servicos')
        .insert([serviceData])
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => [...prev, data]);
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Atualiza um serviço existente
   * @param {string} id - ID do serviço
   * @param {Object} updates - Dados para atualizar
   */
  const updateService = async (id, updates) => {
    try {
      setLoading(true);
      clearError();

      const { data, error } = await supabase
        .from('servicos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setServices(prev => prev.map(service => service.id === id ? data : service));
      return data;
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Exclui um serviço
   * @param {string} id - ID do serviço
   */
  const deleteService = async (id) => {
    try {
      setLoading(true);
      clearError();

      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setServices(prev => prev.filter(service => service.id !== id));
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    // Aqui você poderia adicionar lógica para limpar o erro se estivesse usando um handler específico
  };

  // Buscar serviços ao montar o componente
  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    clearError
  };
};