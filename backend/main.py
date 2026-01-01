from fastapi import FastAPI, HTTPException, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import httpx
import secrets
import logging

# Import models and database configuration
from models import Tenant, Notification, Template, Base
from database import engine, SessionLocal
from integrations.evoai import evoai

# Evolution API configuration
EVOLUTION_URL = os.getenv("EVOLUTION_URL", "http://28hub-evolution:8080")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "28hub-secret-2025")

# N8N webhook configuration
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678/webhook/28hub")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class TenantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    whatsapp_instance: Optional[str] = None


class TenantResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    whatsapp_instance: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    event_type: str
    message: str


class NotificationResponse(BaseModel):
    id: int
    tenant_id: int
    event_type: str
    message: str
    status: str
    whatsapp_message_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    tenant: TenantResponse
    notifications: List[NotificationResponse]
    total_notifications: int
    pending_notifications: int
    delivered_notifications: int


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Tenant validation middleware - validates api_key
async def verify_tenant(tenant_id: str, x_api_key: str = Header(None), db: Session = Depends(get_db)) -> Tenant:
    """
    Validates tenant_id and api_key for tenant-specific endpoints.
    Enforces multi-tenant isolation.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key header (X-API-Key) is required"
        )
    
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if tenant.api_key != x_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    if tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant account is suspended"
        )
    
    return tenant


# Evolution API helper functions
async def send_whatsapp_message(phone: str, message: str, instance: str = "default") -> dict:
    """
    Send WhatsApp message using Evolution API
    """
    try:
        # Format phone number (remove special characters, add @s.whatsapp.net)
        formatted_phone = phone.replace("+", "").replace("(", "").replace(")", "").replace(" ", "").replace("-", "")
        if "@" not in formatted_phone:
            formatted_phone = f"{formatted_phone}@s.whatsapp.net"
        
        url = f"{EVOLUTION_URL}/message/sendText/{instance}"
        headers = {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY
        }
        payload = {
            "number": formatted_phone,
            "text": message
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        print(f"Error sending WhatsApp message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send WhatsApp message: {str(e)}"
        )


async def create_whatsapp_instance(instance_name: str) -> dict:
    """
    Create a new WhatsApp instance in Evolution API
    """
    try:
        url = f"{EVOLUTION_URL}/instance/create"
        headers = {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY
        }
        payload = {
            "instanceName": instance_name,
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        print(f"Error creating WhatsApp instance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create WhatsApp instance: {str(e)}"
        )


async def connect_whatsapp_instance(instance_name: str) -> dict:
    """
    Connect an existing WhatsApp instance
    """
    try:
        url = f"{EVOLUTION_URL}/instance/connect/{instance_name}"
        headers = {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        print(f"Error connecting WhatsApp instance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect WhatsApp instance: {str(e)}"
        )


# Initialize FastAPI app
app = FastAPI(
    title="28hub-connect API",
    description="ERP Integration System with WhatsApp Notifications and AI Capabilities",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "service": "28hub-connect-backend",
        "timestamp": datetime.utcnow().isoformat()
    }


# 1. Register new tenant with 7-day trial
@app.post("/api/v1/28hub/register", tags=["Tenants"])
def register_tenant(request: dict, db: Session = Depends(get_db)):
    """Creates new tenant with 7-day trial"""
    # Check if email already exists
    existing = db.execute(select(Tenant).where(Tenant.email == request.get('email'))).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Email já cadastrado")
    
    # Create new tenant
    tenant = Tenant(
        name=request.get('name'),
        email=request.get('email'),
        wa_number=request.get('wa_number'),
        plan='trial',
        trial_ends=datetime.now() + timedelta(days=7),
        api_key=secrets.token_hex(16),
        status='active'
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "email": tenant.email,
        "plan": tenant.plan,
        "api_key": tenant.api_key,
        "trial_ends": tenant.trial_ends.isoformat()
    }


# 3. Receive ERP webhook
@app.post("/api/v1/28hub/{tenant_id}/webhook/erp", tags=["Webhooks"])
async def erp_webhook(
    tenant_id: str,
    data: dict,
    x_api_key: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Receives ERP webhook and creates notification.
    Validates tenant via API key and sends to N8N for workflow processing.
    """
    # Validate tenant and API key
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key header (X-API-Key) is required"
        )
    
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    if tenant.api_key != x_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key"
        )
    
    if tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant account is suspended"
        )
    
    # Create notification with all fields
    notification = Notification(
        tenant_id=tenant.id,
        type=data.get('type', 'sale'),
        client_name=data.get('client_name'),
        client_phone=data.get('client_phone') or data.get('telefone'),
        value=data.get('value') or data.get('valor'),
        nf_number=data.get('nf_number'),
        products=data.get('products'),
        status='pending'
    )
    
    # Set legacy fields for backward compatibility
    notification.telefone = data.get('telefone') or data.get('client_phone')
    notification.valor = data.get('valor') or data.get('value')
    notification.event_type = data.get('type', 'sale')
    
    db.add(notification)
    db.commit()
    db.refresh(notification)
    
    # Send to N8N for workflow processing
    try:
        n8n_payload = {
            "tenant_id": tenant_id,
            "notification_id": str(notification.id),
            "type": notification.type,
            "client_name": notification.client_name,
            "client_phone": notification.client_phone,
            "value": notification.value,
            "nf_number": notification.nf_number,
            "products": notification.products,
            "api_key": x_api_key
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{N8N_WEBHOOK_URL}/erp",
                json=n8n_payload,
                headers={"Content-Type": "application/json"}
            )
            # Log N8N response but don't fail webhook if N8N is down
            logger.info(f"N8N webhook response: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Failed to send to N8N: {str(e)}")
        # Don't fail the webhook if N8N is unavailable
    
    logger.info(f"ERP webhook processed for tenant {tenant_id}: notification {notification.id}")
    
    return {
        "status": "pending",
        "notification_id": str(notification.id),
        "tenant_id": tenant_id
    }


