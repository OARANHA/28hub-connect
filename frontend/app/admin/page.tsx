"use client"
import { useEffect, useState } from 'react'

interface DashboardStats {
  mrr: string
  total_clients: number
  trial_clients: number
  pro_clients: number
  churn_rate: string
  conversion_rate: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  
  useEffect(() => {
    fetch('/api/v1/admin/dashboard')
      .then(res => res.json())
      .then(setStats)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            28hub Connect ADMIN
          </h1>
          <p className="text-xl text-white/80">Painel Executivo • {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Cards MRR */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <div className="text-4xl font-black text-yellow-400 mb-2">{stats?.mrr || 'R$ 0'}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">MRR Mensal</p>
            <div className="text-green-400 font-bold mt-2">+23% vs mês anterior</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <div className="text-4xl font-black text-white">{stats?.total_clients || 0}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">Clientes Totais</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <div className="text-4xl font-black text-emerald-400">{stats?.pro_clients || 0}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">Pro Pagantes</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8">
            <div className="text-4xl font-black text-orange-400">{stats?.trial_clients || 0}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">Trial 7 dias</p>
          </div>
        </div>

        {/* Tabela Clientes */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">👥 Clientes Ativos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-4">Cliente</th>
                  <th className="text-left py-4">Plano</th>
                  <th className="text-left py-4">WhatsApp</th>
                  <th className="text-left py-4">Status</th>
                  <th className="text-left py-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-4 font-medium">Empresa Teste</td>
                  <td><span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">Trial</span></td>
                  <td>5511999999999</td>
                  <td><span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Ativo</span></td>
                  <td>
                    <button className="px-4 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30">
                      Upgrade Pro
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
