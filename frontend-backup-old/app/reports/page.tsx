"use client"
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'

export default function Reports() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-2">Relatórios</h1>
          <p className="text-white/60 mb-8">Análise e métricas do seu negócio</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { period: 'Mensal', description: 'Visão completa do mês atual', icon: '📅' },
              { period: 'Semanal', description: 'Análise semanal detalhada', icon: '📊' },
              { period: 'Diária', description: 'Métricas do dia', icon: '📈' },
            ].map((report) => (
              <div
                key={report.period}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition cursor-pointer group"
              >
                <div className="text-4xl mb-4">{report.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition">
                  Relatório {report.period}
                </h3>
                <p className="text-white/60 text-sm mb-4">{report.description}</p>
                <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition">
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>

          {/* Recent Reports */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white mb-4">Relatórios Recentes</h2>
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60 font-medium">Relatório</th>
                    <th className="text-left p-4 text-white/60 font-medium">Período</th>
                    <th className="text-left p-4 text-white/60 font-medium">Data</th>
                    <th className="text-left p-4 text-white/60 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Vendas Mensal', period: 'Janeiro 2026', date: '01/01/2026' },
                    { name: 'Notificações Semanal', period: 'Semana 52', date: '29/12/2025' },
                    { name: 'Performance Diária', period: '31/12/2025', date: '31/12/2025' },
                  ].map((report, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 text-white font-medium">{report.name}</td>
                      <td className="p-4 text-white/60">{report.period}</td>
                      <td className="p-4 text-white/60">{report.date}</td>
                      <td className="p-4">
                        <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                          Baixar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
