# 28Hub Connect - Deployment Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables Setup](#environment-variables-setup)
- [Deployment Steps](#deployment-steps)
- [Service Ports](#service-ports)
- [Production Deployment](#production-deployment)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying 28Hub Connect, ensure you have the following:

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended), macOS, or Windows with WSL2
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **RAM**: At least 8GB available (16GB recommended for production)
- **Disk Space**: At least 20GB free space
- **CPU**: 4+ cores recommended

### Software Requirements

- Docker and Docker Compose installed
- PostgreSQL experience (helpful but not required)
- Redis experience (helpful but not required)
- GitHub account (for version control)
- Basic command line knowledge

### Verify Docker Installation

```bash
docker --version
docker compose version
```

Expected output:
```
Docker version 24.0.0 or higher
Docker Compose version v2.20.0 or higher
```

## Environment Variables Setup

### Required Environment Variables

Copy `.env.example` to `.env` and configure all required variables:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

### Environment Variables Reference

#### Database Configuration

```bash
# PostgreSQL Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=28hub2025
POSTGRES_DB=postgres
```

**Description**: PostgreSQL database credentials used by all services.

**Security Note**: Change the default password in production environments.

#### 28Hub Backend Configuration

```bash
# Database Connection
DATABASE_URL=postgresql://postgres:28hub2025@postgres:5432/28hub

# Redis Cache
REDIS_URL=redis://redis:6379

# Evolution API Integration
EVOLUTION_KEY=28hub-enterprise-2025
N8N_URL=http://n8n:5678

# Security
JWT_SECRET=28hub-enterprise-jwt-2025
API_KEY=28hub-enterprise-2025

# EvoAI Integration
EVOAI_URL=http://evoai-backend:8000
EVOAI_API_KEY=28hub-evoai-integration-2025
```

**Description**: Core backend configuration for the 28Hub API.

#### Evolution API Configuration

```bash
# Evolution API Security
EVOLUTION_API_KEY=28hub-enterprise-2025
AUTHENTICATION_API_KEY=28hub-enterprise-2025

# Database & Cache
DATABASE_CONNECTION_URI=postgresql://postgres:28hub2025@postgres:5432/evolution_db
CACHE_REDIS_URI=redis://redis:6379

# n8n Integration
N8N_BASE_URL=http://n8n:5678
N8N_API_KEY=28hub-enterprise-2025
```

**Description**: WhatsApp gateway configuration for Evolution API.

#### n8n Configuration

```bash
# n8n Authentication
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=28hub2025

# PostgreSQL Database
DB_POSTGRESDB_HOST=postgres
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=28hub2025

# Redis Queue
QUEUE_BULL_REDIS_HOST=redis
```

**Description**: Workflow automation platform configuration.

#### Frontend Configuration

```bash
# API Endpoints
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_EVOAI_URL=http://evoai-backend:8000
```

**Description**: Next.js frontend API endpoints configuration.

#### EvoAI Configuration

```bash
# Database & Cache
POSTGRES_CONNECTION_STRING=postgresql://postgres:28hub2025@postgres:5432/evo_ai
REDIS_HOST=redis

# Security
JWT_SECRET_KEY=28hub-evoai-jwt-2025
EVOLUTION_API_KEY=28hub-enterprise-2025
```

**Description**: AI agents platform configuration.

#### MinIO Configuration

```bash
# MinIO Object Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
```

**Description**: S3-compatible object storage for files and media.

## Deployment Steps

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/OARANHA/28hub-connect.git
cd 28hub-connect
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Important**: Review and update all default passwords and secrets before deploying to production.

### Step 3: Build and Start Services

#### Option A: Enterprise Deployment (Recommended)

```bash
# Start PostgreSQL first (required for other services)
docker compose -f docker-compose.enterprise.yml up -d postgres
sleep 30

# Start all services
docker compose -f docker-compose.enterprise.yml up -d
sleep 60

# Check service status
docker compose -f docker-compose.enterprise.yml ps
```

Expected output:
```
NAME                                    STATUS
28hub-connect-postgres-1                Up (healthy)
28hub-connect-redis-1                   Up (healthy)
28hub-connect-28hub-api-1               Up (healthy)
28hub-connect-frontend-1                Up (healthy)
28hub-connect-evolution-api-1           Up (healthy)
28hub-connect-n8n-1                     Up (healthy)
28hub-connect-evoai-backend-1           Up (healthy)
28hub-connect-minio-1                   Up (healthy)
```

#### Option B: Production Deployment

```bash
# Start PostgreSQL first
docker compose -f docker-compose.prod.yml up -d postgres
sleep 30

# Start all services
docker compose -f docker-compose.prod.yml up -d
sleep 60

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Step 4: Run Database Migrations

After services are running, apply database migrations:

```bash
# 28Hub Backend migrations
docker exec 28hub-connect-28hub-api-1 alembic upgrade head

# EvoAI migrations (if using EvoAI)
docker exec 28hub-connect-evoai-backend-1 alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade -> 001_create_tenants
INFO  [alembic.runtime.migration] Running upgrade 001_create_tenants -> 002_create_notifications
...
```

### Step 5: Verify Deployment

#### Health Checks

```bash
# 28Hub Backend health
curl http://localhost:8000/health

# Evolution API health
curl http://localhost:8080/

# MinIO health
curl http://localhost:9000/minio/health/live

# n8n health
curl http://localhost:5678/healthz
```

Expected responses:
```json
// 28Hub Backend
{"status":"healthy","database":"connected","redis":"connected"}

// Evolution API
{"status":"ok"}

// MinIO
OK

// n8n
{"status":"ok"}
```

#### Frontend Access

Open your browser and navigate to:
- **Main Dashboard**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin

### Step 6: Create Initial Admin User

```bash
# Access the backend container
docker exec -it 28hub-connect-28hub-api-1 python

# Run the following in Python
from backend.database import SessionLocal
from backend.models import Tenant, PlanType
import secrets

db = SessionLocal()
admin = Tenant(
    name="28Hub Admin",
    wa_number="5511999999999",
    email="admin@28hub.com",
    api_key=secrets.token_urlsafe(32),
    plan=PlanType.ENTERPRISE,
    is_active=True
)
db.add(admin)
db.commit()
db.close()

exit()
```

## Service Ports

| Service | Internal Port | External Port | Description |
|---------|---------------|---------------|-------------|
| 28Hub Backend | 8000 | 8000 | FastAPI REST API |
| 28Hub Frontend | 3000 | 3000 | Next.js Web Application |
| Evolution API | 8080 | 8080 | WhatsApp Gateway |
| n8n | 5678 | 5678 | Workflow Automation Platform |
| EvoAI Backend | 8001 | 8001 | AI Agents Platform |
| MinIO | 9000 | 9000 | S3-compatible Object Storage |
| MinIO Console | 9001 | 9001 | MinIO Web Console |
| PostgreSQL | 5432 | 5432 | Primary Database |
| Redis | 6379 | 6379 | Cache & Message Queue |

### Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nginx (Optional)                          │
│                    SSL Termination & Load Balancing              │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   Frontend     │  │   28Hub API     │  │ Evolution API  │
│   (Next.js)    │  │   (FastAPI)     │  │  (WhatsApp)    │
│   Port: 3000   │  │   Port: 8000    │  │   Port: 8080   │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│      n8n       │  │  EvoAI Backend  │  │     MinIO      │
│  (Workflows)   │  │   (AI Agents)   │  │  (Storage)     │
│   Port: 5678   │  │   Port: 8001    │  │   Port: 9000   │
└───────┬────────┘  └────────┬────────┘  └───────┬────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│   PostgreSQL   │  │     Redis       │  │  MinIO Console │
│   (Database)   │  │    (Cache)      │  │   (Management) │
│   Port: 5432   │  │   Port: 6379    │  │   Port: 9001   │
└────────────────┘  └─────────────────┘  └────────────────┘
```

## Production Deployment

### Render.com Deployment

#### 1. Push to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Production deployment"

# Push to GitHub
git push origin main
```

#### 2. Create Render Services

Navigate to [render.com](https://render.com) and create the following services:

##### PostgreSQL Database

1. Click **New** → **PostgreSQL**
2. Configure:
   - Database Name: `28hub`
   - User: `28hub_user`
   - Region: Choose nearest to your users
   - Plan: Free or Production

##### Redis Instance

1. Click **New** → **Redis**
2. Configure:
   - Name: `28hub-redis`
   - Region: Same as PostgreSQL
   - Plan: Free or Production

##### 28Hub API Web Service

1. Click **New** → **Web Service**
2. Configure:
   - Name: `28hub-api`
   - Runtime: Docker
   - Build Command: `docker build -t 28hub-api ./backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port 8000`

##### Frontend Web Service

1. Click **New** → **Web Service**
2. Configure:
   - Name: `28hub-frontend`
   - Runtime: Docker
   - Build Command: `docker build -t 28hub-frontend ./frontend`
   - Start Command: `npm start`

#### 3. Configure Environment Variables

In Render dashboard, add environment variables for each service:

**28Hub API Variables:**
```
DATABASE_URL=postgresql://user:password@host:5432/28hub
REDIS_URL=redis://host:6379
JWT_SECRET=your-production-secret
API_KEY=your-production-api-key
EVOAI_URL=https://your-evoai-url
EVOAI_API_KEY=your-evoai-key
```

**Frontend Variables:**
```
NEXT_PUBLIC_API_URL=https://your-api-url
NEXT_PUBLIC_EVOAI_URL=https://your-evoai-url
```

#### 4. Deploy

Render will automatically deploy on push. Monitor deployment logs in the Render dashboard.

### AWS Deployment (Alternative)

#### Using ECS (Elastic Container Service)

1. **Push Docker Images to ECR**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag 28hub-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/28hub-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/28hub-api:latest
```

2. **Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name 28hub-cluster
```

3. **Create Task Definitions**
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

4. **Create Service**
```bash
aws ecs create-service \
  --cluster 28hub-cluster \
  --service-name 28hub-api \
  --task-definition 28hub-api \
  --desired-count 2
```

### DigitalOcean App Platform Deployment

1. **Push to GitHub**
2. **Create App** on DigitalOcean
3. **Connect GitHub repository**
4. **Configure services** (API, Frontend, PostgreSQL, Redis)
5. **Deploy**

## Security Considerations

### Passwords and Secrets

**Critical**: Change all default passwords and secrets before production deployment.

```bash
# Generate secure passwords
openssl rand -base64 32

# Generate API keys
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate JWT secrets
python -c "import secrets; print(secrets.token_hex(32))"
```

### SSL/HTTPS Configuration

#### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (configured automatically)
sudo certbot renew --dry-run
```

#### Using Cloudflare

1. Add your domain to Cloudflare
2. Configure DNS records
3. Enable SSL/TLS (Full mode)
4. Set up Page Rules for redirects

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports (if needed)
sudo ufw allow 8000/tcp
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Monitoring and Alerts

#### Using Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure-password
```

#### Using Sentry for Error Tracking

Add to your `.env`:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Database Backups

#### Automated PostgreSQL Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
docker exec 28hub-connect-postgres-1 pg_dump -U postgres 28hub > $BACKUP_DIR/28hub_$DATE.sql
# Keep last 7 days
find $BACKUP_DIR -name "28hub_*.sql" -mtime +7 -delete
EOF

# Make executable
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

#### Backup to S3

```bash
# Install AWS CLI
pip install awscli

# Upload backup to S3
aws s3 cp /backups/28hub_$(date +%Y%m%d).sql s3://your-bucket/backups/
```

### Rate Limiting

Configure rate limiting in your reverse proxy (Nginx):

```nginx
# nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://28hub-api:8000;
    }
}
```

## Troubleshooting

### Common Issues

#### Service Won't Start

**Problem**: Service exits immediately after starting.

**Solution**:
```bash
# Check logs
docker compose -f docker-compose.enterprise.yml logs <service-name>