# 4. Get tenant dashboard
@app.get("/api/v1/28hub/{tenant_id}/dashboard", tags=["Dashboard"])
def tenant_dashboard(
    tenant_id: str,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    Returns executive dashboard cards with tenant authentication.
    Enforces multi-tenant isolation.
    """
    # Get notification stats
    total_pending = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'pending'
        )
    ).scalar() or 0
    
    total_failed = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'failed'
        )
    ).scalar() or 0
    
    total_today = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.created_at >= datetime.now().date()
        )
    ).scalar() or 0
    
    total_sent = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'sent'
        )
    ).scalar() or 0
    
    # Calculate MRR contribution
    mrr = 0
    if tenant.plan == 'basic':
        mrr = 47
    elif tenant.plan == 'pro':
        mrr = 97
    elif tenant.plan == 'enterprise':
        mrr = 497
    
    # Check if trial is expiring soon
    trial_warning = False
    if tenant.trial_ends and tenant.plan == 'trial':
        days_left = (tenant.trial_ends - datetime.now()).days
        trial_warning = days_left <= 3
    
    return {
        "tenant_id": str(tenant.id),
        "tenant_name": tenant.name,
        "plan": tenant.plan,
        "mrr": f"R$ {mrr}",
        "pending_notifications": total_pending,
        "failed_notifications": total_failed,
        "today_notifications": total_today,
        "total_sent": total_sent,
        "whatsapp_status": tenant.wa_status,
        "trial_ends": tenant.trial_ends.isoformat() if tenant.trial_ends else None,
        "trial_warning": trial_warning,
        "status": tenant.status
    }


# 2. Connect WhatsApp (QR Code)
@app.post("/api/v1/28hub/{tenant_id}/whatsapp/connect", tags=["WhatsApp"])
def connect_whatsapp(tenant_id: str, db: Session = Depends(get_db)):
    """Connects tenant's WhatsApp and returns QR code"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # Create Evolution API instance
    instance_name = f"28hub-{tenant_id[:8]}"
    wa_instance = secrets.token_hex(8)
    
    # TODO: Call Evolution API to create instance and get QR code
    # For now, mock the response
    tenant.wa_instance = wa_instance
    tenant.wa_status = 'qr_pending'
    tenant.wa_qr_code = "mock_qr_code_from_evolution_api"
    db.commit()
    
    return {
        "instance": wa_instance,
        "qr_code": tenant.wa_qr_code,
        "status": "qr_pending"
    }


@app.post("/api/v1/28hub/{tenant_id}/whatsapp/send", tags=["WhatsApp"])
async def send_message(tenant_id: str, message_data: dict, db: Session = Depends(get_db)):
    """
    Send a custom WhatsApp message for a tenant
    
    - **tenant_id**: ID of the tenant
    - **message**: Message content to send
    """
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    if not tenant.whatsapp_instance or not tenant.phone:
        raise HTTPException(400, "WhatsApp not configured for this tenant")
    
    result = await send_whatsapp_message(
        phone=tenant.phone,
        message=message_data.get("message", ""),
        instance=tenant.whatsapp_instance
    )
    
    return {
        "status": "success",
        "message_id": result.get("key", {}).get("id"),
        "timestamp": datetime.utcnow().isoformat()
    }

# 5. Send batch of pending notifications
@app.post("/api/v1/28hub/{tenant_id}/send-batch", tags=["Notifications"])
def send_batch(tenant_id: str, db: Session = Depends(get_db)):
    """Sends all pending notifications in batch"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # Get all pending notifications
    notifications = db.execute(
        select(Notification).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'pending'
        )
    ).scalars().all()
    
    sent_count = 0
    for notif in notifications:
        # TODO: Send via Evolution API
        notif.status = 'sent'
        sent_count += 1
    
    db.commit()
    
    return {"sent": sent_count, "total": len(notifications)}

# 6. Get activities list
@app.get("/api/v1/28hub/{tenant_id}/activities", tags=["Activities"])
def get_activities(tenant_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Returns list of recent activities/notifications"""
    notifications = db.execute(
        select(Notification).where(
            Notification.tenant_id == tenant_id
        ).order_by(Notification.created_at.desc()).limit(limit)
    ).scalars().all()
    
    return [{
        "id": str(n.id),
        "type": n.type,
        "client_name": n.client_name,
        "telefone": n.telefone,
        "valor": float(n.valor) if n.valor else 0,
        "nf_number": n.nf_number,
        "status": n.status,
        "created_at": n.created_at.isoformat()
    } for n in notifications]

# 7. Update tenant profile
@app.put("/api/v1/28hub/{tenant_id}/profile", tags=["Tenants"])
def update_profile(tenant_id: str, data: dict, db: Session = Depends(get_db)):
    """Updates tenant profile"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    if 'name' in data:
        tenant.name = data['name']
    if 'wa_number' in data:
        tenant.wa_number = data['wa_number']
    
    db.commit()
    
    return {"status": "updated", "name": tenant.name}


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "28hub-connect API",
        "version": "1.0.0",
        "documentation": "/docs",
        "health": "/health"
    }


# SUPER ADMIN ENDPOINTS - ADICIONAR ANTES do if __name__ == "__main__":
@app.get("/api/v1/admin/dashboard", tags=["Admin"])
def admin_dashboard(db: Session = Depends(get_db)):
    tenants = db.execute(select(Tenant)).scalars().all()
    trial_clients = len([t for t in tenants if t.plan == "trial"])
    pro_clients = len([t for t in tenants if t.plan == "pro"])
    enterprise_clients = len([t for t in tenants if t.plan == "enterprise"])
    mrr = pro_clients * 97 + enterprise_clients * 497 + trial_clients * 0  # Trial grátis
    
    return {
        "mrr": f"R$ {mrr:,}",
        "total_clients": len(tenants),
        "trial_clients": trial_clients,
        "pro_clients": pro_clients,
        "enterprise_clients": enterprise_clients,
        "churn_rate": "0%",
        "conversion_rate": f"{((pro_clients + enterprise_clients)/(trial_clients+pro_clients+enterprise_clients)*100):.1f}%" if tenants else "0%"
    }

@app.get("/api/v1/admin/clients", tags=["Admin"])
def admin_clients(db: Session = Depends(get_db)):
    clients = db.execute(select(Tenant)).scalars().all()
    return [{
        "id": str(t.id),
        "name": t.name,
        "plan": t.plan,
        "wa_number": t.wa_number,
        "status": t.status,
        "trial_ends": t.trial_ends.isoformat() if t.trial_ends else None
    } for t in clients]

@app.post("/api/v1/admin/client/{tenant_id}/upgrade")
def upgrade_client(tenant_id: str, plan: str, db: Session = Depends(get_db)):
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Cliente não encontrado")
    tenant.plan = plan
    db.commit()
    return {"message": f"Cliente {tenant.name} upgradado para {plan}"}


# Required Admin Endpoints - Tenants Management
@app.get("/api/v1/admin/tenants", tags=["Admin"])
def list_tenants(db: Session = Depends(get_db)):
    """List all tenants (Admin endpoint)"""
    tenants = db.execute(select(Tenant)).scalars().all()
    return [{
        "id": str(t.id),
        "name": t.name,
        "email": t.email,
        "plan": t.plan,
        "wa_number": t.wa_number,
        "status": t.status,
        "trial_ends": t.trial_ends.isoformat() if t.trial_ends else None,
        "created_at": t.created_at.isoformat(),
        "wa_status": t.wa_status
    } for t in tenants]


@app.get("/api/v1/admin/tenants/{tenant_id}", tags=["Admin"])
def get_tenant_details(tenant_id: str, db: Session = Depends(get_db)):
    """Get tenant details (Admin endpoint)"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    
    # Get notification stats for this tenant
    total_notifications = db.execute(
        select(func.count(Notification.id)).where(Notification.tenant_id == tenant_id)
    ).scalar() or 0
    
    pending_notifications = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'pending'
        )
    ).scalar() or 0
    
    failed_notifications = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'failed'
        )
    ).scalar() or 0
    
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "email": tenant.email,
        "phone": tenant.phone,
        "plan": tenant.plan,
        "wa_number": tenant.wa_number,
        "status": tenant.status,
        "trial_ends": tenant.trial_ends.isoformat() if tenant.trial_ends else None,
        "created_at": tenant.created_at.isoformat(),
        "updated_at": tenant.updated_at.isoformat(),
        "wa_instance_name": tenant.wa_instance_name,
        "wa_status": tenant.wa_status,
        "stripe_customer_id": tenant.stripe_customer_id,
        "stats": {
            "total_notifications": total_notifications,
            "pending_notifications": pending_notifications,
            "failed_notifications": failed_notifications
        }
    }


