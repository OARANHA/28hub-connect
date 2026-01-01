"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { api, DashboardData } from '@/lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { tenantId, apiKey, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    const fetchDashboard = async () => {
      try {
        if (tenantId && apiKey) {
          const data = await api.getDashboard(tenantId, apiKey)
          setStats(data)
        }
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [tenantId, apiKey, isAuthenticated, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-white text-xl">Carregando...</div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-red-400">
            {error || 'Não foi possível carregar os dados'}
          </div>
        </main>
      </div>
    )
  }

  const isTrial = stats.plan === 'trial'
  const trialDaysLeft = stats.trial_ends
    ? Math.max(0, Math.ceil((new Date(stats.trial_ends).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-white">Dashboard Executivo</h1>
            {isTrial && (
              <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl transition">
                Fazer Upgrade Pro
              </button>
            )}
          </div>
          <p className="text-white/60 mb-8">Visão geral das suas notificações WhatsApp</p>

          {isTrial && trialDaysLeft > 0 && (
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 font-semibold">Plano Trial</p>
                  <p className="text-white/60 text-sm">Seu período de teste termina em {trialDaysLeft} dias</p>
                </div>
                <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition">
                  Fazer Upgrade Agora
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition">
              <div className="text-emerald-400 text-sm mb-2">MRR</div>
              <div className="text-3xl font-bold text-white">{stats.mrr}</div>
              <div className="text-emerald-400/60 text-xs mt-2">Receita Mensal</div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition">
              <div className="text-orange-400 text-sm mb-2">Pendentes</div>
              <div className="text-3xl font-bold text-white">{stats.pending_notifications}</div>
              <div className="text-orange-400/60 text-xs mt-2">Aguardando envio</div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-blue-500/30 transition">
              <div className="text-blue-400 text-sm mb-2">Hoje</div>
              <div className="text-3xl font-bold text-white">{stats.today_notifications}</div>
              <div className="text-blue-400/60 text-xs mt-2">Notificações enviadas</div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-green-500/30 transition">
              <div className="text-green-400 text-sm mb-2">WhatsApp</div>
              <div className="text-lg font-bold text-white capitalize">
                {stats.whatsapp_status === 'connected' ? 'Conectado' : 'Desconectado'}
              </div>
              <div className={`text-xs mt-2 ${stats.whatsapp_status === 'connected' ? 'text-green-400/60' : 'text-red-400/60'}`}>
                {stats.whatsapp_status === 'connected' ? 'Pronto para enviar' : 'Configure seu WhatsApp'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Atividades Recentes</h2>
              <div className="space-y-3">
                {[
                  { id: 1, action: 'Notificação enviada', client: 'João Silva', time: '5 minutos atrás', status: 'sent' },
                  { id: 2, action: 'Nova venda registrada', client: 'Maria Santos', time: '15 minutos atrás', status: 'pending' },
                  { id: 3, action: 'Pagamento confirmado', client: 'Pedro Costa', time: '30 minutos atrás', status: 'sent' },
                ].map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${activity.status === 'sent' ? 'bg-emerald-400' : 'bg-orange-400'}`}></div>
                      <div>
                        <span className="text-white">{activity.action}</span>
                        <span className="text-white/60 ml-2">• {activity.client}</span>
                      </div>
                    </div>
                    <span className="text-white/40 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Resumo do Dia</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                      💰
                    </div>
                    <div>
                      <div className="text-white font-medium">Vendas Hoje</div>
                      <div className="text-white/60 text-sm">Total de vendas processadas</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.sales_today || 0}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                      📤
                    </div>
                    <div>
                      <div className="text-white font-medium">Enviadas Hoje</div>
                      <div className="text-white/60 text-sm">Notificações enviadas</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.sent_today || stats.today_notifications}</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                      ⏳
                    </div>
                    <div>
                      <div className="text-white font-medium">Pendentes</div>
                      <div className="text-white/60 text-sm">Aguardando envio</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.pending_notifications}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
