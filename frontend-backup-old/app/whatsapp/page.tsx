"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import { useAuth } from '@/contexts/AuthContext'

export default function WhatsApp() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState('disconnected')
  const [connecting, setConnecting] = useState(false)

  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push('/')
    return null
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      // Mock QR code generation - in production: call API
      await new Promise(resolve => setTimeout(resolve, 1000))
      setQrCode('mock_qr_code_base64_image')
      setStatus('qr_pending')
    } catch (err) {
      console.error('Failed to connect:', err)
      alert('Falha ao conectar WhatsApp')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = () => {
    setStatus('disconnected')
    setQrCode(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">WhatsApp Connect</h1>
          <p className="text-white/60 mb-8">Conecte seu número WhatsApp para envio de notificações</p>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Status da Conexão</h2>

              {status === 'disconnected' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">📱</span>
                  </div>
                  <p className="text-white mb-6">Conecte seu WhatsApp para começar</p>
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition disabled:opacity-50"
                  >
                    {connecting ? 'Conectando...' : 'Conectar WhatsApp'}
                  </button>
                </div>
              )}

              {status === 'qr_pending' && qrCode && (
                <div className="text-center">
                  <p className="text-white mb-4">Escaneie o QR Code</p>
                  <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center mb-4">
                    <span className="text-gray-400">QR Code</span>
                  </div>
                  <p className="text-white/60 text-sm">
                    Abra WhatsApp {'>'} Menu {'>'} Dispositivos Conectados
                  </p>
                  <button
                    onClick={() => {
                      setStatus('connected')
                      setQrCode(null)
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition"
                  >
                    Simular Conexão
                  </button>
                </div>
              )}

              {status === 'connected' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">✅</span>
                  </div>
                  <p className="text-emerald-400 font-semibold mb-2">WhatsApp Conectado!</p>
                  <p className="text-white/60 mb-4">Seu número está pronto para enviar notificações</p>
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition"
                  >
                    Desconectar
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Como Funciona</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="text-white font-medium">Clique em Conectar</p>
                    <p className="text-white/60 text-sm">Gere o QR Code para vincular seu número</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="text-white font-medium">Escaneie o QR</p>
                    <p className="text-white/60 text-sm">Abra WhatsApp e escaneie o código</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="text-white font-medium">Comece a Usar</p>
                    <p className="text-white/60 text-sm">Envie notificações automáticas</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-blue-400 text-sm font-medium mb-2">ℹ️ Importante</p>
                <p className="text-white/60 text-sm">
                  Mantenha seu WhatsApp conectado para garantir o envio contínuo de notificações.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