@app.put("/api/v1/admin/tenants/{tenant_id}/plan", tags=["Admin"])
def update_tenant_plan(tenant_id: str, plan_data: dict, db: Session = Depends(get_db)):
    """Update tenant plan (Admin endpoint)"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    
    plan = plan_data.get("plan")
    if plan not in ["trial", "basic", "pro", "enterprise"]:
        raise HTTPException(400, "Invalid plan. Must be one of: trial, basic, pro, enterprise")
    
    old_plan = tenant.plan
    tenant.plan = plan
    
    # If upgrading from trial, set trial_ends to None
    if old_plan == "trial" and plan != "trial":
        tenant.trial_ends = None
    # If downgrading to trial, set new trial period
    elif plan == "trial" and old_plan != "trial":
        tenant.trial_ends = datetime.now() + timedelta(days=7)
    
    db.commit()
    
    logger.info(f"Tenant {tenant.name} plan updated from {old_plan} to {plan}")
    
    return {
        "id": str(tenant.id),
        "name": tenant.name,
        "old_plan": old_plan,
        "new_plan": plan,
        "trial_ends": tenant.trial_ends.isoformat() if tenant.trial_ends else None
    }


# Required Tenant Endpoints - Notifications with API Key Validation
@app.get("/api/v1/28hub/{tenant_id}/notifications", tags=["Notifications"])
def get_notifications(
    tenant_id: str,
    limit: int = 50,
    offset: int = 0,
    status_filter: Optional[str] = None,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    Get notifications list for a tenant with API key validation.
    Supports pagination and status filtering.
    """
    query = select(Notification).where(Notification.tenant_id == tenant_id)
    
    if status_filter:
        query = query.where(Notification.status == status_filter)
    
    total = db.execute(select(func.count()).select_from(query.subquery())).scalar() or 0
    
    notifications = db.execute(
        query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    ).scalars().all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "notifications": [{
            "id": str(n.id),
            "type": n.type,
            "client_name": n.client_name,
            "client_phone": n.client_phone or n.telefone,
            "value": n.value or float(n.valor) if n.valor else 0,
            "nf_number": n.nf_number,
            "status": n.status,
            "whatsapp_id": n.whatsapp_id or n.whatsapp_message_id,
            "products": n.products,
            "error_message": n.error_message,
            "retry_count": n.retry_count,
            "created_at": n.created_at.isoformat(),
            "sent_at": n.sent_at.isoformat() if n.sent_at else None
        } for n in notifications]
    }


