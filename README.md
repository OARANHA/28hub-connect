# 28Hub Connect

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com)

A comprehensive multi-tenant ERP integration platform that connects WhatsApp notifications with AI capabilities. Built with FastAPI, Next.js, PostgreSQL, Redis, and Evolution API.

## 🌟 Overview

28Hub Connect is an enterprise-grade platform designed to streamline business communications by integrating ERP systems with WhatsApp messaging. It provides real-time notifications, AI-powered message processing, and a modern dashboard for monitoring and management.

### Key Capabilities

- **Multi-Tenant Architecture**: Support for multiple organizations with complete data isolation
- **Plan-Based Access Control**: Free, Pro, and Enterprise tiers with different feature sets
- **WhatsApp Integration**: Full Evolution API integration for WhatsApp Business messaging
- **AI-Powered Processing**: Intelligent message processing via EvoAI integration
- **Workflow Automation**: n8n integration for complex business workflows
- **Real-Time Notifications**: Push notifications for ERP events and system alerts
- **Comprehensive Dashboard**: Modern React-based UI for monitoring and management
- **RESTful API**: Complete API for tenant management, webhooks, and integrations

## 🚀 Features

### Core Features

| Feature | Description | Free | Pro | Enterprise |
|---------|-------------|------|-----|------------|
| **Multi-Tenant** | Support multiple organizations | ✅ | ✅ | ✅ |
| **WhatsApp Integration** | Send and receive messages | ✅ | ✅ | ✅ |
| **Dashboard** | Monitor activity and statistics | ✅ | ✅ | ✅ |
| **ERP Webhooks** | Integrate with ERP systems | ✅ | ✅ | ✅ |
| **Notifications** | Real-time push notifications | ✅ | ✅ | ✅ |
| **AI Processing** | EvoAI integration for smart responses | ❌ | ✅ | ✅ |
| **Workflow Automation** | n8n integration for complex flows | ❌ | ✅ | ✅ |
| **Custom Branding** | White-label solution | ❌ | ❌ | ✅ |
| **Priority Support** | 24/7 dedicated support | ❌ | ❌ | ✅ |
| **API Rate Limit** | Requests per minute | 60 | 120 | 300 |

### WhatsApp Features

- **Message Sending**: Send text, media, and template messages
- **Message Receiving**: Receive and process incoming messages
- **QR Code Authentication**: Easy WhatsApp instance connection
- **Status Monitoring**: Real-time connection status tracking
- **Message History**: View sent and received messages
- **Multi-Instance Support**: Manage multiple WhatsApp numbers

### Integration Features

- **ERP Webhooks**: Receive events from ERP systems (sales, orders, payments)
- **Evolution API**: Full WhatsApp Business API integration
- **EvoAI**: AI-powered message processing and response generation
- **n8n**: Workflow automation for complex business processes
- **MinIO**: S3-compatible object storage for files and media

### Dashboard Features

- **Tenant Management**: View and manage all tenants
- **Statistics**: Real-time statistics on messages, notifications, and webhooks
- **Activity Feed**: Recent activity timeline
- **WhatsApp Console**: Manage WhatsApp instances and messages
- **Notifications Center**: View and manage notifications
- **Reports**: Generate and export reports
- **Settings**: Configure tenant settings and preferences

## 📋 Prerequisites

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

## 🔧 Quick Start

### 1-Click Deploy (Docker Compose)

