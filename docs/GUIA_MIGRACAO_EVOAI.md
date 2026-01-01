# 🔄 GUIA DE MIGRAÇÃO - EVOAI FRONTEND

## Objetivo

Migrar o frontend do [EvoAI](https://github.com/EvolutionAPI/evo-ai) para o 28Hub Connect, adaptando a interface de gerenciamento de agentes IA para o contexto de notificações ERP.

---

## Arquitetura Atual vs. Migrada

### EvoAI Original
```
evo-ai/
├── frontend/          # Next.js + shadcn/ui
├── backend/           # FastAPI + LangChain
├── agents/            # Agentes IA
└── docker-compose.yml
```

### 28Hub Connect Migrado
```
28hub-connect/
├── frontend/          # EvoAI frontend adaptado
│   ├── app/
│   │   ├── dashboard/     # Novo: Dashboard executivo
│   │   ├── agents/        # Mantido: Gerenciamento agents
│   │   └── templates/     # Novo: Templates WhatsApp
├── backend/           # 28Hub API (FastAPI)
├── evoai-backend/     # EvoAI original (sem mudanças)
└── docker-compose.yml # Integrado
```

---

## Passo a Passo da Migração

### 1. Clonar EvoAI Original

```bash
# 1. Clonar repositório EvoAI
git clone https://github.com/EvolutionAPI/evo-ai.git /tmp/evo-ai

# 2. Copiar frontend para 28Hub
cd 28hub-connect
mkdir -p frontend-base
cp -r /tmp/evo-ai/frontend/* frontend-base/
```

### 2. Adaptações de Estrutura

#### package.json (adicionar dependências 28Hub)

```json
{
  "name": "28hub-connect-frontend",
  "dependencies": {
    // ... dependências EvoAI originais
    "axios": "^1.6.0",
    "recharts": "^2.8.0",  // Para gráficos dashboard
    "date-fns": "^2.30.0"  // Para formatação datas BR
  }
}
```

#### app/layout.tsx (atualizar metadata)

```tsx
export const metadata = {
  title: '28Hub Connect - Dashboard',
  description: 'Seu ERP falando pelo WhatsApp',
  // ... rest of metadata
}
```

### 3. Criar Novas Páginas

#### app/dashboard/page.tsx (Dashboard Executivo)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Dashboard() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    fetch('/api/v1/28hub/tenant-id/dashboard')
      .then(res => res.json())
      .then(setData)
  }, [])

  return (
    <div className="p-8">
      <h1>Dashboard 28Hub</h1>
      
      {/* Cards resumo */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader><CardTitle>💰 Vendas Hoje</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">R$ 12.450</div>
          </CardContent>
        </Card>
        {/* ... outros cards */}
      </div>
      
      {/* Tabela atividades */}
      <Card className="mt-8">
        <CardHeader><CardTitle>Últimas Atividades</CardTitle></CardHeader>
        <CardContent>
          {/* DataTable com notificações */}
        </CardContent>
      </Card>
    </div>
  )
}
```

#### app/agents/page.tsx (Manter do EvoAI)

```tsx
// Importar componente original do EvoAI
import { AgentsDashboard } from '@/components/evoai/agents-dashboard'

export default function AgentsPage() {
  return <AgentsDashboard />
}
```

### 4. Integração com Backend 28Hub

#### lib/api.ts (Cliente API)

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para adicionar API key do tenant
api.interceptors.request.use(config => {
  const apiKey = localStorage.getItem('28hub_api_key')
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }
  return config
})

export default api
```

#### Exemplo de uso

```typescript
import api from '@/lib/api'

// Dashboard data
export async function getDashboard(tenantId: string) {
  const { data } = await api.get(`/api/v1/28hub/${tenantId}/dashboard`)
  return data
}

// EvoAI agents (manter original)
export async function getAgents() {
  const { data } = await api.get('/api/agents')
  return data
}
```

---

## Componentes Reutilizáveis

### Do EvoAI (manter sem mudanças)

```
components/evoai/
├── agents-dashboard.tsx    # Gerenciamento agents
├── chat-interface.tsx      # Interface chat IA
├── workflow-builder.tsx    # Construtor workflows
└── settings/               # Configurações agents
```

### Novos 28Hub

