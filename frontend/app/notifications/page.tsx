"use client"
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  
  useEffect(() => {
    // Mock data
    setNotifications([
      { id: '1', type: 'sale', client_name: 'João Silva', telefone: '5511999999999', valor: 150.00, status: 'pending' },
      { id: '2', type: 'quote', client_name: 'Maria Santos', telefone: '5511888888888', valor: 0, status: 'sent' },
      { id: '3', type: 'payment', client_name: 'Pedro Costa', telefone: '5511777777777', valor: 350.00, status: 'failed' },
    ])
  }, [])

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-orange-500/20 text-orange-400',
      sent: 'bg-emerald-500/20 text-emerald-400',
      failed: 'bg-red-500/20 text-red-400',
    }
    const labels = {
      pending: 'Pendente',
      sent: 'Enviado',
      failed: 'Falhou',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">Notificações</h1>
            <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition">
              Enviar Lote
            </button>
          </div>
          
          <div className="flex gap-4 mb-6">
            {['all', 'pending', 'sent', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium capitalize ${
                  filter === f ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-white/60 font-medium">Cliente</th>
                  <th className="text-left p-4 text-white/60 font-medium">Tipo</th>
                  <th className="text-left p-4 text-white/60 font-medium">Valor</th>
                  <th className="text-left p-4 text-white/60 font-medium">Status</th>
                  <th className="text-left p-4 text-white/60 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-white">
                      <div className="font-medium">{notif.client_name}</div>
                      <div className="text-white/40 text-sm">{notif.telefone}</div>
                    </td>
                    <td className="p-4 text-white capitalize">{notif.type}</td>
                    <td className="p-4 text-white">
                      {notif.valor > 0 ? `R$ ${notif.valor.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4">{getStatusBadge(notif.status)}</td>
                    <td className="p-4">
                      <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                        Reenviar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
