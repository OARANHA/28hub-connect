# 28hub-connect

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com)

A full-stack ERP integration system that connects WhatsApp notifications with AI capabilities. Built with FastAPI, Next.js, PostgreSQL, and Redis.

## 🚀 Features

- **WhatsApp Integration**: Real-time ERP notifications via WhatsApp
- **AI-Powered**: Intelligent message processing and response generation
- **Multi-Tenant**: Support for multiple organizations with isolated data
- **Dashboard UI**: Modern React-based dashboard for monitoring and management
- **RESTful API**: Complete API for tenant registration, webhooks, and dashboard data
- **Scalable Architecture**: Docker-based deployment with health checks

## 📋 Prerequisites

- Docker & Docker Compose
- WhatsApp Business API credentials
- AI API key (OpenAI or compatible)
- PostgreSQL 15+
- Redis 7+

## 🔧 Quick Start

### 1-Click Deploy (Docker Compose)

```bash
# Clone the repository
git clone https://github.com/your-org/28hub-connect.git
cd 28hub-connect

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://28hub:28hub_password@db:5432/28hub_db

# WhatsApp Business API
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# AI Service
AI_API_KEY=your_ai_api_key

# Application
ENVIRONMENT=production
SECRET_KEY=your_secret_key_here
```

## 📁 Project Structure

```
28hub-connect/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── Dockerfile           # Backend container definition
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── app/
│   │   └── page.tsx        # Dashboard UI component
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container definition
├── docker-compose.prod.yml # Multi-service orchestration
├── LICENSE                # MIT License
└── README.md              # This file
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```

### Tenant Registration
```
POST /api/v1/28hub/register
Content-Type: application/json

{
  "name": "Organization Name",
  "email": "contact@example.com",
  "phone": "+1234567890"
}
```

### ERP Webhook
```
POST /api/v1/28hub/{tenant_id}/webhook/erp
Content-Type: application/json

{
  "event_type": "order_created",
  "data": {
    "order_id": "12345",
    "customer": "John Doe",
    "total": 99.99
  }
}
```

### Dashboard Data
```
GET /api/v1/28hub/{tenant_id}/dashboard
```

## 🏗️ Architecture

```
┌─────────────┐
│   Nginx     │ (Reverse Proxy)
│   :80/:443  │
└──────┬──────┘
       │
   ┌───┴──────────────────────┐
   │                          │
┌──▼────────┐         ┌───────▼────────┐
│  Frontend │         │    Backend     │
│  Next.js  │◄────────│    FastAPI     │
│  :3000    │         │    :8000       │
└───────────┘         └───────┬────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
              ┌─────▼─────┐       ┌─────▼─────┐
              │ PostgreSQL│       │   Redis   │
              │   :5432   │       │   :6379   │
              └───────────┘       └───────────┘
```

## 🔐 Security

- CORS enabled for cross-origin requests
- Environment-based configuration
- Health checks for all services
- Isolated tenant data

## 📊 Database Models

### Tenant
- `id`: Primary key
- `name`: Organization name
- `email`: Contact email
- `phone`: Contact phone
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Notification
- `id`: Primary key
- `tenant_id`: Foreign key to Tenant
- `event_type`: ERP event type
- `message`: Notification message
- `status`: Delivery status
- `created_at`: Timestamp

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest

# Run frontend tests
cd frontend
npm test
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

## 🚢 Deployment

### Production Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling Services
```bash
# Scale backend
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

## 📈 Monitoring

View logs for specific services:
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Backend only
docker-compose -f docker-compose.prod.yml logs -f backend

# Frontend only
docker-compose -f docker-compose.prod.yml logs -f frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@28hub.com or open an issue in the repository.

## 🙏 Acknowledgments

- FastAPI team for the excellent framework
- Next.js team for the React framework
- WhatsApp Business API for messaging capabilities
