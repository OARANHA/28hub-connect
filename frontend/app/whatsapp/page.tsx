"use client"
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'

export default function WhatsApp() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [status, setStatus] = useState('disconnected')
  
  const handleConnect = async () => {
    // Mock QR code generation
    setQrCode('mock_qr_code_base64_image')
    setStatus('qr_pending')
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
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition"
                  >
                    Conectar WhatsApp
                  </button>
                </div>
              )}
              
              {status === 'qr_pending' && qrCode && (
                <div className="text-center">
                  <p className="text-white mb-4">Escaneie o QR Code</p>
                  <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex items-center justify-center mb-4">
                    <span className="text-gray-400">QR Code</span>
                  </div>
                  <p className="text-white/60 text-sm">Abra WhatsApp {'>'} Menu {'>'} Dispositivos Conectados</p>
                </div>
              )}
              
              {status === 'connected' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl">✅</span>
                  </div>
                  <p className="text-emerald-400 font-semibold mb-2">WhatsApp Conectado!</p>
                  <p className="text-white/60">Seu número está pronto para enviar notificações</p>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
