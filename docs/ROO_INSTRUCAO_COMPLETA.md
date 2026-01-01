# 🤖 INSTRUÇÕES COMPLETAS PARA ROO - 28HUB CONNECT

## Contexto

ROO, você é o executor técnico do projeto **28Hub Connect**. Estas são suas instruções completas, organizadas por prioridade e sequência de execução.

---

## 📋 CHECKLIST GERAL

### Fase 1: Setup Inicial (1-2 dias)
- [ ] Clonar repositório `OARANHA/28hub-connect`
- [ ] Verificar estrutura de pastas
- [ ] Configurar `.env` com senhas unificadas
- [ ] Executar `docker compose up -d`
- [ ] Verificar saúde de todos os serviços

### Fase 2: Backend (2-3 dias)
- [ ] Implementar modelos SQLAlchemy
- [ ] Criar endpoints FastAPI
- [ ] Integrar Evolution API
- [ ] Integrar n8n workflows
- [ ] Testes unitários

### Fase 3: Frontend (2-3 dias)
- [ ] Setup Next.js + Tailwind
- [ ] Implementar dashboard executivo
- [ ] Integrar com API backend
- [ ] Testes E2E

### Fase 4: Deploy (1 dia)
- [ ] Deploy Render.com
- [ ] Configurar DNS
- [ ] Testes produção

---

## 🚀 INSTRUÇÕES DETALHADAS

### 1. SETUP REPOSITÓRIO

#### 1.1. Clonar e Verificar

```bash
# 1. Clonar repositório
git clone https://github.com/OARANHA/28hub-connect.git
cd 28hub-connect

# 2. Verificar estrutura esperada
ls -la
# Deve conter:
# - docker-compose.enterprise.yml
# - backend/
# - frontend/
# - docs/
# - init-databases.sql
```

#### 1.2. Configurar Ambiente

```bash
# 1. Copiar .env template
cp .env.example .env

# 2. Editar .env com senha UNIFICADA
nano .env
```

**Conteúdo `.env`**:

```bash
# PostgreSQL (SENHA UNIFICADA!)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=28hub2025
POSTGRES_DB=postgres

# 28Hub API
JWT_SECRET=28hub-enterprise-jwt-2025
API_KEY=28hub-enterprise-2025

# Evolution API
EVOLUTION_API_KEY=28hub-enterprise-2025

# n8n
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=28hub2025
```

#### 1.3. Subir Stack Docker

```bash
# 1. Limpar volumes anteriores (CUIDADO!)
docker compose -f docker-compose.enterprise.yml down -v
docker volume prune -f

# 2. Subir PostgreSQL primeiro
docker compose -f docker-compose.enterprise.yml up -d postgres
sleep 30  # Aguardar inicialização

# 3. Verificar databases criadas
docker exec 28hub-connect-enterprise-postgres-1 psql -U postgres -c "\l"
# Deve mostrar: 28hub, evolutiondb, n8n, evoai

# 4. Subir demais serviços
docker compose -f docker-compose.enterprise.yml up -d

# 5. Aguardar inicialização completa
sleep 60
```

#### 1.4. Verificar Saúde dos Serviços

```bash
# PostgreSQL
docker exec postgres psql -U postgres -c "SELECT version();"

# Redis
docker exec redis redis-cli PING
# Esperado: PONG

# Evolution API
curl -H "apikey: 28hub-enterprise-2025" http://localhost:8080/
# Esperado: {"status":"success"}

# 28Hub API
curl http://localhost:8000/health
# Esperado: {"status":"28hub Connect OK"}

# n8n
curl http://localhost:5678/healthz
# Esperado: {"status":"ok"}

# Frontend
curl http://localhost:3000
# Esperado: HTML
```

---

### 2. BACKEND - IMPLEMENTAÇÃO

#### 2.1. Modelos SQLAlchemy (backend/models.py)

**Implementar EXATAMENTE**:

