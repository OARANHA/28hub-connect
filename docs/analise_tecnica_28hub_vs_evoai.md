# 🔬 ANÁLISE TÉCNICA COMPARATIVA - 28HUB VS EVOAI

## Resumo Executivo

Esta análise compara a arquitetura do **28Hub Connect** (plataforma SaaS de notificações ERP) com o **EvoAI** (plataforma de agentes IA), identificando pontos de integração e trade-offs.

---

## Arquitetura Base

### 28Hub Connect (Original)

```
┌─────────────────────────────────────────────┐
│              FRONTEND                       │
│         Next.js + Tailwind                  │
│         Dashboard Executivo                 │
└──────────────┬──────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────┐
│          28HUB API (FastAPI)                │
│   - Multi-tenant                            │
│   - Autenticação (API Key)                  │
│   - CRUD Notifications                      │
└──┬───────────────────────┬──────────────────┘
   │                       │
   │ PostgreSQL            │ HTTP
   │                       │
┌──▼────────┐      ┌───────▼──────┐   ┌──────────────┐
│ Postgres  │      │ Evolution API│   │     n8n      │
│ (tenants, │      │  (WhatsApp)  │   │ (Workflows)  │
│  notific.)│      │              │   │              │
└───────────┘      └──────────────┘   └──────────────┘
```

### EvoAI (Original)

```
┌─────────────────────────────────────────────┐
│              FRONTEND                       │
│         Next.js + shadcn/ui                 │
│         Gerenciamento Agents                │
└──────────────┬──────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────┐
│          EVOAI API (FastAPI)                │
│   - LangChain/LangGraph                     │
│   - OpenAI/Anthropic                        │
│   - Agents personalizados                   │
└──┬───────────────────────┬──────────────────┘
   │                       │
   │ PostgreSQL            │ Redis (cache)
   │                       │
┌──▼────────┐      ┌───────▼──────┐   ┌──────────────┐
│ Postgres  │      │    Redis     │   │  Langfuse    │
│ (agents,  │      │  (sessions)  │   │(observability)│
│  vectors) │      │              │   │              │
└───────────┘      └──────────────┘   └──────────────┘
```

---

## Comparação de Componentes

| Componente | 28Hub Connect | EvoAI | Integração |
|------------|---------------|-------|------------|
| **Frontend** | Dashboard vendas | Gerenciamento agents | ✅ Mesclar sidebars |
| **Backend** | FastAPI (CRUD) | FastAPI (LangChain) | ✅ APIs paralelas |
| **Autenticação** | API Key | JWT | 🔄 Híbrido |
| **Banco de Dados** | PostgreSQL (tenants) | PostgreSQL (agents) | ✅ Schemas separados |
| **Cache** | - | Redis | ✅ Compartilhar Redis |
| **WhatsApp** | Evolution API | - | ✅ EvoAI usa Evolution |
| **Workflows** | n8n | - | ✅ n8n chama EvoAI |
| **IA** | - | LangChain | ✅ 28Hub chama EvoAI |

---

## Integração Proposta

### Arquitetura Híbrida

```
┌──────────────────────────────────────────────────────┐
│           FRONTEND UNIFICADO (Next.js)               │
│  ┌───────────────┐  ┌────────────────┐              │
│  │ Dashboard     │  │ Agents IA      │              │
│  │ 28Hub         │  │ (EvoAI)        │              │
│  └───────┬───────┘  └────────┬───────┘              │
└──────────┼──────────────────┼────────────────────────┘
           │                  │
           │ REST             │ REST
           │                  │
┌──────────▼─────────┐ ┌──────▼────────────────────────┐
│  28HUB API         │ │  EVOAI API                    │
│  (FastAPI)         │ │  (FastAPI + LangChain)        │
│  - Tenants         │ │  - Agents                     │
│  - Notifications   │ │  - Chat IA                    │
│  - Templates       │ │  - Workflows IA               │
└──┬─────────────────┘ └──┬────────────────────────────┘
   │ PostgreSQL           │ PostgreSQL + Redis
   │ (schema: 28hub)      │ (schema: evoai)
   │                      │
┌──▼──────────────────────▼───────────────────────────┐
│           POSTGRES 16 (Multi-Schema)                │
│  - 28hub       (tenants, notifications)             │
│  - evoai       (agents, vectors)                    │
│  - evolutiondb (whatsapp instances)                 │
│  - n8n         (workflows)                          │
└─────────────────────────────────────────────────────┘
```

---

## Pontos de Integração

### 1. Frontend Unificado

**Problema**: EvoAI tem interface de agents, 28Hub precisa de dashboard vendas.

**Solução**: Sidebar unificada com feature flags por plano.

```tsx
// Sidebar navigation
const navigation = [
  // 28Hub (todos os planos)
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Atividades', href: '/activities' },
  
  // EvoAI (plano Pro+)
  { 
    name: 'Agentes IA', 
    href: '/agents', 
    badge: 'Pro',
    enabled: tenant.plan === 'pro' || tenant.plan === 'enterprise'
  },
]
```

### 2. Autenticação Dupla

**Problema**: 28Hub usa API Key, EvoAI usa JWT.

**Solução**: Middleware que aceita ambos.

