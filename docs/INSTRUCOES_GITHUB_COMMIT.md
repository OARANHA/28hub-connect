# 📝 INSTRUÇÕES DE COMMIT E AUTOMAÇÃO - GITHUB

## Objetivo

Este documento define as convenções de commit, fluxo de trabalho Git e automações para o projeto **28Hub Connect**.

---

## Convenções de Commit

### Formato Padrão (Conventional Commits)

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional>

<rodapé opcional>
```

### Tipos Permitidos

| Tipo | Descrição | Exemplo |
|------|-----------|----------|
| `feat` | Nova funcionalidade | `feat(api): adiciona endpoint de dashboard` |
| `fix` | Correção de bug | `fix(frontend): corrige erro de autenticação` |
| `docs` | Documentação | `docs: atualiza README com instruções deploy` |
| `style` | Formatação (sem mudança de código) | `style(backend): formata código com black` |
| `refactor` | Refatoração | `refactor(models): simplifica queries SQLAlchemy` |
| `test` | Testes | `test(api): adiciona testes unitários` |
| `chore` | Manutenção | `chore: atualiza dependências` |
| `ci` | CI/CD | `ci: adiciona GitHub Actions workflow` |

### Emojis Opcionais (Facilita Visualização)

```
🚀 feat: nova feature
🐛 fix: correção
📚 docs: documentação
✨ style: formatação
♻️ refactor: refatoração
✅ test: testes
🔧 chore: manutenção
⚙️ ci: CI/CD
```

### Exemplos Bons

```bash
# Feature completa
git commit -m "feat(api): implementa webhook ERP para notificações

Adiciona endpoint POST /api/v1/28hub/{tenant_id}/webhook/erp
que recebe eventos do ERP e dispara notificações WhatsApp.

Closes #12"

# Correção simples
git commit -m "fix(docker): corrige senha PostgreSQL em docker-compose"

# Documentação
git commit -m "docs: adiciona guia de migração EvoAI"
```

### Exemplos Ruins (Evitar)

```bash
# Muito vago
git commit -m "mudanças"

# Sem contexto
git commit -m "fix bug"

# Texto longo no título
git commit -m "adiciona endpoint para receber webhooks do ERP e enviar notificações pelo WhatsApp usando Evolution API"
```

---

## Fluxo de Trabalho Git

### Branch Strategy (Git Flow Simplificado)

```
main          → Produção (sempre estável)
  ├── develop → Desenvolvimento (features integradas)
  │    ├── feature/dashboard
  │    ├── feature/evoai-integration
  │    └── fix/postgres-auth
```

### Comandos por Cenário

#### 1. Nova Feature

```bash
# 1. Criar branch da develop
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# 2. Desenvolver (commits frequentes)
git add .
git commit -m "feat(escopo): descrição"

# 3. Push da feature
git push origin feature/nome-da-feature

# 4. Abrir Pull Request no GitHub
# develop ← feature/nome-da-feature

# 5. Após aprovação, merge
git checkout develop
git merge feature/nome-da-feature
git push origin develop

# 6. Deletar branch
git branch -d feature/nome-da-feature
git push origin --delete feature/nome-da-feature
```

#### 2. Hotfix (Produção)

```bash
# 1. Criar branch da main
git checkout main
git pull origin main
git checkout -b hotfix/nome-do-fix

# 2. Corrigir
git add .
git commit -m "fix: descrição urgente"

# 3. Merge direto na main
git checkout main
git merge hotfix/nome-do-fix
git push origin main

# 4. Merge também na develop
git checkout develop
git merge hotfix/nome-do-fix
git push origin develop

# 5. Deletar branch
git branch -d hotfix/nome-do-fix
```

#### 3. Release (Develop → Main)

```bash
# 1. Criar tag
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0 - MVP completo"

# 2. Push tag
git push origin main
git push origin v1.0.0

# 3. Criar release no GitHub (UI)
# https://github.com/OARANHA/28hub-connect/releases/new
```

---

## GitHub Actions (CI/CD)

### Workflow: Testes Automáticos

**Arquivo**: `.github/workflows/tests.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: 28hub2025
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:28hub2025@localhost:5432/test
        run: |
          cd backend
          pytest tests/ -v
  
  frontend-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run tests
        run: |
          cd frontend
          npm test
```

### Workflow: Deploy Automático (Render.com)

**Arquivo**: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
            -H "Authorization: Bearer $RENDER_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{}'
      
      - name: Notify Deploy
        run: |
          echo "✅ Deploy realizado com sucesso!"
          echo "URL: https://28hub-connect.onrender.com"
```

---

## Automações Locais

### Pre-commit Hooks (Qualidade do Código)

**Instalação**:

