import { supabase } from './supabase'

async function validarPorTabelaAdmins(user) {
  const { data, error } = await supabase
    .from('admins')
    .select('id')
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .limit(1)

  if (error) {
    return null
  }

  return (data || []).length > 0
}

export async function isAdminUser(user) {
  if (!user) return false

  // Compatibilidade temporaria: whitelist por variavel de ambiente.
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || '').trim().toLowerCase()
  if (adminEmail && (user.email || '').toLowerCase() === adminEmail) {
    return true
  }

  // Modo profissional: tabela admins no Supabase.
  const viaTabela = await validarPorTabelaAdmins(user)
  if (viaTabela === null) {
    return false
  }

  return viaTabela
}