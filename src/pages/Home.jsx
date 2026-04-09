import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.22),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.22),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.18),transparent_40%)]" />

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        <header className="flex items-center justify-between">
          <h1 className="text-lg md:text-xl font-black tracking-wide">Agenda Studio</h1>
          <Link to="/admin" className="text-sm px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
            Acesso Admin
          </Link>
        </header>

        <main className="pt-16 md:pt-24">
          <div className="max-w-3xl">
            <p className="inline-flex text-xs uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30">
              Agendamento Inteligente
            </p>
            <h2 className="text-4xl md:text-6xl font-black leading-tight mt-5">
              Reserve seu horario em segundos com uma experiencia moderna.
            </h2>
            <p className="text-slate-300 text-lg mt-5 max-w-2xl">
              Entre com sua conta para liberar o formulario de agendamento, escolher servico, data e horario com confirmacao imediata.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/cliente"
                className="px-6 py-3 rounded-2xl bg-cyan-400 text-slate-950 font-black hover:bg-cyan-300 transition-all"
              >
                Entrar ou Criar Conta
              </Link>
              <Link
                to="/agendar"
                className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 font-bold hover:bg-white/20 transition-all"
              >
                Ir para Agendamento
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-14">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
              <p className="text-cyan-300 text-sm font-bold">1. Login rapido</p>
              <p className="text-slate-200 mt-1">Conta por e-mail e senha para identificar cliente e historico.</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
              <p className="text-indigo-300 text-sm font-bold">2. Escolha guiada</p>
              <p className="text-slate-200 mt-1">Fluxo em etapas para servico, data, horario e confirmacao.</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
              <p className="text-emerald-300 text-sm font-bold">3. Confirmacao</p>
              <p className="text-slate-200 mt-1">Agendamento salvo no sistema e pronto para acompanhamento no painel.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}