```bash
# 1. Instalar pre-commit
pip install pre-commit

# 2. Criar .pre-commit-config.yaml
cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
  
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3.11
  
  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
EOF

# 3. Instalar hooks
pre-commit install

# 4. Testar
pre-commit run --all-files
```

### Script de Commit Rápido

**Arquivo**: `scripts/quick-commit.sh`

```bash
#!/bin/bash
# Uso: ./scripts/quick-commit.sh "mensagem do commit"

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
  echo -e "${RED}Erro: Forneça uma mensagem de commit${NC}"
  echo "Uso: ./scripts/quick-commit.sh 'mensagem'"
  exit 1
fi

echo -e "${YELLOW}🔍 Verificando mudanças...${NC}"
git status --short

echo -e "${YELLOW}📝 Adicionando arquivos...${NC}"
git add .

echo -e "${YELLOW}💾 Commitando...${NC}"
git commit -m "$1"

echo -e "${YELLOW}🚀 Fazendo push...${NC}"
git push

echo -e "${GREEN}✅ Commit realizado com sucesso!${NC}"
```

**Uso**:

```bash
chmod +x scripts/quick-commit.sh
./scripts/quick-commit.sh "feat(api): adiciona endpoint de dashboard"
```

---

## Proteção de Branches

### Configuração GitHub (main)

**Settings → Branches → Branch protection rules → Add rule**

- Branch name pattern: `main`
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - Tests (backend)
  - Tests (frontend)
- ✅ Require branches to be up to date before merging
- ✅ Include administrators

---

## Versionamento Semântico

### Formato: `MAJOR.MINOR.PATCH`

- **MAJOR**: Mudanças incompatíveis (breaking changes)
- **MINOR**: Novas funcionalidades (compatível)
- **PATCH**: Correções de bugs

### Exemplos

```
v1.0.0 → MVP inicial
v1.1.0 → Adiciona integração EvoAI
v1.1.1 → Corrige bug autenticação
v2.0.0 → Muda estrutura API (breaking)
```

### Criar Tag

```bash
# Versão patch (correção)
git tag -a v1.0.1 -m "fix: corrige autenticação PostgreSQL"

# Versão minor (feature)
git tag -a v1.1.0 -m "feat: adiciona dashboard executivo"

# Versão major (breaking)
git tag -a v2.0.0 -m "BREAKING CHANGE: nova estrutura API"

# Push tag
git push origin v1.0.1
```

---

## Changelog Automático

### Gerar com `conventional-changelog`

```bash
# Instalar
npm install -g conventional-changelog-cli

# Gerar CHANGELOG.md
conventional-changelog -p angular -i CHANGELOG.md -s

# Commit
git add CHANGELOG.md
git commit -m "docs: atualiza CHANGELOG para v1.1.0"
```

**Exemplo CHANGELOG.md**:

```markdown
# Changelog

## [1.1.0] - 2026-01-15

### Features
- **api**: adiciona endpoint de dashboard executivo
- **frontend**: implementa tabela de notificações

### Bug Fixes
- **docker**: corrige senha PostgreSQL
- **auth**: valida API key corretamente

## [1.0.0] - 2026-01-01

### Features
- **api**: implementa webhook ERP
- **api**: integração Evolution API
- **frontend**: dashboard básico
```

---

## Pull Request Template

**Arquivo**: `.github/pull_request_template.md`

```markdown
## Descrição

<!-- Descreva as mudanças deste PR -->

## Tipo de Mudança

- [ ] 🚀 Nova feature
- [ ] 🐛 Correção de bug
- [ ] 📚 Documentação
- [ ] ♻️ Refatoração
- [ ] ✅ Testes

## Checklist

- [ ] Código segue convenções do projeto
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
- [ ] CI passa sem erros
- [ ] Revisado por pelo menos 1 pessoa

## Screenshots (se aplicável)

<!-- Cole prints aqui -->

## Issues Relacionadas

Closes #<issue_number>
```

---

## Resumo de Comandos Essenciais

```bash
# Status
git status
git log --oneline --graph --all

# Branches
git branch                    # Listar
git checkout -b feature/nome  # Criar e mudar
git branch -d feature/nome    # Deletar local
git push origin --delete feature/nome  # Deletar remoto

# Commits
git add .
git commit -m "tipo(escopo): mensagem"
git push origin branch-name

# Merge
git checkout main
git merge develop
git push origin main

# Tags
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Desfazer
git reset HEAD~1              # Desfaz último commit (mantém mudanças)
git reset --hard HEAD~1       # Desfaz último commit (apaga mudanças)
git revert <commit_hash>      # Reverte commit específico
```

---

**Última atualização**: 01/01/2026
**Versão**: 1.0
**Autor**: Plex + ROO