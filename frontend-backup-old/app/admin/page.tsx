"use client"
import { useEffect, useState } from 'react'
import { api, AdminDashboardStats, Tenant } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingPlan, setUpdatingPlan] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, tenantsData] = await Promise.all([
          api.getAdminDashboard(),
          api.getTenants(),
        ])
        setStats(dashboardData)
        setTenants(tenantsData)
      } catch (err) {
        setError('Failed to load admin data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleUpdatePlan = async (tenantId: string, newPlan: string) => {
    setUpdatingPlan(tenantId)
    try {
      await api.updateTenantPlan(tenantId, newPlan)
      // Refresh data
      const [dashboardData, tenantsData] = await Promise.all([
        api.getAdminDashboard(),
        api.getTenants(),
      ])
      setStats(dashboardData)
      setTenants(tenantsData)
    } catch (err) {
      console.error('Failed to update plan:', err)
      alert('Falha ao atualizar plano')
    } finally {
      setUpdatingPlan(null)
    }
  }

  const getPlanBadge = (plan: string) => {
    const styles = {
      trial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      pro: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    }
    const labels = {
      trial: 'Trial',
      pro: 'Pro',
      enterprise: 'Enterprise',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[plan as keyof typeof styles]}`}>
        {labels[plan as keyof typeof labels]}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl">Carregando...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-8">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-red-400">
          {error}
        </div>
      </div>
    )
  }

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
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-yellow-500/30 transition">
            <div className="text-4xl font-black text-yellow-400 mb-2">{stats?.mrr || 'R$ 0'}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">MRR Mensal</p>
            <div className="text-green-400 font-bold mt-2">+23% vs mês anterior</div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-white/30 transition">
            <div className="text-4xl font-black text-white">{stats?.total_clients || 0}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">Clientes Totais</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-emerald-500/30 transition">
            <div className="text-4xl font-black text-emerald-400">{stats?.pro_clients || 0}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">Pro Pagantes</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 hover:border-orange-500/30 transition">
            <div className="text-4xl font-black text-orange-400">{stats?.trial_clients || 0}</div>
            <p className="text-white/80 text-sm uppercase tracking-wider">Trial 7 dias</p>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">📊 Distribuição de Planos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
              <div className="text-orange-400 text-sm mb-2">Trial</div>
              <div className="text-3xl font-bold text-white">{stats?.trial_clients || 0}</div>
              <div className="text-white/60 text-sm mt-2">
                {stats?.total_clients ? Math.round((stats.trial_clients / stats.total_clients) * 100) : 0}% do total
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
              <div className="text-emerald-400 text-sm mb-2">Pro</div>
              <div className="text-3xl font-bold text-white">{stats?.pro_clients || 0}</div>
              <div className="text-white/60 text-sm mt-2">
                {stats?.total_clients ? Math.round((stats.pro_clients / stats.total_clients) * 100) : 0}% do total
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="text-purple-400 text-sm mb-2">Enterprise</div>
              <div className="text-3xl font-bold text-white">
                {stats?.total_clients && stats.pro_clients && stats.trial_clients
                  ? stats.total_clients - stats.pro_clients - stats.trial_clients
                  : 0}
              </div>
              <div className="text-white/60 text-sm mt-2">
                {stats?.total_clients && stats.pro_clients && stats.trial_clients
                  ? Math.round(((stats.total_clients - stats.pro_clients - stats.trial_clients) / stats.total_clients) * 100)
                  : 0}% do total
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Clientes */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">👥 Clientes Ativos</h2>
            <div className="flex gap-4">
              <div className="text-white/60 text-sm">
                Taxa de Conversão: <span className="text-emerald-400 font-bold">{stats?.conversion_rate || '0%'}</span>
              </div>
              <div className="text-white/60 text-sm">
                Churn Rate: <span className="text-red-400 font-bold">{stats?.churn_rate || '0%'}</span>
              </div>
            </div>
          </div>

          {tenants.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-white/60">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4">Cliente</th>
                    <th className="text-left py-4">Plano</th>
                    <th className="text-left py-4">WhatsApp</th>
                    <th className="text-left py-4">Status</th>
                    <th className="text-left py-4">MRR</th>
                    <th className="text-left py-4">Criado em</th>
                    <th className="text-left py-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-white/10 hover:bg-white/5 transition">
                      <td className="py-4 font-medium">{tenant.name}</td>
                      <td>{getPlanBadge(tenant.plan)}</td>
                      <td className="text-white/60">{tenant.wa_number}</td>
                      <td>{getStatusBadge(tenant.status)}</td>
                      <td className="text-white/60">R$ {tenant.mrr.toFixed(2)}</td>
                      <td className="text-white/60 text-sm">
                        {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdatePlan(tenant.id, 'pro')}
                            disabled={updatingPlan === tenant.id || tenant.plan === 'pro'}
                            className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs hover:bg-yellow-500/30 transition disabled:opacity-50"
                          >
                            {updatingPlan === tenant.id ? '...' : 'Pro'}
                          </button>
                          <button
                            onClick={() => handleUpdatePlan(tenant.id, 'enterprise')}
                            disabled={updatingPlan === tenant.id || tenant.plan === 'enterprise'}
                            className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/30 transition disabled:opacity-50"
                          >
                            {updatingPlan === tenant.id ? '...' : 'Enterprise'}
                          </button>
                          <button className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition">
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
