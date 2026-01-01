"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Mock data - in production: fetch from API
    setClients([
      { id: '1', name: 'Empresa Teste', email: 'contato@empresa.com', plan: 'trial', status: 'active' },
    ])
    setLoading(false)
  }, [isAuthenticated, router])

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
              <h1 className="text-4xl font-bold text-white mb-2">Meus Clientes</h1>
              <p className="text-white/60">Gerencie sua base de clientes</p>
            </div>
            <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition">
              Adicionar Cliente
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
            {clients.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-white/60">Nenhum cliente encontrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/60 font-medium">Nome</th>
                    <th className="text-left p-4 text-white/60 font-medium">Email</th>
                    <th className="text-left p-4 text-white/60 font-medium">Plano</th>
                    <th className="text-left p-4 text-white/60 font-medium">Status</th>
                    <th className="text-left p-4 text-white/60 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4 text-white font-medium">{client.name}</td>
                      <td className="p-4 text-white/60">{client.email}</td>
                      <td className="p-4">{getPlanBadge(client.plan)}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs">
                          Ativo
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium mr-3">
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
