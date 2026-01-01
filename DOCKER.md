# 28Hub Connect - Docker Architecture Guide

## Table of Contents

- [Overview](#overview)
- [Service Architecture](#service-architecture)
- [Container Descriptions](#container-descriptions)
- [Volume Mappings](#volume-mappings)
- [Network Configuration](#network-configuration)
- [Docker Compose Files](#docker-compose-files)
- [Common Docker Commands](#common-docker-commands)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Overview

The 28Hub Connect platform uses Docker and Docker Compose for containerization and orchestration. This architecture provides:

- **Isolation**: Each service runs in its own container
- **Portability**: Consistent behavior across environments
- **Scalability**: Easy to scale individual services
- **Maintainability**: Simplified deployment and updates

### Docker Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Host                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Docker Network (28hub-network)        │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ Frontend   │  │  28Hub API │  │ Evolution  │         │  │
│  │  │ :3000      │  │  :8000     │  │  :8080     │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │    n8n     │  │  EvoAI     │  │   MinIO    │         │  │
│  │  │  :5678     │  │  :8001     │  │  :9000     │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  │                                                          │  │
│  │  ┌────────────┐  ┌────────────┐                         │  │
│  │  │ PostgreSQL │  │   Redis    │                         │  │
│  │  │  :5432     │  │  :6379     │                         │  │
│  │  └────────────┘  └────────────┘                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                        Docker Volumes                     │  │
│  │                                                          │  │
│  │  postgres_data  │  redis_data  │  minio_data            │  │
│  │  n8n_data       │  evoai_data  │  uploads                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Service Architecture

### Service Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend                               │
│                       (Next.js :3000)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        28Hub API                                │
│                       (FastAPI :8000)                           │
└──────┬────────────────────────┬────────────────────────┬────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ PostgreSQL   │      │    Redis     │      │ Evolution    │
│   :5432      │      │    :6379     │      │    API       │
└──────────────┘      └──────────────┘      │    :8080      │
                                             └──────┬───────┘
                                                    │
       ┌────────────────────────────────────────────┼────────────┐
       │                                            │            │
       ▼                                            ▼            ▼
┌──────────────┐                           ┌──────────────┐  ┌──────────────┐
│     n8n      │                           │   EvoAI      │  │    MinIO     │
│   :5678      │                           │   :8001      │  │    :9000     │
└──────────────┘                           └──────────────┘  └──────────────┘
```

### Service Communication Flow

```
User Request
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                              │
│  - Receives HTTP requests from users                            │
│  - Communicates with 28Hub API via REST                         │
│  - Communicates with EvoAI via REST                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  28Hub API (FastAPI)                                             │
│  - Processes business logic                                      │
│  - Stores data in PostgreSQL                                    │
│  - Caches data in Redis                                         │
│  - Integrates with Evolution API for WhatsApp                   │
│  - Integrates with n8n for workflows                            │
│  - Integrates with EvoAI for AI processing                      │
└─────────────────────────────────────────────────────────────────┘
```

## Container Descriptions

### 1. 28Hub API Backend

**Image**: `28hub-api:latest` (built from `backend/Dockerfile`)

**Purpose**: Main FastAPI backend service

**Ports**:
- `8000:8000` - API endpoint

**Environment Variables**:
```bash
DATABASE_URL=postgresql://postgres:28hub2025@postgres:5432/28hub
REDIS_URL=redis://redis:6379
EVOLUTION_KEY=28hub-enterprise-2025
N8N_URL=http://n8n:5678
JWT_SECRET=28hub-enterprise-jwt-2025
API_KEY=28hub-enterprise-2025
EVOAI_URL=http://evoai-backend:8000
EVOAI_API_KEY=28hub-evoai-integration-2025
```

**Health Check**:
```bash
curl http://localhost:8000/health
```

**Dependencies**: PostgreSQL, Redis

**Dockerfile Highlights**:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Frontend (Next.js)

**Image**: `28hub-frontend:latest` (built from `frontend/Dockerfile`)

**Purpose**: React-based web interface

**Ports**:
- `3000:3000` - Web application

**Environment Variables**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_EVOAI_URL=http://evoai-backend:8000
```

**Health Check**:
```bash
curl http://localhost:3000
```

**Dependencies**: 28Hub API, EvoAI Backend

**Dockerfile Highlights**:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 3. Evolution API

**Image**: `evolution/api:latest`

**Purpose**: WhatsApp Business API gateway

**Ports**:
- `8080:8080` - API endpoint

**Environment Variables**:
```bash
EVOLUTION_API_KEY=28hub-enterprise-2025
AUTHENTICATION_API_KEY=28hub-enterprise-2025
DATABASE_CONNECTION_URI=postgresql://postgres:28hub2025@postgres:5432/evolution_db
CACHE_REDIS_URI=redis://redis:6379
N8N_BASE_URL=http://n8n:5678
N8N_API_KEY=28hub-enterprise-2025
```

**Health Check**:
```bash
curl http://localhost:8080
```

**Dependencies**: PostgreSQL, Redis, n8n

### 4. n8n

**Image**: `n8nio/n8n:latest`

**Purpose**: Workflow automation platform

**Ports**:
- `5678:5678` - Web interface

**Environment Variables**:
```bash
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=28hub2025
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=28hub2025
QUEUE_BULL_REDIS_HOST=redis
```

**Health Check**:
```bash
curl http://localhost:5678/healthz
```

**Dependencies**: PostgreSQL, Redis

### 5. EvoAI Backend

**Image**: `evoai-backend:latest` (built from `services/evo-ai/Dockerfile`)

**Purpose**: AI agents and processing

**Ports**:
- `8001:8000` - API endpoint

**Environment Variables**:
```bash
POSTGRES_CONNECTION_STRING=postgresql://postgres:28hub2025@postgres:5432/evo_ai
REDIS_HOST=redis
JWT_SECRET_KEY=28hub-evoai-jwt-2025
EVOLUTION_API_KEY=28hub-enterprise-2025
```

**Health Check**:
```bash
curl http://localhost:8001/health
```

**Dependencies**: PostgreSQL, Redis, Evolution API

### 6. MinIO

**Image**: `minio/minio:latest`

**Purpose**: S3-compatible object storage

**Ports**:
- `9000:9000` - API endpoint
- `9001:9001` - Web console

**Environment Variables**:
```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
```

**Health Check**:
```bash
curl http://localhost:9000/minio/health/live
```

**Dependencies**: None

### 7. PostgreSQL

**Image**: `postgres:15-alpine`

**Purpose**: Primary database

**Ports**:
- `5432:5432` - Database connection

**Environment Variables**:
```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=28hub2025
POSTGRES_DB=postgres
```

**Health Check**:
```bash
docker exec 28hub-connect-postgres-1 pg_isready
```

**Dependencies**: None

### 8. Redis

**Image**: `redis:7-alpine`

**Purpose**: Cache and message queue

**Ports**:
- `6379:6379` - Redis connection

**Environment Variables**: None

**Health Check**:
```bash
docker exec 28hub-connect-redis-1 redis-cli ping
```

**Dependencies**: None

## Volume Mappings

### Volume Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                       Docker Volumes                             │
└─────────────────────────────────────────────────────────────────┘
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ postgres_data                                             │  │
│  │ - Persistent database storage                             │  │
│  │ - Contains all databases (28hub, evolution_db, n8n, evo_ai)│  │
│  │ - Location: /var/lib/postgresql/data                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ redis_data                                                 │  │
│  │ - Persistent Redis data                                    │  │
│  │ - Contains cache and queue data                            │  │
│  │ - Location: /data                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ minio_data                                                 │  │
│  │ - Persistent object storage                                 │  │
│  │ - Contains uploaded files and media                        │  │
│  │ - Location: /data                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ n8n_data                                                   │  │
│  │ - Persistent n8n workflow data                             │  │
│  │ - Contains workflows and credentials                       │  │
│  │ - Location: /home/node/.n8n                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ evoai_data                                                │  │
│  │ - Persistent EvoAI data                                   │  │
│  │ - Contains AI agents and configurations                   │  │
│  │ - Location: /app/data                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Volume Configuration

```yaml
volumes:
  postgres_data:
    driver: local
  
  redis_data:
    driver: local
  
  minio_data:
    driver: local
  
  n8n_data:
    driver: local
  
  evoai_data:
    driver: local
```

### Volume Usage in Services

```yaml
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    volumes:
      - redis_data:/data
  
  minio:
    volumes:
      - minio_data:/data
  
  n8n:
    volumes:
      - n8n_data:/home/node/.n8n
  
  evoai-backend:
    volumes:
      - evoai_data:/app/data
```

### Volume Management

```bash
# List all volumes
docker volume ls

# Inspect a volume
docker volume inspect 28hub-connect_postgres_data

# Remove a volume (WARNING: deletes data)
docker volume rm 28hub-connect_postgres_data

# Backup a volume
docker run --rm -v 28hub-connect_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data

# Restore a volume
docker run --rm -v 28hub-connect_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /
```

## Network Configuration

### Network Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Network (28hub)                        │
│                                                                  │
│  Network Type: Bridge                                           │
│  Subnet: 172.20.0.0/16                                          │
│  Gateway: 172.20.0.1                                             │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Frontend   │  │  28Hub API │  │ Evolution  │                │
│  │ 172.20.0.2 │  │ 172.20.0.3 │  │ 172.20.0.4 │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │    n8n     │  │  EvoAI     │  │   MinIO    │                │
│  │ 172.20.0.5 │  │ 172.20.0.6 │  │ 172.20.0.7 │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                  │
│  ┌────────────┐  ┌────────────┐                                │
│  │ PostgreSQL │  │   Redis    │                                │
│  │ 172.20.0.8 │  │ 172.20.0.9 │                                │
│  └────────────┘  └────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### Network Configuration

```yaml
networks:
  28hub:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Service-to-Service Communication

Services communicate using service names as hostnames:

```bash
# From 28Hub API to PostgreSQL
DATABASE_URL=postgresql://postgres:28hub2025@postgres:5432/28hub

# From 28Hub API to Redis
REDIS_URL=redis://redis:6379

# From 28Hub API to Evolution API
EVOLUTION_API_URL=http://evolution-api:8080

# From 28Hub API to n8n
N8N_URL=http://n8n:5678
```

### Network Management

```bash
# List all networks
docker network ls

# Inspect a network
docker network inspect 28hub-connect_28hub

# Connect a container to a network
docker network connect 28hub-connect_28hub my-container

# Disconnect a container from a network
docker network disconnect 28hub-connect_28hub my-container

# Remove a network
docker network rm 28hub-connect_28hub
```

## Docker Compose Files

### docker-compose.enterprise.yml

**Purpose**: Full enterprise deployment with all services

**Services**:
- 28Hub API
- Frontend
- Evolution API
- n8n
- EvoAI Backend
- MinIO
- PostgreSQL
- Redis

**Usage**:
```bash
docker compose -f docker-compose.enterprise.yml up -d
```

### docker-compose.prod.yml

**Purpose**: Production deployment with optimizations

**Differences from enterprise**:
- Resource limits
- Health checks
- Restart policies
- Security configurations

**Usage**:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### docker-compose.dev.yml (Optional)

**Purpose**: Development environment with hot reload

**Differences**:
- Volume mounts for live code changes
- Debug configurations
- Lower resource requirements

**Usage**:
```bash
docker compose -f docker-compose.dev.yml up -d
```

## Common Docker Commands

### Starting and Stopping Services

```bash
# Start all services
docker compose -f docker-compose.enterprise.yml up -d

# Start specific service
docker compose -f docker-compose.enterprise.yml up -d postgres

# Stop all services
docker compose -f docker-compose.enterprise.yml down

# Stop specific service
docker compose -f docker-compose.enterprise.yml stop 28hub-api

# Restart all services
docker compose -f docker-compose.enterprise.yml restart

# Restart specific service
docker compose -f docker-compose.enterprise.yml restart 28hub-api
```

### Viewing Logs

```bash
# View all logs
docker compose -f docker-compose.enterprise.yml logs

# View logs for specific service
docker compose -f docker-compose.enterprise.yml logs 28hub-api

# Follow logs in real-time
docker compose -f docker-compose.enterprise.yml logs -f

# View last 100 lines
docker compose -f docker-compose.enterprise.yml logs --tail=100

# View logs with timestamps
docker compose -f docker-compose.enterprise.yml logs -t
```

### Checking Service Status

```bash
# Check all services
docker compose -f docker-compose.enterprise.yml ps

# Check specific service
docker compose -f docker-compose.enterprise.yml ps 28hub-api

# Check resource usage
docker stats
```

### Executing Commands in Containers

```bash
# Execute command in container
docker exec 28hub-connect-28hub-api-1 ls -la

# Open shell in container
docker exec -it 28hub-connect-28hub-api-1 /bin/bash

# Run Python script
docker exec 28hub-connect-28hub-api-1 python script.py

# Run database migration
docker exec 28hub-connect-28hub-api-1 alembic upgrade head
```

### Building Images

```bash
# Build all images
docker compose -f docker-compose.enterprise.yml build

# Build specific service
docker compose -f docker-compose.enterprise.yml build 28hub-api

# Build without cache
docker compose -f docker-compose.enterprise.yml build --no-cache

# Build with specific tag
docker compose -f docker-compose.enterprise.yml build --tag 28hub-api:v1.0.0
```

### Cleaning Up

```bash
# Remove stopped containers
docker compose -f docker-compose.enterprise.yml rm

# Remove all containers (including running)
docker compose -f docker-compose.enterprise.yml down -v

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything (WARNING: deletes all data)
docker system prune -a --volumes
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker compose -f docker-compose.enterprise.yml up -d --scale 28hub-api=3

# Scale frontend to 2 instances
docker compose -f docker-compose.enterprise.yml up -d --scale frontend=2
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose -f docker-compose.enterprise.yml logs <service-name>

# Check container status
docker compose -f docker-compose.enterprise.yml ps

# Inspect container
docker inspect <container-id>
```

### Port Conflicts

```bash
# Check what's using a port
# Linux/macOS
lsof -i :8000

# Windows
netstat -ano | findstr :8000

# Change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead of 8000
```

### Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove specific volumes
docker volume rm <volume-name>
```

### Network Issues

```bash
# Check network connectivity
docker exec 28hub-connect-28hub-api-1 ping postgres

# Check DNS resolution
docker exec 28hub-connect-28hub-api-1 nslookup postgres

# Rebuild network
docker compose -f docker-compose.enterprise.yml down
docker compose -f docker-compose.enterprise.yml up -d
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker exec 28hub-connect-postgres-1 pg_isready

# Check database exists
docker exec 28hub-connect-postgres-1 psql -U postgres -c "\l"

# Test connection from API container
docker exec 28hub-connect-28hub-api-1 python -c "import psycopg2; conn = psycopg2.connect('postgresql://postgres:28hub2025@postgres:5432/28hub'); print('Connected')"
```

## Performance Optimization

### Resource Limits

Configure resource limits in docker-compose.yml:

```yaml
services:
  28hub-api:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Health Checks

Configure health checks:

```yaml
services:
  28hub-api:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Restart Policies

Configure restart policies:

```yaml
services:
  28hub-api:
    restart: unless-stopped
```

Options:
- `no`: Do not restart
- `on-failure`: Restart on failure
- `always`: Always restart
- `unless-stopped`: Always restart unless manually stopped

### Logging Configuration

Configure logging:

```yaml
services:
  28hub-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Documentation](https://docs.docker.com/compose)
- [Deployment Guide](DEPLOYMENT.md)
- [Setup Guide](SETUP.md)
