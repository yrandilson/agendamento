// api/notify.js — Vercel Serverless Function
// Envia notificação no WhatsApp quando cliente faz agendamento

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { nome, telefone, servico, data, horario } = req.body

  const instanceId = process.env.ZAPI_INSTANCE_ID
  const token = process.env.ZAPI_TOKEN
  const phoneAdmin = process.env.ZAPI_PHONE // seu número que recebe as notificações

  // Mensagem para o DONO do negócio
  const msgDono = `🔔 *Novo Agendamento!*\n\n👤 *Cliente:* ${nome}\n📱 *Telefone:* ${telefone}\n🛠 *Serviço:* ${servico}\n📅 *Data:* ${data}\n🕐 *Horário:* ${horario}`

  // Mensagem para o CLIENTE
  const msgCliente = `Olá ${nome}! ✅\n\nSeu agendamento foi confirmado!\n\n🛠 *${servico}*\n📅 ${data} às ${horario}\n\nQualquer dúvida, entre em contato. Até lá! 😊`

  try {
    const zapiBase = `https://api.z-api.io/instances/${instanceId}/token/${token}`

    // Notifica o dono
    await fetch(`${zapiBase}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneAdmin, message: msgDono })
    })

    // Notifica o cliente (formata o número)
    const clientePhone = telefone.replace(/\D/g, '')
    await fetch(`${zapiBase}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: `55${clientePhone}`, message: msgCliente })
    })

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Erro ao enviar WhatsApp:', err)
    res.status(500).json({ error: 'Falha ao enviar notificação' })
  }
}
