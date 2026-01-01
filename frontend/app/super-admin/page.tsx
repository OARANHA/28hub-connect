"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Users, DollarSign, TrendingUp, Activity } from "lucide-react";

interface AdminStats {
  mrr: number;
  clients: number;
  trialConversion: number;
  activeTenants: number;
  messagesToday: number;
}

export default function SuperAdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    mrr: 0,
    clients: 0,
    trialConversion: 0,
    activeTenants: 0,
    messagesToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular dados - em produção, buscar da API
    setTimeout(() => {
      setStats({
        mrr: 72000,
        clients: 42,
        trialConversion: 35,
        activeTenants: 38,
        messagesToday: 15234,
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Super Admin - 28hub Connect</h1>
        <p className="text-neutral-400 mt-1">Visão geral da plataforma</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-400">Carregando dados...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  MRR Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">
                  R$ {stats.mrr.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Receita recorrente mensal</div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Clientes Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.clients}</div>
                <div className="text-xs text-neutral-500 mt-1">{stats.activeTenants} ativos</div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Conversão Trial→Pro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-500">
                  {stats.trialConversion}%
                </div>
                <div className="text-xs text-neutral-500 mt-1">Taxa de conversão</div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Mensagens Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.messagesToday.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-neutral-500 mt-1">WhatsApp + EvoAI</div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-white">
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-white">Gerenciar Clientes</div>
                    <div className="text-xs text-neutral-400">Ver todos os tenants</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <div>
                    <div className="font-medium text-white">Relatórios</div>
                    <div className="text-xs text-neutral-400">Análise de métricas</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-left">
                  <Activity className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium text-white">Monitoramento</div>
                    <div className="text-xs text-neutral-400">Status dos serviços</div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
