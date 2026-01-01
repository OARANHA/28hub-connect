"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, MessageSquare, Clock, CheckCircle, Bell, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import api28hub from "@/lib/api-28hub";

interface DashboardData {
  tenant_id: string;
  tenant_name: string;
  plan: string;
  mrr: string;
  pending_notifications: number;
  failed_notifications: number;
  today_notifications: number;
  total_sent: number;
  whatsapp_status: string | null;
  trial_ends: string;
  trial_warning: boolean;
  status: string;
}

interface Notification {
  client_name: string;
  value: number;
  nf: string;
  status: string;
  created_at: string;
}

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('28hub_tenant_id');
      if (!tenantId) {
        console.error('Tenant ID não encontrado');
        return;
      }

      const apiKey = localStorage.getItem('28hub_api_key') || '';
      const response = await api28hub.getDashboard(tenantId, apiKey);
      const data = await response.json();
      setDashboard(data);
      
      // Buscar notificações recentes
      const notifResponse = await api28hub.getNotifications(tenantId, apiKey, { limit: 10 });
      const notifData = await notifResponse.json();
      setNotifications(notifData.notifications || []);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">Erro ao carregar dashboard</p>
          <p className="text-neutral-400 text-sm mt-2">Verifique se você está logado</p>
        </div>
      </div>
    );
  }

  const successRate = dashboard.today_notifications > 0
    ? Math.round((dashboard.total_sent / dashboard.today_notifications) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard do Cliente</h1>
          <p className="text-neutral-400 mt-1">
            {dashboard.tenant_name} - Plano {dashboard.plan.toUpperCase()}
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Alerta de Trial */}
      {dashboard.plan === 'trial' && dashboard.trial_warning && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-orange-400 font-medium">Seu período de trial está terminando!</p>
                <p className="text-orange-300/70 text-sm">
                  Seu trial termina em {new Date(dashboard.trial_ends).toLocaleDateString('pt-BR')}.
                  Faça upgrade para continuar usando o serviço.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              MRR Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {dashboard.mrr}
            </div>
            <div className="text-xs text-neutral-500 mt-2">Receita Mensal Recorrente</div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-400 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Notificações Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboard.total_sent}/{dashboard.today_notifications}
            </div>
            <div className="text-xs text-neutral-500 mt-2">Enviadas / Total</div>
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
            <div className="text-3xl font-bold text-orange-500">{dashboard.pending_notifications}</div>
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
            <div className="text-3xl font-bold text-emerald-500">{successRate}%</div>
            <div className="text-xs text-neutral-500 mt-2">Últimas notificações</div>
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
              {notifications.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">Nenhuma notificação encontrada</p>
              ) : (
                notifications.map((notif, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-neutral-800 rounded-lg">
                    <div className="mt-0.5">
                      {notif.status === 'sent' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {notif.status === 'pending' && <Clock className="h-4 w-4 text-orange-500" />}
                      {notif.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-white">
                        {notif.client_name} - R$ {notif.value?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        NF: {notif.nf} • {new Date(notif.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <Badge className={
                      notif.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                      notif.status === 'pending' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }>
                      {notif.status === 'sent' ? 'Enviado' :
                       notif.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </Badge>
                  </div>
                ))
              )}
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
                  <div className={`h-3 w-3 rounded-full ${dashboard.whatsapp_status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-white">WhatsApp</span>
                </div>
                <Badge className={
                  dashboard.whatsapp_status
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }>
                  {dashboard.whatsapp_status || 'Desconectado'}
                </Badge>
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