```python
# 28hub-api/middleware.py
from fastapi import Security
from fastapi.security import HTTPBearer, APIKeyHeader

api_key_header = APIKeyHeader(name="X-API-Key")
bearer_scheme = HTTPBearer()

async def verify_auth(api_key: str = Security(api_key_header), token: str = Security(bearer_scheme)):
    if api_key:
        return verify_api_key(api_key)  # 28Hub tenants
    elif token:
        return verify_jwt(token)        # EvoAI users
    raise HTTPException(401)
```

### 3. Comunicação Inter-APIs

**28Hub chama EvoAI** para respostas inteligentes:

```python
# 28hub-api/services/evoai_client.py
import httpx

class EvoAIClient:
    def __init__(self, base_url="http://evoai-backend:8000"):
        self.base_url = base_url
    
    async def chat(self, tenant_id: str, message: str):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={"agent_id": f"28hub-{tenant_id}", "message": message}
            )
            return response.json()
```

**n8n chama EvoAI** para workflows:

```javascript
// n8n workflow node: "EvoAI Agent"
const response = await this.helpers.httpRequest({
  method: 'POST',
  url: 'http://evoai-backend:8000/api/agents/execute',
  body: {
    agent_id: 'follow-up-sales',
    context: items[0].json
  }
})
```

### 4. Schemas PostgreSQL Isolados

```sql
-- Isolamento por schema
CREATE DATABASE postgres;

\c postgres

CREATE SCHEMA 28hub;
CREATE SCHEMA evoai;
CREATE SCHEMA evolutionapi;
CREATE SCHEMA n8n;

GRANT ALL ON SCHEMA 28hub TO postgres;
GRANT ALL ON SCHEMA evoai TO postgres;
-- etc.
```

---

## Análise de Performance

### Latência Esperada (P95)

| Operação | 28Hub Puro | + EvoAI | Impacto |
|----------|------------|---------|----------|
| **Dashboard load** | 150ms | 150ms | 0ms (sem IA) |
| **Enviar notificação** | 200ms | 200ms | 0ms (sem IA) |
| **Chat IA (Pro)** | N/A | 800ms | +800ms (LLM) |
| **Agent workflow** | N/A | 1500ms | +1500ms (LLM chain) |

**Conclusão**: IA é opt-in (plano Pro), não impacta performance base.

### Consumo de Recursos

| Componente | RAM | CPU | Disco |
|------------|-----|-----|-------|
| **28hub-api** | 512MB | 0.5 core | 100MB |
| **evoai-backend** | 1GB | 1 core | 500MB (vectors) |
| **postgres** | 1GB | 0.5 core | 10GB |
| **evolution-api** | 512MB | 0.5 core | 1GB |
| **n8n** | 512MB | 0.5 core | 500MB |
| **Total** | **3.5GB** | **3 cores** | **12GB** |

**VPS Recomendado**: 4GB RAM, 4 vCPUs (DigitalOcean $24/mês, Render $15/mês)

---

## Trade-offs

### ✅ Vantagens da Integração

1. **Diferencial Competitivo**: IA conversacional (plano Pro)
2. **Reuso de Código**: Frontend EvoAI pronto
3. **Ecosistema Único**: Evolution + n8n + EvoAI
4. **Escalabilidade**: Schemas isolados

### ⚠️ Desvantagens/Riscos

1. **Complexidade**: 5 serviços vs. 3 serviços (28Hub puro)
2. **Custo Infra**: +$10/mês (RAM extra)
3. **Dependência**: EvoAI é projeto externo (risco de breaking changes)
4. **Debugging**: Logs distribuídos (precisa de observabilidade)

---

## Recomendações

### Fase 1: MVP (Sem EvoAI)

**Motivo**: Validar mercado antes de adicionar complexidade.

```yaml
# docker-compose.mvp.yml (simples)
services:
  postgres:
  redis:
  evolution-api:
  n8n:
  28hub-api:
  28hub-frontend:
```

**Meta**: 20 clientes pagantes (Basic) em 30 dias.

### Fase 2: Pro Plan (Com EvoAI)

**Gatilho**: 50 clientes Basic + feedback pedindo IA.

```yaml
# docker-compose.pro.yml (completo)
services:
  # ... serviços MVP
  evoai-backend:  # Adicionar só agora
```

**Estratégia**:
- Oferecer upgrade Basic → Pro (R$ 97 → R$ 197)
- Marketing: "Seu WhatsApp agora responde sozinho"

### Fase 3: Enterprise (Agents Custom)

**Gatilho**: 100 clientes total + 10 Pro.

**Features**:
- Agents treinados em dados do cliente
- Workflows complexos (recuperação carrinho, follow-up)
- Suporte prioritário

---

## Conclusão

**28Hub Connect + EvoAI = Diferencial Premium**

| Cenário | Stack | MRR 100 clientes |
|---------|-------|------------------|
| **Sem EvoAI** | Evolution + n8n | R$ 9.700 (Basic) |
| **Com EvoAI** | + Agents IA | R$ 18.400 (30% Pro) |
| **Impacto** | +90% receita | **+R$ 8.700/mês** |

**Recomendação Final**: 
1. Lançar MVP sem EvoAI (velocidade)
2. Adicionar EvoAI em 60 dias (tração comprovada)
3. Usar como upsell Pro (R$ 197/mês)

---

**Última atualização**: 01/01/2026
**Autor**: Análise Técnica Conjunta (Plex + ROO)
**Status**: 📊 Aprovado para implementação faseada