```python
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from uuid import uuid4

Base = declarative_base()

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    wa_number = Column(String, nullable=False)  # WhatsApp
    plan = Column(String, default="trial")  # trial|basic|pro|enterprise
    trial_ends = Column(DateTime, default=lambda: datetime.now() + timedelta(days=7))
    api_key = Column(String, unique=True, default=lambda: str(uuid4())[:16])
    status = Column(String, default="active")  # active|suspended
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    type = Column(String, nullable=False)  # sale|quote|payment
    client_name = Column(String)
    value = Column(Float)
    nf_number = Column(String)  # Nota Fiscal
    status = Column(String, default="pending")  # pending|sent|failed
    whatsapp_id = Column(String)  # ID da mensagem WhatsApp
    products = Column(String)  # JSON string
    created_at = Column(DateTime, default=datetime.now)
    sent_at = Column(DateTime)

class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    name = Column(String, nullable=False)
    content = Column(String, nullable=False)  # Template mensagem
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
```

#### 2.2. Endpoints FastAPI (backend/main.py)

**Prioridade 1: Endpoints Essenciais**

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
import httpx

app = FastAPI(title="28Hub Connect API")

# 1. Health Check
@app.get("/health")
def health():
    return {"status": "28hub Connect OK", "version": "1.0.0"}

# 2. Registrar Tenant
@app.post("/api/v1/28hub/register")
def register_tenant(data: dict, db: Session = Depends(get_db)):
    tenant = Tenant(
        name=data["name"],
        wa_number=data["wa_number"]
    )
    db.add(tenant)
    db.commit()
    
    webhook_url = f"http://seu-dominio.com/api/v1/28hub/{tenant.id}/webhook/erp"
    
    return {
        "id": tenant.id,
        "api_key": tenant.api_key,
        "webhook_url": webhook_url
    }

# 3. Webhook ERP → WhatsApp
@app.post("/api/v1/28hub/{tenant_id}/webhook/erp")
async def erp_webhook(tenant_id: str, payload: dict, db: Session = Depends(get_db)):
    # Salvar notificação
    notification = Notification(
        tenant_id=tenant_id,
        type=payload.get("evento", "sale"),
        client_name=payload.get("cliente"),
        value=payload.get("valor"),
        nf_number=payload.get("nota"),
        status="pending"
    )
    db.add(notification)
    db.commit()
    
    # Enviar WhatsApp via Evolution API
    evolution_url = "http://evolution-api:8080/message/sendText/28hub-instance"
    async with httpx.AsyncClient() as client:
        response = await client.post(
            evolution_url,
            headers={"apikey": "28hub-enterprise-2025"},
            json={
                "number": payload.get("telefone"),
                "text": f"🎉 {payload.get('cliente')}, NF {payload.get('nota')} confirmada! R$ {payload.get('valor'):,.2f}"
            }
        )
    
    notification.status = "sent"
    notification.whatsapp_id = response.json().get("key", {}).get("id")
    db.commit()
    
    return {"status": "sent", "notification_id": notification.id}

# 4. Dashboard Data
@app.get("/api/v1/28hub/{tenant_id}/dashboard")
def get_dashboard(tenant_id: str, db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(
        Notification.tenant_id == tenant_id
    ).all()
    
    today_sales = sum(n.value for n in notifications if n.value)
    pending = len([n for n in notifications if n.status == "pending"])
    sent = len([n for n in notifications if n.status == "sent"])
    
    return {
        "today_sales": today_sales,
        "notifications_pending": pending,
        "notifications_sent": sent,
        "activities": [
            {
                "client": n.client_name,
                "value": n.value,
                "nf": n.nf_number,
                "status": n.status
            } for n in notifications[-10:]  # Últimos 10
        ]
    }
```

#### 2.3. Testes Backend

```bash
# 1. Registrar tenant
curl -X POST http://localhost:8000/api/v1/28hub/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Loja Teste","wa_number":"5511999999999"}'

# Salvar tenant_id e api_key retornados

# 2. Testar webhook (simular ERP)
curl -X POST http://localhost:8000/api/v1/28hub/TENANT_ID/webhook/erp \
  -H "Content-Type: application/json" \
  -d '{
    "evento": "venda",
    "cliente": "João Silva",
    "telefone": "5511888888888",
    "nota": "NF12345",
    "valor": 1500.00
  }'

