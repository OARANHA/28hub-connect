# 28Hub Connect - API Documentation

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Tenant Endpoints](#tenant-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Webhook Endpoints](#webhook-endpoints)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The 28Hub Connect API provides a RESTful interface for managing tenants, WhatsApp integrations, notifications, billing, and more. The API is built with FastAPI and supports multi-tenant architecture with plan-based access control.

### Key Features

- **Multi-tenant Architecture**: Each tenant has isolated data and API keys
- **Plan-based Access Control**: Different features available based on subscription plan
- **WhatsApp Integration**: Full Evolution API integration for WhatsApp messaging
- **Webhook Support**: ERP and webhook integrations for automation
- **Real-time Notifications**: Push notifications for important events
- **Billing Integration**: Usage tracking and subscription management

## Base URL

### Development
```
http://localhost:8000/api/v1
```

### Production
```
https://api.28hub.com/api/v1
```

## Authentication

All tenant endpoints require authentication via the `X-API-Key` header.

### API Key Authentication

```http
X-API-Key: {tenant_api_key}
```

### Example Request

```http
GET /api/v1/28hub/{tenant_id}/dashboard
X-API-Key: your-tenant-api-key-here
```

### Obtaining an API Key

API keys are generated when a tenant is registered. The API key is returned in the registration response and can be retrieved from the tenant dashboard.

### Security Notes

- **Never expose API keys in client-side code**
- **Use environment variables to store API keys**
- **Rotate API keys regularly**
- **Use HTTPS in production**

## Tenant Endpoints

### Register Tenant

Create a new tenant account.

**Endpoint**
```
POST /api/v1/28hub/register
```

**Request Body**
```json
{
  "name": "Loja Exemplo",
  "wa_number": "5511999999999",
  "email": "contato@loja.com"
}
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Tenant/company name |
| wa_number | string | Yes | WhatsApp number (format: 55XXXXXXXXXXX) |
| email | string | Yes | Contact email address |

**Response (201 Created)**
```json
{
  "id": "uuid-here",
  "name": "Loja Exemplo",
  "wa_number": "5511999999999",
  "email": "contato@loja.com",
  "api_key": "generated-api-key",
  "plan": "free",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Error Response (422 Validation Error)**
```json
{
  "detail": [
    {
      "loc": ["body", "wa_number"],
      "msg": "Invalid WhatsApp number format",
      "type": "value_error"
    }
  ]
}
```

### Get Tenant Dashboard

Retrieve tenant dashboard data including statistics and recent activity.

**Endpoint**
```
GET /api/v1/28hub/{tenant_id}/dashboard
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Path Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenant_id | string | Yes | Tenant UUID |

**Response (200 OK)**
```json
{
  "tenant": {
    "id": "uuid-here",
    "name": "Loja Exemplo",
    "plan": "pro",
    "is_active": true
  },
  "statistics": {
    "total_messages": 1523,
    "messages_today": 45,
    "total_notifications": 89,
    "notifications_today": 5,
    "webhooks_processed": 234,
    "webhooks_failed": 2
  },
  "recent_activity": [
    {
      "type": "message_sent",
      "timestamp": "2024-01-01T12:00:00Z",
      "details": "Message sent to +5511888888888"
    },
    {
      "type": "notification",
      "timestamp": "2024-01-01T11:30:00Z",
      "details": "New sale notification received"
    }
  ],
  "wa_status": {
    "connected": true,
    "instance_name": "28hub-tenant-id",
    "qr_code": null
  }
}
```

**Error Response (401 Unauthorized)**
```json
{
  "detail": "Invalid API key"
}
```

**Error Response (403 Forbidden)**
```json
{
  "detail": "Plan restriction: dashboard access requires Pro plan or higher"
}
```

### Update Tenant

Update tenant information.

**Endpoint**
```
PUT /api/v1/28hub/{tenant_id}
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Request Body**
```json
{
  "name": "Updated Company Name",
  "email": "newemail@company.com"
}
```

**Response (200 OK)**
```json
{
  "id": "uuid-here",
  "name": "Updated Company Name",
  "wa_number": "5511999999999",
  "email": "newemail@company.com",
  "plan": "pro",
  "is_active": true,
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Get Notifications

Retrieve notifications for a tenant.

**Endpoint**
```
GET /api/v1/28hub/{tenant_id}/notifications
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Maximum number of notifications to return |
| offset | integer | 0 | Number of notifications to skip |
| unread_only | boolean | false | Return only unread notifications |

**Response (200 OK)**
```json
{
  "total": 89,
  "unread": 12,
  "notifications": [
    {
      "id": "uuid-here",
      "type": "sale",
      "title": "Nova Venda",
      "message": "Venda de R$ 1.500,00 realizada por João Silva",
      "data": {
        "customer": "João Silva",
        "amount": 1500.00,
        "items": ["Produto A", "Produto B"]
      },
      "read": false,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Mark Notification as Read

Mark a specific notification as read.

**Endpoint**
```
PUT /api/v1/28hub/{tenant_id}/notifications/{notification_id}/read
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Response (200 OK)**
```json
{
  "id": "uuid-here",
  "read": true,
  "read_at": "2024-01-01T12:30:00Z"
}
```

### Send WhatsApp Message

Send a WhatsApp message through Evolution API.

**Endpoint**
```
POST /api/v1/28hub/{tenant_id}/whatsapp/send
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Request Body**
```json
{
  "number": "5511888888888",
  "message": "Hello! Your order has been shipped."
}
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| number | string | Yes | Recipient phone number (format: 55XXXXXXXXXXX) |
| message | string | Yes | Message content |

**Response (200 OK)**
```json
{
  "message_id": "msg-uuid-here",
  "status": "sent",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Error Response (400 Bad Request)**
```json
{
  "detail": "WhatsApp instance not connected. Please connect first."
}
```

### Connect WhatsApp Instance

Connect a new WhatsApp instance (QR code generation).

**Endpoint**
```
POST /api/v1/28hub/{tenant_id}/whatsapp/connect
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Response (200 OK)**
```json
{
  "instance_name": "28hub-tenant-id",
  "qr_code": "data:image/png;base64,iVBORw0KG...",
  "status": "pending",
  "instructions": "Scan the QR code with WhatsApp to connect"
}
```

### Check WhatsApp Status

Check the connection status of the WhatsApp instance.

**Endpoint**
```
GET /api/v1/28hub/{tenant_id}/whatsapp/status
```

**Headers**
```
X-API-Key: {tenant_api_key}
```

**Response (200 OK)**
```json
{
  "connected": true,
  "instance_name": "28hub-tenant-id",
  "status": "open",
  "battery": 85,
  "is_business": true
}
```

## Admin Endpoints

Admin endpoints are protected and require admin authentication.

### List All Tenants

Retrieve a list of all tenants (admin only).

**Endpoint**
```
GET /api/v1/admin/tenants
```

**Headers**
```
X-API-Key: {admin_api_key}
```

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Maximum number of tenants to return |
| offset | integer | 0 | Number of tenants to skip |
| plan | string | null | Filter by plan (free, pro, enterprise) |
| active | boolean | null | Filter by active status |

**Response (200 OK)**
```json
{
  "total": 42,
  "tenants": [
    {
      "id": "uuid-here",
      "name": "Loja Exemplo",
      "email": "contato@loja.com",
      "wa_number": "5511999999999",
      "plan": "pro",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "last_active": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Get Admin Dashboard

Retrieve admin dashboard with platform statistics.

**Endpoint**
```
GET /api/v1/admin/dashboard
```

**Headers**
```
X-API-Key: {admin_api_key}
```

**Response (200 OK)**
```json
{
  "statistics": {
    "total_tenants": 42,
    "active_tenants": 38,
    "total_messages": 15234,
    "messages_today": 456,
    "total_notifications": 892,
    "notifications_today": 67,
    "revenue_this_month": 12500.00
  },
  "tenants_by_plan": {
    "free": 25,
    "pro": 12,
    "enterprise": 5
  },
  "recent_registrations": [
    {
      "id": "uuid-here",
      "name": "New Company",
      "plan": "pro",
      "registered_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

### Update Tenant Plan

Update a tenant's subscription plan.

**Endpoint**
```
PUT /api/v1/admin/tenants/{tenant_id}/plan
```

**Headers**
```
X-API-Key: {admin_api_key}
```

**Request Body**
```json
{
  "plan": "enterprise"
}
```

**Parameters**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| plan | string | Yes | New plan: free, pro, or enterprise |

**Response (200 OK)**
```json
{
  "id": "uuid-here",
  "name": "Loja Exemplo",
  "plan": "enterprise",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

### Deactivate Tenant

Deactivate a tenant account.

**Endpoint**
```
PUT /api/v1/admin/tenants/{tenant_id}/deactivate
```

**Headers**
```
X-API-Key: {admin_api_key}
```

**Response (200 OK)**
```json
{
  "id": "uuid-here",
  "is_active": false,
  "deactivated_at": "2024-01-01T12:00:00Z"
}
```

### Activate Tenant

Activate a previously deactivated tenant account.

**Endpoint**
```
PUT /api/v1/admin/tenants/{tenant_id}/activate
```

**Headers**
```
X-API-Key: {admin_api_key}
```

**Response (200 OK)**
```json
{
  "id": "uuid-here",
  "is_active": true,
  "activated_at": "2024-01-01T12:00:00Z"
}
```

## Webhook Endpoints

### ERP Webhook

Receive ERP webhook events for automation.

**Endpoint**
```
POST /api/v1/28hub/{tenant_id}/webhook/erp
```

**Headers**
```
X-API-Key: {tenant_api_key}
Content-Type: application/json
```

**Request Body**
```json
{
  "evento": "venda",
  "cliente": "João Silva",
  "telefone": "5511888888888",
  "nota": "NF12345",
  "valor": 1500.00,
  "produtos": [
    {
      "name": "Produto 1",
      "qty": 1,
      "price": 1500.00
    }
  ]
}
```

**Supported Events**

| Event | Description |
|-------|-------------|
| venda | New sale |
| pedido | New order |
| pagamento | Payment received |
| entrega | Order delivered |
| cancelamento | Order cancelled |

**Response (200 OK)**
```json
{
  "status": "processed",
  "webhook_id": "uuid-here",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Response (202 Accepted)**
```json
{
  "status": "queued",
  "webhook_id": "uuid-here",
  "message": "Webhook queued for processing"
}
```

### Evolution API Webhook

Receive webhook events from Evolution API.

**Endpoint**
```
POST /api/v1/28hub/{tenant_id}/webhook/evolution
```

**Headers**
```
X-API-Key: {tenant_api_key}
Content-Type: application/json
```

**Request Body**
```json
{
  "event": "messages.upsert",
  "data": {
    "key": {
      "remoteJid": "5511888888888@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0..."
    },
    "message": {
      "conversation": "Hello, I have a question"
    }
  }
}
```

**Response (200 OK)**
```json
{
  "status": "processed"
}
```

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Resource created successfully |
| 202 | Accepted - Request accepted for processing |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Plan restriction or insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Request validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

### Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message description",
  "error_code": "ERROR_CODE",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes

| Error Code | Description |
|------------|-------------|
| INVALID_API_KEY | The provided API key is invalid |
| TENANT_NOT_FOUND | Tenant with specified ID not found |
| PLAN_RESTRICTION | Feature not available for current plan |
| WA_NOT_CONNECTED | WhatsApp instance not connected |
| INVALID_PHONE_NUMBER | Phone number format is invalid |
| RATE_LIMIT_EXCEEDED | Too many requests |
| DATABASE_ERROR | Database operation failed |
| EVOLUTION_API_ERROR | Evolution API integration error |

## Rate Limiting

The API implements rate limiting to prevent abuse.

### Rate Limits by Plan

| Plan | Requests per Minute | Requests per Hour |
|------|---------------------|-------------------|
| Free | 60 | 1000 |
| Pro | 120 | 5000 |
| Enterprise | 300 | 15000 |

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704100800
```

### Handling Rate Limits

When rate limit is exceeded, the API returns:

```json
{
  "detail": "Rate limit exceeded",
  "error_code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 30
}
```

**Recommended Implementation**

```python
import time
import requests

def make_api_request(url, headers, max_retries=3):
    for attempt in range(max_retries):
        response = requests.get(url, headers=headers)
        
        if response.status_code == 429:
            retry_after = int(response.headers.get('Retry-After', 30))
            time.sleep(retry_after)
            continue
        
        return response
    
    raise Exception("Max retries exceeded")
```

## Examples

### Python Example

```python
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
API_KEY = "your-tenant-api-key"
TENANT_ID = "your-tenant-id"

# Headers
headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Register a new tenant
def register_tenant():
    url = f"{BASE_URL}/28hub/register"
    data = {
        "name": "My Store",
        "wa_number": "5511999999999",
        "email": "contact@mystore.com"
    }
    response = requests.post(url, json=data)
    return response.json()

# Get dashboard
def get_dashboard():
    url = f"{BASE_URL}/28hub/{TENANT_ID}/dashboard"
    response = requests.get(url, headers=headers)
    return response.json()

# Send WhatsApp message
def send_message(number, message):
    url = f"{BASE_URL}/28hub/{TENANT_ID}/whatsapp/send"
    data = {
        "number": number,
        "message": message
    }
    response = requests.post(url, headers=headers, json=data)
    return response.json()

# ERP webhook
def send_erp_webhook(event_data):
    url = f"{BASE_URL}/28hub/{TENANT_ID}/webhook/erp"
    response = requests.post(url, headers=headers, json=event_data)
    return response.json()

# Example usage
if __name__ == "__main__":
    # Register tenant
    tenant = register_tenant()
    print(f"Registered: {tenant}")
    
    # Get dashboard
    dashboard = get_dashboard()
    print(f"Dashboard: {dashboard}")
    
    # Send message
    result = send_message("5511888888888", "Hello from 28Hub!")
    print(f"Message sent: {result}")
    
    # Send ERP webhook
    webhook_data = {
        "evento": "venda",
        "cliente": "João Silva",
        "telefone": "5511888888888",
        "nota": "NF12345",
        "valor": 1500.00,
        "produtos": [{"name": "Produto 1", "qty": 1, "price": 1500.00}]
    }
    webhook_result = send_erp_webhook(webhook_data)
    print(f"Webhook result: {webhook_result}")
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8000/api/v1';
const API_KEY = 'your-tenant-api-key';
const TENANT_ID = 'your-tenant-id';

// Headers
const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json'
};

// Register a new tenant
async function registerTenant() {
  try {
    const response = await axios.post(`${BASE_URL}/28hub/register`, {
      name: 'My Store',
      wa_number: '5511999999999',
      email: 'contact@mystore.com'
    });
    return response.data;
  } catch (error) {
    console.error('Error registering tenant:', error.response?.data);
    throw error;
  }
}

// Get dashboard
async function getDashboard() {
  try {
    const response = await axios.get(
      `${BASE_URL}/28hub/${TENANT_ID}/dashboard`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting dashboard:', error.response?.data);
    throw error;
  }
}

// Send WhatsApp message
async function sendMessage(number, message) {
  try {
    const response = await axios.post(
      `${BASE_URL}/28hub/${TENANT_ID}/whatsapp/send`,
      { number, message },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error.response?.data);
    throw error;
  }
}

// ERP webhook
async function sendErpWebhook(eventData) {
  try {
    const response = await axios.post(
      `${BASE_URL}/28hub/${TENANT_ID}/webhook/erp`,
      eventData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending webhook:', error.response?.data);
    throw error;
  }
}

// Example usage
(async () => {
  try {
    // Register tenant
    const tenant = await registerTenant();
    console.log('Registered:', tenant);

    // Get dashboard
    const dashboard = await getDashboard();
    console.log('Dashboard:', dashboard);

    // Send message
    const result = await sendMessage('5511888888888', 'Hello from 28Hub!');
    console.log('Message sent:', result);

    // Send ERP webhook
    const webhookData = {
      evento: 'venda',
      cliente: 'João Silva',
      telefone: '5511888888888',
      nota: 'NF12345',
      valor: 1500.00,
      produtos: [{ name: 'Produto 1', qty: 1, price: 1500.00 }]
    };
    const webhookResult = await sendErpWebhook(webhookData);
    console.log('Webhook result:', webhookResult);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
```

### cURL Examples

```bash
# Register tenant
curl -X POST http://localhost:8000/api/v1/28hub/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "wa_number": "5511999999999",
    "email": "contact@mystore.com"
  }'

# Get dashboard
curl -X GET http://localhost:8000/api/v1/28hub/{tenant_id}/dashboard \
  -H "X-API-Key: your-api-key"

# Send WhatsApp message
curl -X POST http://localhost:8000/api/v1/28hub/{tenant_id}/whatsapp/send \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511888888888",
    "message": "Hello from 28Hub!"
  }'

# ERP webhook
curl -X POST http://localhost:8000/api/v1/28hub/{tenant_id}/webhook/erp \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "evento": "venda",
    "cliente": "João Silva",
    "telefone": "5511888888888",
    "nota": "NF12345",
    "valor": 1500.00,
    "produtos": [{"name": "Produto 1", "qty": 1, "price": 1500.00}]
  }'
```

## Additional Resources

- [Deployment Guide](DEPLOYMENT.md)
- [Setup Guide](SETUP.md)
- [GitHub Repository](https://github.com/OARANHA/28hub-connect)
- [Evolution API Documentation](https://doc.evolution-api.com/)
