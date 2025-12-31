"use client"
import Sidebar from '../components/Sidebar'

export default function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-white/60 mb-8">Personalize sua conta</p>
          
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Perfil</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Nome da Empresa</label>
                  <input
                    type="text"
                    defaultValue="Minha Loja Exemplo"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-white/80 text-sm mb-2 block">Email</label>
                  <input
                    type="email"
                    defaultValue="contato@empresa.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Webhook URL</h2>
              <input
                type="text"
                placeholder="https://seu-erp.com/webhook"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            
            <button className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition">
              Salvar Alterações
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
