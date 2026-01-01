# 28HUB CONNECT ENTERPRISE - Problemas Descobertos e Soluções Implementadas

**Data**: 01/01/2026
**Versão**: v1.0 Production Ready
**Repositório**: https://github.com/OARANHA/28hub-connect

---

## 📋 Resumo Executivo

Este documento documenta os problemas críticos descobertos durante o processo de produção do 28HUB CONNECT Enterprise e suas respectivas soluções implementadas.

---

## 🚨 Problema 1: EvoAI - Ausência de Imagem Oficial Docker

### Descrição do Problema
O EvoAI não possuía uma imagem Docker oficial pública, o que impedia a implantação direta via Docker Compose.

### Solução Implementada
1. **Clone do Source Code**: Clonado o repositório oficial do EvoAI do GitHub
   - Repositório: https://github.com/EvolutionAPI/evo-ai.git
   - Local: `services/evo-ai/`

2. **Build Custom da Imagem Docker**:
   ```bash
   docker build -f Dockerfile -t 28hub/evo-ai:custom-v1.0 .
   docker tag 28hub/evo-ai:custom-v1.0 28hub/evo-ai:latest
   ```

3. **Configuração no Docker Compose**:
   - Serviço `evoai-backend` habilitado em [`docker-compose.enterprise.yml`](docker-compose.enterprise.yml:142)
   - Imagem customizada: `28hub/evo-ai:custom-v1.0`
   - Porta exposta: 8001

### Arquivos Modificados
- [`docker-compose.enterprise.yml`](docker-compose.enterprise.yml:1) - Habilitado serviço evoai-backend
- [`services/evo-ai/`](services/evo-ai:1) - Diretório clonado do source code

### Verificação
```bash
curl http://localhost:8001/docs
```

---

## 🚨 Problema 2: MinIO - Licença AGPL

### Descrição do Problema
A versão mais recente do MinIO utiliza licença AGPL que pode não ser adequada para uso empresarial sem conformidade específica.

### Solução Implementada
Alteração para versão específica do MinIO com licença AGPL compatível:
- **Imagem**: `minio/minio:RELEASE.2022-10-05T14-58-27Z`

### Arquivos Modificados
- [`docker-compose.enterprise.yml`](docker-compose.enterprise.yml:247) - Linha 247

### Comando Docker
```yaml
minio:
  image: minio/minio:RELEASE.2022-10-05T14-58-27Z
```

---

## 🚨 Problema 3: Evolution API - Configuração Incorreta do Banco de Dados (CRÍTICO)

### Descrição do Problema
A Evolution API v2.3.7 utiliza Prisma ORM que espera uma configuração específica de banco de dados:

**Esperado pela API**:
- Nome do banco: `evolution_db`
- Schema: `evolution_api`
- Usuário/Senha: postgres/28hub2025

**Configuração Original (Incorreta)**:
- Nome do banco: `evolution`
- Schema: não especificado
- Resultado: Falha na migração do Prisma

### Solução Implementada

#### 1. Atualização do init-databases.sql
```sql
-- Criação do banco com nome correto
CREATE DATABASE "evolution_db";

-- Configuração do schema específico
\c evolution_db;
CREATE SCHEMA IF NOT EXISTS evolution_api;

-- Permissões necessárias
GRANT ALL PRIVILEGES ON DATABASE "evolution_db" TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA evolution_api TO postgres;
```

#### 2. Atualização do docker-compose.enterprise.yml
```yaml
evolution-api:
  environment:
    DATABASE_URL: "postgresql://postgres:28hub2025@postgres:5432/evolution_db"
    DATABASE_PROVIDER: "postgresql"
```

#### 3. Remount de Volumes Docker
```bash
docker compose -f docker-compose.enterprise.yml down -v
docker volume rm 28hub-connect-enterprise_postgres_data
docker compose -f docker-compose.enterprise.yml up -d
```

### Arquivos Modificados
- [`init-databases.sql`](init-databases.sql:1) - Banco renomeado para evolution_db
- [`docker-compose.enterprise.yml`](docker-compose.enterprise.yml:47) - DATABASE_URL atualizado

### Verificação
```bash
# Verificar banco de dados
docker exec -it 28hub-connect-enterprise_postgres psql -U postgres -l

# Verificar migração do Prisma
docker logs 28hub-connect-enterprise_evolution-api | grep "Migration"

# Health check
curl http://localhost:8080/health
# Resposta esperada: {"status":200,"message":"Welcome to the Evolution API, it is working!","version":"2.3.7"}
```

### Tabelas Criadas
Após a correção, o Prisma criou 37 tabelas incluindo:
- `evolution_api.instances` - Instâncias WhatsApp
- `evolution_api.contacts` - Contatos
- `evolution_api.messages` - Mensagens
- `evolution_api.chats` - Chats
- Mais 33 tabelas de configuração

---

## 🚨 Problema 4: Evolution API v2 - Variável de Autenticação Incorreta

### Descrição do Problema
A Evolution API v2.3.7 utiliza nomes diferentes de variáveis de ambiente para autenticação em comparação com versões anteriores:

**Variável Incorreta**:
- `API_KEY` (versão anterior)

**Variável Correta (v2)**:
- `AUTHENTICATION_TYPE: "apikey"`
- `AUTHENTICATION_API_KEY: "28hub-enterprise-2025"`

