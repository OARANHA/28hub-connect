"use client"
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  
  useEffect(() => {
    // Mock data - in production: fetch('/api/v1/28hub/{tenant_id}/dashboard')
    setStats({
      tenant_name: "Minha Loja Exemplo",
      plan: "trial",
      mrr: "R$ 0",
      pending_notifications: 384,
      today_notifications: 127,
      whatsapp_status: "connected",
      trial_ends: "2026-01-07"
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Executivo</h1>
          <p className="text-white/60 mb-8">Visão geral das suas notificações WhatsApp</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="text-emerald-400 text-sm mb-2">MRR</div>
              <div className="text-3xl font-bold text-white">{stats?.mrr}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="text-orange-400 text-sm mb-2">Pendentes</div>
              <div className="text-3xl font-bold text-white">{stats?.pending_notifications}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="text-blue-400 text-sm mb-2">Hoje</div>
              <div className="text-3xl font-bold text-white">{stats?.today_notifications}</div>
            </div>
            
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="text-green-400 text-sm mb-2">WhatsApp</div>
              <div className="text-lg font-bold text-white capitalize">{stats?.whatsapp_status}</div>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Atividades Recentes</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    <span className="text-white">Notificação #{i} enviada</span>
                  </div>
                  <span className="text-white/40 text-sm">Há {i * 5} minutos</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
