import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';
import { useErrorHandler } from './useErrorHandler';

/**
 * Contexto de autenticação global
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provedor de contexto de autenticação
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { handleError, error } = useErrorHandler();

  /**
   * Verifica se o usuário é admin
   */
  const checkAdminAccess = async (currentUser) => {
    try {
      // Verifica via variável de ambiente primeiro
      const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase();
      if (adminEmail && (currentUser.email || '').toLowerCase() === adminEmail) {
        return true;
      }

      // Verifica via tabela de admins
      const { data, error } = await supabase
        .from('admins')
        .select('ativo')
        .eq('user_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data?.ativo === true;
    } catch (err) {
      handleError(err);
      return false;
    }
  };

  /**
   * Realiza login do usuário
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || '',
        phone: data.user.user_metadata?.phone || ''
      };

      setUser(userData);
      const adminStatus = await checkAdminAccess(data.user);
      setIsAdmin(adminStatus);

      return true;
    } catch (err) {
      handleError(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Realiza logout do usuário
   */
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      sessionStorage.removeItem('adminSession');
    } catch (err) {
      handleError(err);
    }
  };

  /**
   * Verifica sessão atual ao carregar o componente
   */
  useEffect(() => {
    const checkSession = async () => {
      try {
        setLoading(true);
        
        // Verifica sessão admin no sessionStorage
        const adminSession = sessionStorage.getItem('adminSession');
        if (adminSession) {
          const sessionData = JSON.parse(adminSession);
          setUser(sessionData.user);
          setIsAdmin(sessionData.isAdmin);
          setLoading(false);
          return;
        }

        // Verifica sessão do Supabase
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (user) {
          const userData = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || '',
            phone: user.user_metadata?.phone || ''
          };
          
          setUser(userData);
          const adminStatus = await checkAdminAccess(user);
          setIsAdmin(adminStatus);
        }
      } catch (err) {
        handleError(err);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        sessionStorage.removeItem('adminSession');
      } else if (event === 'SIGNED_IN' && session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || '',
          phone: session.user.user_metadata?.phone || ''
        };
        
        setUser(userData);
        const adminStatus = await checkAdminAccess(session.user);
        setIsAdmin(adminStatus);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin,
      loading,
      login,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar o contexto de autenticação
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};