@app.post("/api/v1/28hub/{tenant_id}/notifications/{notification_id}/retry", tags=["Notifications"])
async def retry_notification(
    tenant_id: str,
    notification_id: str,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """
    Retry a failed notification with API key validation.
    Increments retry count and attempts to send via WhatsApp.
    """
    notification = db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.tenant_id == tenant_id
        )
    ).scalar_one_or_none()
    
    if not notification:
        raise HTTPException(404, "Notification not found")
    
    if notification.status != "failed":
        raise HTTPException(400, "Can only retry failed notifications")
    
    # Check retry limit (max 3 retries)
    if notification.retry_count >= 3:
        raise HTTPException(400, "Maximum retry limit (3) reached")
    
    # Increment retry count
    notification.retry_count += 1
    notification.status = "pending"
    notification.error_message = None
    db.commit()
    
    # Prepare message based on notification type
    message = ""
    if notification.type == "sale":
        message = f"🎉 Nova Venda!\n\nCliente: {notification.client_name}\nValor: R$ {notification.value or notification.valor}\nNF: {notification.nf_number}"
    elif notification.type == "quote":
        message = f"📋 Nova Cotação!\n\nCliente: {notification.client_name}\nValor: R$ {notification.value or notification.valor}"
    elif notification.type == "payment":
        message = f"💰 Pagamento Recebido!\n\nCliente: {notification.client_name}\nValor: R$ {notification.value or notification.valor}"
    
    # Send via Evolution API
    try:
        if tenant.wa_instance_name:
            result = await send_whatsapp_message(
                phone=notification.client_phone or notification.telefone,
                message=message,
                instance=tenant.wa_instance_name
            )
            
            notification.status = "sent"
            notification.whatsapp_id = result.get("key", {}).get("id")
            notification.sent_at = datetime.now()
            db.commit()
            
            logger.info(f"Notification {notification_id} retried successfully for tenant {tenant_id}")
            
            return {
                "id": str(notification.id),
                "status": "sent",
                "whatsapp_id": notification.whatsapp_id,
                "retry_count": notification.retry_count,
                "sent_at": notification.sent_at.isoformat()
            }
        else:
            notification.status = "failed"
            notification.error_message = "WhatsApp instance not configured"
            db.commit()
            
            raise HTTPException(400, "WhatsApp instance not configured for this tenant")
            
    except Exception as e:
        notification.status = "failed"
        notification.error_message = str(e)
        db.commit()
        
        logger.error(f"Failed to retry notification {notification_id}: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send WhatsApp message: {str(e)}"
        )