```
components/28hub/
├── dashboard-cards.tsx      # Cards resumo vendas
├── notifications-table.tsx  # Tabela notificações
├── whatsapp-preview.tsx     # Preview mensagem WA
└── template-editor.tsx      # Editor templates
```

---

## Docker Compose Integrado

### Atualização docker-compose.yml

```yaml
services:
  # EvoAI backend original (sem mudanças)
  evoai-backend:
    image: evolutionapi/evo-ai:latest
    ports:
      - "8001:8000"
    environment:
      - POSTGRES_CONNECTION_STRING=postgresql://...
    
  # Frontend 28Hub (EvoAI adaptado)
  28hub-frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://28hub-api:8000
      - NEXT_PUBLIC_EVOAI_URL=http://evoai-backend:8000
    depends_on:
      - 28hub-api
      - evoai-backend
```

---

## Variáveis de Ambiente

### .env.local (frontend)

```bash
# 28Hub API
NEXT_PUBLIC_API_URL=http://localhost:8000

# EvoAI backend
NEXT_PUBLIC_EVOAI_URL=http://localhost:8001

# Evolution API
NEXT_PUBLIC_EVOLUTION_URL=http://localhost:8080

# Features flags
NEXT_PUBLIC_ENABLE_EVOAI=true
NEXT_PUBLIC_ENABLE_AGENTS=true
```

---

## Navegação Adaptada

### app/layout.tsx (Sidebar)

```tsx
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Atividades', href: '/activities', icon: ListIcon },
  { name: 'Templates', href: '/templates', icon: FileTextIcon },
  // Seção EvoAI (plano Pro+)
  { 
    name: 'Agentes IA', 
    href: '/agents', 
    icon: BotIcon,
    badge: 'Pro' 
  },
  { name: 'Workflows', href: '/workflows', icon: WorkflowIcon },
  { name: 'Configurações', href: '/settings', icon: SettingsIcon },
]
```

---

## Autenticação

### Manter JWT do EvoAI + API Key 28Hub

```typescript
// lib/auth.ts
export function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${getEvoAIToken()}`,  // Para endpoints EvoAI
    'X-API-Key': get28HubApiKey()                  // Para endpoints 28Hub
  }
}
```

---

## Testes da Migração

### Checklist Funcional

- [ ] Login funciona com API 28Hub
- [ ] Dashboard carrega dados do backend
- [ ] Tabela notificações exibe vendas
- [ ] Agents page (EvoAI) carrega sem erros
- [ ] Chat IA (EvoAI) funciona em plano Pro
- [ ] Templates WhatsApp salvam corretamente
- [ ] QR Code WhatsApp exibe corretamente

### Comandos de Teste

```bash
# 1. Subir stack completo
docker compose up -d

# 2. Testar frontend
curl http://localhost:3000

# 3. Testar 28Hub API
curl http://localhost:8000/health

# 4. Testar EvoAI API
curl http://localhost:8001/health

# 5. Criar tenant teste
curl -X POST http://localhost:8000/api/v1/28hub/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","wa_number":"5511999999999"}'
```

---

## Troubleshooting

### Problema: "Cannot connect to EvoAI"

**Solução**:
```bash
# Verificar se EvoAI backend está rodando
docker logs 28hub-connect-evoai-backend-1

# Verificar URL no frontend
echo $NEXT_PUBLIC_EVOAI_URL
```

### Problema: "Agents não carregam"

**Solução**:
```bash
# Verificar schema PostgreSQL EvoAI
docker exec postgres psql -U postgres -d evoai -c "\dt"

# Verificar migrations
docker exec evoai-backend alembic current
```

---

## Próximos Passos

1. ✅ Migrar frontend base do EvoAI
2. 🔄 Criar páginas dashboard 28Hub
3. 🔄 Integrar autenticação dupla (JWT + API Key)
4. 🔄 Testar workflows híbridos (n8n + EvoAI)
5. 🔄 Deploy produção com subdomínios:
   - `app.28hub.connect` → Frontend
   - `api.28hub.connect` → 28Hub API
   - `evoai.28hub.connect` → EvoAI backend

---

**Última atualização**: 01/01/2026
**Status**: 🔄 Em migração
**Responsável**: ROO + Plex