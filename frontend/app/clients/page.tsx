"use client"
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    // Mock data
    setClients([
      { id: '1', name: 'Empresa Teste', email: 'contato@empresa.com', plan: 'trial', status: 'active' },
    ])
  }, [])

  const getPlanBadge = (plan: string) => {
    const styles = {
      trial: 'bg-orange-500/20 text-orange-400',
      pro: 'bg-emerald-500/20 text-emerald-400',
      enterprise: 'bg-purple-500/20 text-purple-400',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${styles[plan as keyof typeof styles]}`}>
        {plan}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-2">Meus Clientes</h1>
          <p className="text-white/60 mb-8">Gerencie sua base de clientes</p>
          
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
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
                  <tr key={client.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-white font-medium">{client.name}</td>
                    <td className="p-4 text-white/60">{client.email}</td>
                    <td className="p-4">{getPlanBadge(client.plan)}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">
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
          </div>
        </div>
      </main>
    </div>
  )
}
