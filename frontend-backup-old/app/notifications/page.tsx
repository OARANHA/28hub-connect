"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { api, Notification } from '@/lib/api'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [retrying, setRetrying] = useState<string | null>(null)

  const { tenantId, apiKey, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    const fetchNotifications = async () => {
      try {
        if (tenantId && apiKey) {
          const data = await api.getNotifications(tenantId, apiKey, {
            status: filter === 'all' ? undefined : filter,
            page,
            limit: 20,
          })
          setNotifications(data.items)
          setTotalPages(data.pages)
        }
      } catch (err) {
        setError('Failed to load notifications')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [tenantId, apiKey, isAuthenticated, filter, page, router])

  const handleRetry = async (notificationId: string) => {
    if (!tenantId || !apiKey) return

    setRetrying(notificationId)
    try {
      await api.retryNotification(tenantId, apiKey, notificationId)
      // Refresh notifications
      const data = await api.getNotifications(tenantId, apiKey, {
        status: filter === 'all' ? undefined : filter,
        page,
        limit: 20,
      })
      setNotifications(data.items)
    } catch (err) {
      console.error('Failed to retry notification:', err)
      alert('Falha ao tentar reenviar notificação')
    } finally {
      setRetrying(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      sent: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    const labels = {
      pending: 'Pendente',
      sent: 'Enviado',
      failed: 'Falhou',
    }
    const icons = {
      pending: '⏳',
      sent: '✓',
      failed: '✗',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]} {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      sale: 'Venda',
      quote: 'Orçamento',
      payment: 'Pagamento',
      reminder: 'Lembrete',
    }
    return labels[type as keyof typeof labels] || type
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Notificações</h1>
              <p className="text-white/60 mt-2">Gerencie suas notificações WhatsApp</p>
            </div>
            <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition">
              Enviar Lote
            </button>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-6 flex-wrap">
            {['all', 'pending', 'sent', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                  filter === f
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Todas' : f}
              </button>
            ))}
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            {notifications.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-white/60">Nenhuma notificação encontrada</p>
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-white/60 font-medium">Cliente</th>
                      <th className="text-left p-4 text-white/60 font-medium">Tipo</th>
                      <th className="text-left p-4 text-white/60 font-medium">Valor</th>
                      <th className="text-left p-4 text-white/60 font-medium">NF</th>
                      <th className="text-left p-4 text-white/60 font-medium">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium">Data</th>
                      <th className="text-left p-4 text-white/60 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((notif) => (
                      <tr key={notif.id} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="p-4">
                          <div className="text-white font-medium">{notif.client_name}</div>
                          <div className="text-white/40 text-sm">{notif.telefone}</div>
                        </td>
                        <td className="p-4 text-white capitalize">{getTypeLabel(notif.type)}</td>
                        <td className="p-4 text-white">
                          {notif.valor > 0 ? `R$ ${notif.valor.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4 text-white/60 text-sm">{notif.nf_number || '-'}</td>
                        <td className="p-4">{getStatusBadge(notif.status)}</td>
                        <td className="p-4 text-white/60 text-sm">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          {notif.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(notif.id)}
                              disabled={retrying === notif.id}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition disabled:opacity-50"
                            >
                              {retrying === notif.id ? '...' : 'Reenviar'}
                            </button>
                          )}
                          {notif.status === 'sent' && (
                            <button className="text-white/40 text-sm">Enviado</button>
                          )}
                          {notif.status === 'pending' && (
                            <button className="text-orange-400 text-sm">Aguardando</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="p-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/60 text-sm">
                      Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
