"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MessageSquare, Clock, CheckCircle, Bell, TrendingUp } from "lucide-react";

interface ClientStats {
  salesToday: number;
  salesGrowth: number;
  notificationsSent: number;
  notificationsTotal: number;
  pending: number;
  successRate: number;
}

export default function ClientDashboardPage() {
  const [stats, setStats] = useState<ClientStats>({
    salesToday: 12450,
    salesGrowth: 23,
    notificationsSent: 23,
    notificationsTotal: 25,
    pending: 3,
    successRate: 98,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard do Cliente</h1>
        <p className="text-neutral-400 mt-1">Visão geral das suas atividades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Vendas Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              R$ {stats.salesToday.toLocaleString('pt-BR')}
            </div>
            <Badge variant="default" className="bg-green-500/20 text-green-400 mt-2">
              +{stats.salesGrowth}%
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Notificações Enviadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.notificationsSent}/{stats.notificationsTotal}
            </div>
            <div className="text-xs text-neutral-500 mt-2">WhatsApp + EvoAI</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats.pending}</div>
            <div className="text-xs text-neutral-500 mt-2">Aguardando processamento</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              Taxa de Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-500">{stats.successRate}%</div>
            <div className="text-xs text-neutral-500 mt-2">Últimos 30 dias</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-500" />
              Notificações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { type: "Venda", message: "Nova venda de R$ 1.500,00 - João Silva", time: "10:45" },
                { type: "Pedido", message: "Pedido #12345 confirmado", time: "10:30" },
                { type: "Pagamento", message: "Pagamento recebido - R$ 850,00", time: "09:15" },
                { type: "Entrega", message: "Entrega realizada - Pedido #12340", time: "08:50" },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                  <div className="mt-0.5">
                    {item.type === "Venda" && <DollarSign className="h-4 w-4 text-green-500" />}
                    {item.type === "Pedido" && <MessageSquare className="h-4 w-4 text-blue-500" />}
                    {item.type === "Pagamento" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    {item.type === "Entrega" && <TrendingUp className="h-4 w-4 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white">{item.message}</div>
                    <div className="text-xs text-neutral-500 mt-1">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">
              Status da Conexão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-white">WhatsApp</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Conectado</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-white">EvoAI</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Ativo</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-white">Evolution API</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Online</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-white">n8n Workflows</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400">Rodando</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
