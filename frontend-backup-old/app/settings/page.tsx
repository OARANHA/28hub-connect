"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { api, TenantData } from '@/lib/api'

export default function Settings() {
  const [tenantData, setTenantData] = useState<TenantData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    wa_number: '',
  })

  const { tenantId, apiKey, tenantName, plan, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    setFormData({
      name: tenantName || '',
      wa_number: '',
    })
    setLoading(false)
  }, [isAuthenticated, tenantName, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a real implementation, you would call an API to update the tenant data
      // For now, we'll just show a success message
      alert('Configurações salvas com sucesso!')
    } catch (err) {
      console.error('Failed to save settings:', err)
      alert('Falha ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const getPlanBadge = (planValue: string | null) => {
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
    if (!planValue) return null
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[planValue as keyof typeof styles]}`}>
        {labels[planValue as keyof typeof labels]}
      </span>
    )
  }

  const maskApiKey = (key: string | null) => {
    if (!key) return 'N/A'
    return key.substring(0, 8) + '...' + key.substring(key.length - 4)
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
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-white/60 mb-8">Personalize sua conta</p>

          <div className="space-y-6">
            {/* Profile Section */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Perfil</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Nome da Empresa</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Email</label>
                  <input
                    type="email"
                    value="contato@empresa.com"
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Plan Section */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Plano Atual</h2>
                {getPlanBadge(plan)}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div>
                    <div className="text-white font-medium">Plano {plan?.toUpperCase()}</div>
                    <div className="text-white/60 text-sm">
                      {plan === 'trial' ? '7 dias de teste grátis' : plan === 'pro' ? 'R$ 97/mês' : 'R$ 297/mês'}
                    </div>
                  </div>
                  {plan === 'trial' && (
                    <button className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-lg transition">
                      Fazer Upgrade
                    </button>
                  )}
                  {plan === 'pro' && (
                    <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition">
                      Upgrade Enterprise
                    </button>
                  )}
                </div>

                {/* Plan Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-emerald-400 text-lg mb-2">✓</div>
                    <div className="text-white text-sm">Notificações Ilimitadas</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-emerald-400 text-lg mb-2">✓</div>
                    <div className="text-white text-sm">Integração ERP</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-emerald-400 text-lg mb-2">✓</div>
                    <div className="text-white text-sm">Relatórios Avançados</div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key Section */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Chave de API</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Sua Chave de API</label>
                  <div className="flex gap-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={maskApiKey(apiKey)}
                      readOnly
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/80 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
                    >
                      {showApiKey ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    Use esta chave para integrar com seu ERP via API
                  </p>
                </div>
              </div>
            </div>

            {/* Webhook Section */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Webhook URL</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">URL do Webhook</label>
                  <input
                    type="text"
                    placeholder="https://seu-erp.com/webhook"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
                  />
                  <p className="text-white/40 text-xs mt-2">
                    Configure o endpoint do seu ERP para receber notificações
                  </p>
                </div>
              </div>
            </div>

            {/* Templates Section */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Templates de Mensagem</h2>
              <div className="space-y-3">
                <a href="#" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                      💰
                    </div>
                    <div>
                      <div className="text-white font-medium">Template de Venda</div>
                      <div className="text-white/60 text-sm">Notificação de nova venda</div>
                    </div>
                  </div>
                  <span className="text-emerald-400">→</span>
                </a>
                <a href="#" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                      📋
                    </div>
                    <div>
                      <div className="text-white font-medium">Template de Orçamento</div>
                      <div className="text-white/60 text-sm">Notificação de orçamento</div>
                    </div>
                  </div>
                  <span className="text-emerald-400">→</span>
                </a>
                <a href="#" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                      💳
                    </div>
                    <div>
                      <div className="text-white font-medium">Template de Pagamento</div>
                      <div className="text-white/60 text-sm">Confirmação de pagamento</div>
                    </div>
                  </div>
                  <span className="text-emerald-400">→</span>
                </a>
              </div>
            </div>

            {/* Billing Status */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Status de Cobrança</h2>
              <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                    ✓
                  </div>
                  <div>
                    <div className="text-white font-medium">Cobrança em dia</div>
                    <div className="text-white/60 text-sm">Próxima cobrança em 01/02/2026</div>
                  </div>
                </div>
                <span className="text-emerald-400 font-semibold">Ativo</span>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
