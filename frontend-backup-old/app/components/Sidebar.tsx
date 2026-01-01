"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const { plan, tenantName } = useAuth()

  const menuItems = [
    { icon: '🏠', label: 'Dashboard', href: '/dashboard' },
    { icon: '🔔', label: 'Notificações', href: '/notifications' },
    { icon: '📱', label: 'WhatsApp', href: '/whatsapp' },
    { icon: '👥', label: 'Clientes', href: '/clients' },
    { icon: '📊', label: 'Relatórios', href: '/reports' },
    { icon: '⚙️', label: 'Configurações', href: '/settings' },
  ]

  const getTrialDaysLeft = () => {
    // This would be calculated from the trial_ends date
    // For now, return a mock value
    return 5
  }

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-emerald-900 to-black border-r border-emerald-800/30 fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-xl">
            28
          </div>
          <span className="text-white font-bold text-lg">Hub Connect</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === item.href
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-6 left-6 right-6">
        {plan === 'trial' ? (
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
            <p className="text-yellow-400 text-sm font-medium mb-1">Plano Trial</p>
            <p className="text-white/60 text-xs">{getTrialDaysLeft()} de 7 dias restantes</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-emerald-400 text-sm font-medium mb-1">Plano {plan?.toUpperCase()}</p>
            <p className="text-white/60 text-xs">{tenantName || 'Empresa'}</p>
          </div>
        )}
      </div>
    </aside>
  )
}