# Example
docker compose -f docker-compose.enterprise.yml logs 28hub-api

# Common causes:
# 1. Port conflicts - check if port is already in use
netstat -tuln | grep <port>

# 2. Database connection - verify DATABASE_URL
docker exec 28hub-connect-postgres-1 psql -U postgres -c "SELECT 1"

# 3. Missing environment variables
docker compose -f docker-compose.enterprise.yml config
```

#### Database Migration Fails

**Problem**: Alembic migration fails with error.

**Solution**:
```bash
# Check current migration version
docker exec 28hub-connect-28hub-api-1 alembic current

# Reset database (CAUTION: deletes all data)
docker exec 28hub-connect-postgres-1 psql -U postgres -c "DROP DATABASE IF EXISTS 28hub; CREATE DATABASE 28hub;"

# Re-run migrations
docker exec 28hub-connect-28hub-api-1 alembic upgrade head
```

#### WhatsApp Connection Issues

**Problem**: Evolution API can't connect to WhatsApp.

**Solution**:
```bash
# Check Evolution API logs
docker compose -f docker-compose.enterprise.yml logs evolution-api

# Verify instance status
curl http://localhost:8080/instance/fetchInstances

# Reconnect instance
curl -X POST http://localhost:8080/instance/connect/28hub
```

#### Out of Memory

**Problem**: Services crash due to insufficient memory.

**Solution**:
```bash
# Check Docker memory usage
docker stats