```bash
# Clone the repository
git clone https://github.com/OARANHA/28hub-connect.git
cd 28hub-connect

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start PostgreSQL first
docker compose -f docker-compose.enterprise.yml up -d postgres
sleep 30

# Start all services
docker compose -f docker-compose.enterprise.yml up -d
sleep 60

# Check service status
docker compose -f docker-compose.enterprise.yml ps

# Run database migrations
docker exec 28hub-connect-28hub-api-1 alembic upgrade head

# Access the application
open http://localhost:3000
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main dashboard |
| Admin Panel | http://localhost:3000/admin | Admin dashboard |
| API Docs | http://localhost:8000/docs | FastAPI Swagger docs |
| Evolution API | http://localhost:8080 | WhatsApp gateway |
| n8n | http://localhost:5678 | Workflow automation |
| MinIO Console | http://localhost:9001 | Object storage console |

## 📁 Project Structure

```
28hub-connect/
├── backend/                    # FastAPI backend
│   ├── main.py                # Main application
│   ├── models.py              # Database models
│   ├── database.py            # Database configuration
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Backend container
│   ├── alembic/               # Database migrations
│   │   └── versions/          # Migration files
│   └── integrations/          # External integrations
│       └── evoai.py          # EvoAI integration
├── frontend/                   # Next.js frontend
│   ├── app/                   # Next.js app directory
│   │   ├── page.tsx          # Home page
│   │   ├── admin/            # Admin pages
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── clients/          # Tenant management
│   │   ├── notifications/    # Notifications
│   │   ├── reports/          # Reports
│   │   ├── settings/         # Settings
│   │   └── whatsapp/         # WhatsApp management
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── lib/                   # Utilities
│   ├── package.json          # Node dependencies
│   └── Dockerfile            # Frontend container
├── services/                   # External services
│   └── evo-ai/               # EvoAI service
├── n8n-workflows/             # n8n workflow definitions
├── nginx/                     # Nginx configuration
├── docker-compose.enterprise.yml  # Enterprise deployment
├── docker-compose.prod.yml        # Production deployment
├── init-databases.sql         # Database initialization
├── LICENSE                    # MIT License
├── DEPLOYMENT.md              # Deployment guide
├── API.md                     # API documentation
├── SETUP.md                   # Development setup
├── DOCKER.md                  # Docker architecture
└── README.md                  # This file
```

## 🏗️ Architecture

### System Architecture

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

### Data Flow

```
┌──────────┐
│   ERP    │
│  System  │
└────┬─────┘
     │ Webhook
     ▼
┌─────────────────────────────────────────────────────────────┐
│                      28Hub API                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   Tenant    │  │ Notification│  │   Billing   │       │
│  │   Service   │  │   Service   │  │   Service   │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
└─────────┼────────────────┼────────────────┼───────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌─────────────┐              ┌─────────────┐              │
│  │ PostgreSQL  │              │    Redis     │              │
│  └─────────────┘              └─────────────┘              │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Integrations                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │ Evolution   │  │    n8n      │  │   EvoAI     │       │
│  │    API      │  │  Workflows  │  │   Agents    │       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
└─────────┼────────────────┼────────────────┼───────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      External Services                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  WhatsApp   │  │  ERP/Other  │  │   AI APIs   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 API Endpoints

### Quick Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/28hub/register` | POST | Register new tenant |
| `/api/v1/28hub/{id}/dashboard` | GET | Get tenant dashboard |
| `/api/v1/28hub/{id}/notifications` | GET | Get notifications |
| `/api/v1/28hub/{id}/whatsapp/send` | POST | Send WhatsApp message |
| `/api/v1/28hub/{id}/webhook/erp` | POST | ERP webhook |
| `/api/v1/admin/tenants` | GET | List all tenants |
| `/api/v1/admin/dashboard` | GET | Admin dashboard |

For complete API documentation, see [API.md](API.md).

## 🔐 Security

### Security Features

- **API Key Authentication**: All tenant endpoints require valid API keys
- **Multi-Tenant Data Isolation**: Complete data separation between tenants
- **Plan-Based Access Control**: Feature access based on subscription plan
- **Rate Limiting**: Configurable rate limits per plan tier
- **CORS Configuration**: Proper cross-origin resource sharing
- **Environment Variables**: Sensitive data stored in environment variables
- **Health Checks**: Health monitoring for all services
- **Docker Security**: Container isolation and resource limits

### Best Practices