Isso causava falhas na autenticação da API.

### Solução Implementada

#### 1. Atualização do docker-compose.enterprise.yml
Removido `API_KEY` e adicionadas as variáveis corretas da v2:

```yaml
evolution-api:
  environment:
    # ✅ AUTHENTICATION v2 OFICIAL (CRÍTICO!)
    AUTHENTICATION_TYPE: "apikey"
    AUTHENTICATION_API_KEY: "28hub-enterprise-2025"
    
    # ✅ DATABASE v2 OFICIAL (Docs)
    DATABASE_ENABLED: "true"
    DATABASE_PROVIDER: "postgresql"
    DATABASE_CONNECTION_URI: "postgresql://postgres:28hub2025@postgres:5432/evolution_db?schema=evolution_api"
    DATABASE_CONNECTION_CLIENT_NAME: "evolution_exchange"
    
    # ✅ Storage (obrigatório)
    DATABASE_SAVE_DATA_INSTANCE: "true"
    DATABASE_SAVE_DATA_NEW_MESSAGE: "true"
    DATABASE_SAVE_DATA_CONTACTS: "true"
    
    # Webhooks
    WEBHOOK_GLOBAL_ENABLED: "true"
    WEBHOOK_GLOBAL_URL: "http://n8n:5678/webhook/evolution"
```

#### 2. Remoção de Arquivos Conflitantes
Removidos os arquivos `evolution.env` e `.evolution.env` que podiam causar conflito com as variáveis do docker-compose.

### Arquivos Modificados
- [`docker-compose.enterprise.yml`](docker-compose.enterprise.yml:50) - Atualizadas variáveis de autenticação v2
- Removido: [`evolution.env`](evolution.env:1)
- Removido: [`.evolution.env`](.evolution.env:1)

### Verificação
```bash
# Testar autenticação com header correto
curl -H "apikey: 28hub-enterprise-2025" http://localhost:8080/health

# Criar instância de teste
curl -H "apikey: 28hub-enterprise-2025" \
  -H "Content-Type: application/json" \
  -d '{"instanceName":"28hub-teste"}' \
  http://localhost:8080/instance/create/28hub-teste
```

### Resposta Esperada
```json
{"status":200,"message":"Welcome to the Evolution API, it is working!","version":"2.3.7"}
```

---

## 📊 Status Final dos Serviços

| Serviço | Porta | Status | Observações |
|---------|-------|--------|-------------|
| PostgreSQL | 5432 | ✅ Running | 4 databases (28hub, evolution_db, evo_ai, n8n) |
| Redis | 6379 | ✅ Running | Queue mode |
| Evolution API | 8080 | ✅ Running | v2.3.7 - Migrado com sucesso |
| n8n | 5678 | ✅ Running | Workflow automation |
| 28Hub API | 8000 | ✅ Running | FastAPI backend |
| 28Hub Frontend | 3000 | ✅ Running | Next.js + shadcn/ui |
| EvoAI Backend | 8001 | ✅ Running | Custom build |
| MinIO | 9000/9001 | ✅ Running | AGPL compliant |

---

## 🔄 Commits Realizados no Git

1. **"🎉 EvoAI custom + MinIO license fix + Production Docker"**
   - Build custom do EvoAI
   - Correção da licença MinIO
   - Configuração Docker production

2. **"✅ Enable EvoAI service in production Docker"**
   - Habilitação do serviço evoai-backend
   - Volume evoai_data adicionado

3. **"🔧 Fix Evolution API database: evolution_db + schema evolution_api"**
   - Correção crítica do banco de dados Evolution API
   - Migrado com sucesso 37 tabelas

4. **"🔐 Fix Evolution API v2 auth: AUTHENTICATION_API_KEY + remove evolution.env"**
   - Correção das variáveis de autenticação v2
   - Remoção de arquivos evolution.env conflitantes

---

## 📝 Lições Aprendidas

1. **Evolution API Prisma Requirements**: A Evolution API possui requisitos específicos de database schema que devem ser seguidos rigorosamente. O nome do banco deve ser `evolution_db` e o schema `evolution_api`.

2. **Custom Docker Images**: Quando não existe imagem oficial, build a partir do source é a melhor solução, permitindo customizações futuras.

3. **Licenças de Software**: Verificar licenças de dependências antes de deployment em produção é essencial para conformidade empresarial.

4. **Volume Reset**: Ao mudar configurações de database que afetam estrutura, é necessário remover e recriar volumes para garantir limpeza.

5. **Verificação de Documentação Oficial**: A Evolution API v2 possui diferenças significativas de variáveis de ambiente em relação às versões anteriores. Sempre verificar a documentação oficial para confirmar os nomes corretos das variáveis (ex: `AUTHENTICATION_API_KEY` em vez de `API_KEY`).

---

## 🚀 Próximos Passos Recomendados

1. [ ] Stripe integration para pagamentos
2. [ ] Deploy em Render.com ou similar
3. [ ] 5 clientes beta para testes
4. [ ] Monitoramento e alertas (Sentry, UptimeRobot)
5. [ ] Backup automatizado do PostgreSQL

---

## 📞 Suporte

**GitHub**: https://github.com/OARANHA/28hub-connect
**Issues**: Reportar via GitHub Issues
**Documentação**: Ver `/docs` de cada API

---

*Última atualização: 01/01/2026*