# Increase Docker memory allocation:
# Docker Desktop → Settings → Resources → Memory

# Or use swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### Redis Connection Refused

**Problem**: Services can't connect to Redis.

**Solution**:
```bash
# Check Redis status
docker compose -f docker-compose.enterprise.yml ps redis

# Test Redis connection
docker exec 28hub-connect-redis-1 redis-cli ping

# Expected output: PONG

# Restart Redis
docker compose -f docker-compose.enterprise.yml restart redis
```

### Getting Help

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
2. Review logs: `docker compose -f docker-compose.enterprise.yml logs`
3. Open an issue on GitHub: https://github.com/OARANHA/28hub-connect/issues
4. Contact support: support@28hub.com

### Health Check Script

Create a health check script to verify all services:

```bash
#!/bin/bash
# health-check.sh

echo "Checking 28Hub Connect services..."

services=(
  "28hub-api:http://localhost:8000/health"
  "evolution-api:http://localhost:8080"
  "n8n:http://localhost:5678/healthz"
  "minio:http://localhost:9000/minio/health/live"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  url="${service##*:}"
  
  if curl -s -f "$url" > /dev/null 2>&1; then
    echo "✓ $name is healthy"
  else
    echo "✗ $name is unhealthy"
  fi
done
```

Make it executable:
```bash
chmod +x health-check.sh
./health-check.sh
```

## Additional Resources

- [API Documentation](API.md)
- [Setup Guide](SETUP.md)
- [Docker Architecture](DOCKER.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [GitHub Repository](https://github.com/OARANHA/28hub-connect)