- **Change Default Passwords**: Always change default passwords in production
- **Use HTTPS**: Enable SSL/TLS in production environments
- **Rotate API Keys**: Regularly rotate API keys and secrets
- **Monitor Logs**: Monitor logs for suspicious activity
- **Regular Backups**: Implement regular database backups
- **Firewall Rules**: Configure proper firewall rules
- **Update Dependencies**: Keep dependencies up to date

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Integration Tests

```bash
# Run all tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📝 Development

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

For detailed development setup, see [SETUP.md](SETUP.md).

## 🚢 Deployment

### Local Development

```bash
docker compose -f docker-compose.enterprise.yml up -d
```

### Production Deployment

```bash
docker compose -f docker-compose.prod.yml up -d
```

For complete deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Cloud Deployment

The platform can be deployed to various cloud providers:

- **Render.com**: Easy deployment with managed databases
- **AWS**: ECS for container orchestration
- **DigitalOcean**: App Platform for simplified deployment
- **Google Cloud**: Cloud Run for serverless deployment

## 📊 Database Models

### Tenant

```python
class Tenant(Base):
    id: UUID (Primary Key)
    name: str
    wa_number: str
    email: str
    api_key: str
    plan: PlanType (FREE, PRO, ENTERPRISE)
    is_active: bool
    created_at: datetime
    updated_at: datetime
```

### Notification

```python
class Notification(Base):
    id: UUID (Primary Key)
    tenant_id: UUID (Foreign Key)
    type: str
    title: str
    message: str
    data: JSON
    read: bool
    created_at: datetime
```

### Billing

```python
class Billing(Base):
    id: UUID (Primary Key)
    tenant_id: UUID (Foreign Key)
    plan: PlanType
    amount: Decimal
    status: str
    period_start: datetime
    period_end: datetime
    created_at: datetime
```

## 📈 Monitoring

### View Logs

```bash
# All services
docker compose -f docker-compose.enterprise.yml logs -f

# Specific service
docker compose -f docker-compose.enterprise.yml logs -f 28hub-api

# Last 100 lines
docker compose -f docker-compose.enterprise.yml logs --tail=100
```

### Health Checks

```bash
# 28Hub API
curl http://localhost:8000/health

# Evolution API
curl http://localhost:8080/

# n8n
curl http://localhost:5678/healthz

# MinIO
curl http://localhost:9000/minio/health/live
```

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Code Style

- **Python**: Follow PEP 8 guidelines
- **TypeScript**: Follow ESLint rules
- **Comments**: Document complex logic
- **Tests**: Write tests for new features

### Pull Request Guidelines

- Include tests for new features
- Update documentation as needed
- Ensure all tests pass
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](API.md) - Full API reference
- [Setup Guide](SETUP.md) - Development environment setup
- [Docker Architecture](DOCKER.md) - Docker container details
- [Troubleshooting](PROBLEMAS-SOLUCOES.md) - Common issues and solutions

## 🆘 Support

For support:

- **Email**: support@28hub.com
- **GitHub Issues**: [Open an issue](https://github.com/OARANHA/28hub-connect/issues)
- **Documentation**: Check the [documentation](#-documentation)

## 🙏 Acknowledgments

- **FastAPI** team for the excellent framework
- **Next.js** team for the React framework
- **Evolution API** for WhatsApp integration
- **n8n** for workflow automation
- **EvoAI** for AI capabilities
- **WhatsApp Business API** for messaging capabilities

## 🗺️ Roadmap

### Upcoming Features

- [ ] Mobile app (iOS and Android)
- [ ] Advanced analytics and reporting
- [ ] Custom workflow builder
- [ ] Multi-language support
- [ ] Advanced AI features
- [ ] Integration marketplace
- [ ] White-label customization
- [ ] Advanced security features

### Planned Improvements

- [ ] Performance optimizations
- [ ] Enhanced monitoring
- [ ] Improved documentation
- [ ] More integrations
- [ ] Better error handling
- [ ] Enhanced testing coverage

---

Made with ❤️ by the 28Hub Team