# Template Management Endpoints
@app.post("/api/v1/28hub/{tenant_id}/templates", tags=["Templates"])
def create_template(
    tenant_id: str,
    template_data: dict,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """Create a new message template for a tenant"""
    template = Template(
        tenant_id=tenant_id,
        name=template_data.get("name"),
        type=template_data.get("type"),
        content=template_data.get("content"),
        is_active=template_data.get("is_active", True)
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    
    logger.info(f"Template created for tenant {tenant_id}: {template.name}")
    
    return {
        "id": str(template.id),
        "name": template.name,
        "type": template.type,
        "content": template.content,
        "is_active": template.is_active,
        "created_at": template.created_at.isoformat()
    }


@app.get("/api/v1/28hub/{tenant_id}/templates", tags=["Templates"])
def get_templates(
    tenant_id: str,
    template_type: Optional[str] = None,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """Get all templates for a tenant, optionally filtered by type"""
    query = select(Template).where(Template.tenant_id == tenant_id)
    
    if template_type:
        query = query.where(Template.type == template_type)
    
    templates = db.execute(
        query.order_by(Template.name)
    ).scalars().all()
    
    return [{
        "id": str(t.id),
        "name": t.name,
        "type": t.type,
        "content": t.content,
        "is_active": t.is_active,
        "created_at": t.created_at.isoformat(),
        "updated_at": t.updated_at.isoformat()
    } for t in templates]


@app.get("/api/v1/28hub/{tenant_id}/templates/{template_id}", tags=["Templates"])
def get_template(
    tenant_id: str,
    template_id: str,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """Get a specific template by ID"""
    template = db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.tenant_id == tenant_id
        )
    ).scalar_one_or_none()
    
    if not template:
        raise HTTPException(404, "Template not found")
    
    return {
        "id": str(template.id),
        "name": template.name,
        "type": template.type,
        "content": template.content,
        "is_active": template.is_active,
        "created_at": template.created_at.isoformat(),
        "updated_at": template.updated_at.isoformat()
    }


@app.put("/api/v1/28hub/{tenant_id}/templates/{template_id}", tags=["Templates"])
def update_template(
    tenant_id: str,
    template_id: str,
    template_data: dict,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """Update an existing template"""
    template = db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.tenant_id == tenant_id
        )
    ).scalar_one_or_none()
    
    if not template:
        raise HTTPException(404, "Template not found")
    
    if 'name' in template_data:
        template.name = template_data['name']
    if 'type' in template_data:
        template.type = template_data['type']
    if 'content' in template_data:
        template.content = template_data['content']
    if 'is_active' in template_data:
        template.is_active = template_data['is_active']
    
    db.commit()
    
    logger.info(f"Template updated for tenant {tenant_id}: {template.name}")
    
    return {
        "id": str(template.id),
        "name": template.name,
        "type": template.type,
        "content": template.content,
        "is_active": template.is_active,
        "updated_at": template.updated_at.isoformat()
    }


@app.delete("/api/v1/28hub/{tenant_id}/templates/{template_id}", tags=["Templates"])
def delete_template(
    tenant_id: str,
    template_id: str,
    tenant: Tenant = Depends(verify_tenant),
    db: Session = Depends(get_db)
):
    """Delete a template"""
    template = db.execute(
        select(Template).where(
            Template.id == template_id,
            Template.tenant_id == tenant_id
        )
    ).scalar_one_or_none()
    
    if not template:
        raise HTTPException(404, "Template not found")
    
    db.delete(template)
    db.commit()
    
    logger.info(f"Template deleted for tenant {tenant_id}: {template.name}")
    
    return {"message": "Template deleted successfully"}


# 11. Analytics endpoint
@app.get("/api/v1/admin/analytics", tags=["Admin"])
def admin_analytics(days: int = 30, db: Session = Depends(get_db)):
    """Returns analytics data for charts"""
    cutoff = datetime.now() - timedelta(days=days)
    
    # New tenants per day
    tenants_per_day = db.execute(
        select(func.date(Tenant.created_at), func.count(Tenant.id))
        .where(Tenant.created_at >= cutoff)
        .group_by(func.date(Tenant.created_at))
    ).all()
    
    # Notifications per day
    notifs_per_day = db.execute(
        select(func.date(Notification.created_at), func.count(Notification.id))
        .where(Notification.created_at >= cutoff)
        .group_by(func.date(Notification.created_at))
    ).all()
    
    return {
        "tenants_chart": [{"date": str(t[0]), "count": t[1]} for t in tenants_per_day],
        "notifications_chart": [{"date": str(n[0]), "count": n[1]} for n in notifs_per_day],
        "period_days": days
    }

# 12. Stripe webhook
@app.post("/api/v1/stripe/webhook", tags=["Billing"])
def stripe_webhook(data: dict, db: Session = Depends(get_db)):
    """Handles Stripe webhook events"""
    event_type = data.get('type')
    
    if event_type == 'customer.subscription.created':
        # Upgrade tenant
        sub = data.get('data', {}).get('object', {})
        customer_id = sub.get('customer')
        tenant = db.execute(
            select(Tenant).where(Tenant.stripe_customer_id == customer_id)
        ).scalar_one_or_none()
        
        if tenant:
            tenant.plan = 'pro'
            db.commit()
            
    elif event_type == 'customer.subscription.deleted':
        # Downgrade to trial
        sub = data.get('data', {}).get('object', {})
        customer_id = sub.get('customer')
        tenant = db.execute(
            select(Tenant).where(Tenant.stripe_customer_id == customer_id)
        ).scalar_one_or_none()
        
        if tenant:
            tenant.plan = 'trial'
            tenant.trial_ends = datetime.now() + timedelta(days=7)
            db.commit()
    
    return {"status": "processed"}

# EVOLUTION API PROXY ENDPOINTS
@app.post("/api/v1/28hub/{tenant_id}/message/sendText", tags=["Evolution API"])
def send_message_text(tenant_id: str, data: dict, db: Session = Depends(get_db)):
    """Proxy to Evolution API - send text message"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # TODO: Call Evolution API
    return {"status": "queued"}

@app.post("/api/v1/28hub/{tenant_id}/message/sendButtons", tags=["Evolution API"])
def send_message_buttons(tenant_id: str, data: dict, db: Session = Depends(get_db)):
    """Proxy to Evolution API - send button message"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # TODO: Call Evolution API
    return {"status": "queued"}

@app.post("/api/v1/28hub/{tenant_id}/message/sendList", tags=["Evolution API"])
def send_message_list(tenant_id: str, data: dict, db: Session = Depends(get_db)):
    """Proxy to Evolution API - send list message"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # TODO: Call Evolution API
    return {"status": "queued"}


# EVOAI INTEGRATION ENDPOINTS - Pro/Enterprise Only
@app.get("/api/v1/evoai/health", tags=["EvoAI"])
async def evoai_health():
    """
    Health check endpoint for EvoAI service

    Returns the health status of the EvoAI integration service.
    This endpoint is available for monitoring purposes.
    """
    healthy = await evoai.health_check()
    return {
        "healthy": healthy,
        "service": "evoai",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/v1/28hub/{tenant_id}/agents", tags=["EvoAI"])
async def create_agent(
    tenant_id: str,
    config: dict,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Create a new AI agent for a tenant

    This endpoint creates a new EvoAI agent for the tenant.
    Only available for Pro and Enterprise plans.

    - **tenant_id**: ID of the tenant
    - **config**: Agent configuration including name, model, instructions, temperature, client_id
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI agents require Pro or Enterprise plan"
        )

    # Create agent in EvoAI
    try:
        agent = await evoai.create_agent(tenant_id, config)

        # Store agent reference in tenant (using wa_instance_name field)
        # This field is available in the Tenant model
        tenant.wa_instance_name = agent.get("id")
        db.commit()

        logger.info(f"Created EvoAI agent {agent.get('id')} for tenant {tenant_id}")

        return {
            "agent_id": agent.get("id"),
            "name": agent.get("name"),
            "model": agent.get("model"),
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Failed to create EvoAI agent for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create AI agent: {str(e)}"
        )


@app.get("/api/v1/28hub/{tenant_id}/agents", tags=["EvoAI"])
async def get_agent(
    tenant_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Get the AI agent for a tenant

    Returns the EvoAI agent associated with the tenant.
    Only available for Pro and Enterprise plans.
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI agents require Pro or Enterprise plan"
        )

    # Get agent ID from tenant
    agent_id = tenant.wa_instance_name
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI agent found for this tenant"
        )

    try:
        agent = await evoai.get_agent(agent_id)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="AI agent not found"
            )

        return {
            "agent_id": agent.get("id"),
            "name": agent.get("name"),
            "model": agent.get("model"),
            "enabled": agent.get("enabled"),
            "created_at": agent.get("created_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get EvoAI agent for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get AI agent: {str(e)}"
        )


@app.put("/api/v1/28hub/{tenant_id}/agents", tags=["EvoAI"])
async def update_agent(
    tenant_id: str,
    updates: dict,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Update the AI agent for a tenant

    Updates the EvoAI agent configuration for the tenant.
    Only available for Pro and Enterprise plans.

    - **updates**: Fields to update (name, model, instructions, temperature, etc.)
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI agents require Pro or Enterprise plan"
        )

    # Get agent ID from tenant
    agent_id = tenant.wa_instance_name
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI agent found for this tenant"
        )

    try:
        agent = await evoai.update_agent(agent_id, updates)

        logger.info(f"Updated EvoAI agent {agent_id} for tenant {tenant_id}")

        return {
            "agent_id": agent.get("id"),
            "name": agent.get("name"),
            "status": "updated"
        }
    except Exception as e:
        logger.error(f"Failed to update EvoAI agent for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update AI agent: {str(e)}"
        )


@app.delete("/api/v1/28hub/{tenant_id}/agents", tags=["EvoAI"])
async def delete_agent(
    tenant_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Delete the AI agent for a tenant

    Deletes the EvoAI agent associated with the tenant.
    Only available for Pro and Enterprise plans.
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI agents require Pro or Enterprise plan"
        )

    # Get agent ID from tenant
    agent_id = tenant.wa_instance_name
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI agent found for this tenant"
        )

    try:
        await evoai.delete_agent(agent_id)

        # Clear agent reference from tenant
        tenant.wa_instance_name = None
        db.commit()

        logger.info(f"Deleted EvoAI agent {agent_id} for tenant {tenant_id}")

        return {"status": "deleted", "message": "AI agent deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete EvoAI agent for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete AI agent: {str(e)}"
        )


@app.post("/api/v1/28hub/{tenant_id}/chat", tags=["EvoAI"])
async def chat_message(
    tenant_id: str,
    message: dict,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Send a message to the AI agent

    Sends a message to the tenant's EvoAI agent and returns the response.
    Only available for Pro and Enterprise plans.

    - **message**: Message data containing:
        - text: The message text
        - session_id: Optional session identifier (defaults to tenant_id)
        - files: Optional list of files to send
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI chat requires Pro or Enterprise plan"
        )

    # Get agent ID from tenant
    agent_id = tenant.wa_instance_name
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI agent found for this tenant. Please create an agent first."
        )

    # Use provided session_id or default to tenant_id
    session_id = message.get("session_id", tenant_id)

    try:
        response = await evoai.send_message(
            agent_id=agent_id,
            external_id=session_id,
            message=message.get("text"),
            files=message.get("files")
        )

        logger.info(f"Chat message sent to EvoAI agent {agent_id} for tenant {tenant_id}")

        return {
            "response": response.get("response"),
            "status": response.get("status"),
            "timestamp": response.get("timestamp")
        }
    except Exception as e:
        logger.error(f"Failed to send chat message for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send chat message: {str(e)}"
        )


@app.get("/api/v1/28hub/{tenant_id}/chat/sessions", tags=["EvoAI"])
async def get_chat_sessions(
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Get chat sessions for the tenant's AI agent

    Returns a list of chat sessions for the tenant's EvoAI agent.
    Only available for Pro and Enterprise plans.

    - **skip**: Number of records to skip
    - **limit**: Maximum number of records to return
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI chat requires Pro or Enterprise plan"
        )

    # Get agent ID from tenant
    agent_id = tenant.wa_instance_name
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI agent found for this tenant"
        )

    try:
        sessions = await evoai.get_agent_sessions(agent_id, skip, limit)

        return {
            "agent_id": agent_id,
            "sessions": sessions,
            "total": len(sessions),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        logger.error(f"Failed to get chat sessions for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get chat sessions: {str(e)}"
        )


@app.get("/api/v1/28hub/{tenant_id}/chat/sessions/{session_id}/messages", tags=["EvoAI"])
async def get_session_messages(
    tenant_id: str,
    session_id: str,
    db: Session = Depends(get_db),
    tenant: Tenant = Depends(verify_tenant)
):
    """
    Get message history for a chat session

    Returns the message history for a specific chat session.
    Only available for Pro and Enterprise plans.

    - **session_id**: Session identifier
    """
    # Check if tenant has Pro or Enterprise plan
    if tenant.plan not in ["pro", "enterprise"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="AI chat requires Pro or Enterprise plan"
        )

    # Get agent ID from tenant
    agent_id = tenant.wa_instance_name
    if not agent_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No AI agent found for this tenant"
        )

    try:
        messages = await evoai.get_session_messages(session_id)

        return {
            "session_id": session_id,
            "messages": messages,
            "total": len(messages)
        }
    except Exception as e:
        logger.error(f"Failed to get session messages for tenant {tenant_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session messages: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
