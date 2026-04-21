import { useState } from 'react';

/**
 * Hook统一 para tratamento de erros
 * Fornece uma interface consistente para gerenciar erros em toda a aplicação
 */
export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Trata diferentes tipos de erros de forma padronizada
   * @param {Error|string} error - Erro a ser tratado
   * @returns {string} Mensagem de erro formatada
   */
  const handleError = (error) => {
    let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';
    
    if (!error) {
      return errorMessage;
    }

    // Se for string, usa diretamente
    if (typeof error === 'string') {
      errorMessage = error;
    }
    // Se for objeto Error, extrai mensagem
    else if (error.message) {
      errorMessage = error.message;
    }
    // Trata erros específicos do Supabase
    else if (error.code) {
      switch (error.code) {
        case '23505':
          errorMessage = 'Este horário acabou de ser ocupado. Por favor, escolha outro.';
          break;
        case 'PGRST116':
          errorMessage = 'Você não tem permissão para realizar esta ação.';
          break;
        case 'PGRST301':
          errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
          break;
        default:
          errorMessage = `Erro ${error.code}: ${error.message || errorMessage}`;
      }
    }

    setError(errorMessage);
    return errorMessage;
  };

  /**
   * Limpa o erro atual
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Executa uma função com tratamento de erros automático
   * @param {Function} fn - Função a ser executada
   * @param {Array} args - Argumentos da função
   * @returns {Promise} Resultado da função
   */
  const executeWithErrorHandling = async (fn, ...args) => {
    try {
      setLoading(true);
      clearError();
      return await fn(...args);
    } catch (err) {
      handleError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    setError,
    clearError,
    handleError,
    executeWithErrorHandling
  };
};