# 3. Verificar dashboard
curl http://localhost:8000/api/v1/28hub/TENANT_ID/dashboard
```

---

### 3. FRONTEND - IMPLEMENTAÇÃO

#### 3.1. Dashboard (frontend/app/dashboard/page.tsx)

**Implementar EXATAMENTE**:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const tenantId = localStorage.getItem('28hub_tenant_id')
    
    fetch(`http://localhost:8000/api/v1/28hub/${tenantId}/dashboard`)
      .then(res => res.json())
      .then(data => {
        setData(data)
        setLoading(false)
      })
  }, [])
  
  if (loading) return <div>Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold mb-8">28Hub Connect</h1>
      
      {/* Cards Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>💰 Vendas Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              R$ {data.today_sales.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>📦 Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.notifications_sent}</div>
            <Badge className="mt-2">✅ OK</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>⏳ Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {data.notifications_pending}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>🤖 IA Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Upgrade R$ 197/mês</Badge>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Atividades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.activities.map((activity, i) => (
              <div key={i} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <div className="font-semibold">{activity.client}</div>
                  <div className="text-sm text-gray-500">
                    {activity.nf} - R$ {activity.value.toLocaleString('pt-BR')}
                  </div>
                </div>
                <Badge>{activity.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 3.2. Testes Frontend

```bash
# 1. Instalar dependências
cd frontend
npm install

# 2. Rodar dev server
npm run dev

# 3. Abrir navegador
open http://localhost:3000/dashboard

# 4. Configurar tenant_id no localStorage
# No console do navegador:
localStorage.setItem('28hub_tenant_id', 'TENANT_ID_AQUI')

# 5. Recarregar página
location.reload()
```

---

### 4. DEPLOY PRODUÇÃO

#### 4.1. Render.com (Recomendado)

```bash
# 1. Fazer push no GitHub
git add .
git commit -m "🚀 28Hub Connect MVP v1.0"
git push origin main

# 2. Criar conta Render.com
# 3. New → Web Service → Connect GitHub
# 4. Selecionar repositório 28hub-connect
# 5. Configurar:
#    - Build Command: docker compose -f docker-compose.enterprise.yml build
#    - Start Command: docker compose -f docker-compose.enterprise.yml up
#    - Environment Variables: copiar do .env

# 6. Deploy automático
```

---

## 🐛 TROUBLESHOOTING

### Problema: "Authentication failed PostgreSQL"

**Solução**:
```bash
# Verificar senha no .env
cat .env | grep POSTGRES_PASSWORD

# Deve ser: 28hub2025

# Recriar containers
docker compose down -v
docker compose up -d
```

### Problema: "Evolution API não conecta"

**Solução**:
```bash
# Verificar logs
docker logs evolution-api --tail 50

# Verificar API key
curl -H "apikey: 28hub-enterprise-2025" http://localhost:8080/
```

### Problema: "Frontend não carrega dashboard"

**Solução**:
```bash
# Verificar CORS no backend
# Adicionar em main.py:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## ✅ CRITÉRIOS DE SUCESSO

### MVP Completo
- [ ] Docker Compose sobe sem erros
- [ ] Todos os serviços health OK
- [ ] Endpoint `/register` cria tenant
- [ ] Webhook `/webhook/erp` envia WhatsApp
- [ ] Dashboard mostra dados reais
- [ ] Deploy produção funcionando

### Pronto para Beta
- [ ] 5 tenants criados
- [ ] 50 notificações enviadas (teste)
- [ ] Uptime 99%
- [ ] Documentação atualizada

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verificar logs: `docker compose logs -f`
2. Consultar docs:
   - Evolution API: https://doc.evolution-api.com
   - n8n: https://docs.n8n.io
3. Contatar Plex com screenshot do erro

---

**ROO, execute estas instruções NA SEQUÊNCIA. Boa sorte! 🚀**

**Última atualização**: 01/01/2026