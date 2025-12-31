"use client"
import Sidebar from '../components/Sidebar'

export default function Reports() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="max-w-7xl">
          <h1 className="text-4xl font-bold text-white mb-2">Relatórios</h1>
          <p className="text-white/60 mb-8">Análise e métricas do seu negócio</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Mensal', 'Semanal', 'Diária'].map((period) => (
              <div key={period} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 transition cursor-pointer">
                <h3 className="text-xl font-bold text-white mb-2">Relatório {period}</h3>
                <p className="text-white/60 text-sm mb-4">Visualize o desempenho período {period}</p>
                <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30">
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
