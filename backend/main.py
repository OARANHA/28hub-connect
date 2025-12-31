from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Numeric, select, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
import httpx
import json
import secrets
import uuid

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:28hub2025@postgres:5432/28hub")

# Evolution API configuration
EVOLUTION_URL = os.getenv("EVOLUTION_URL", "http://28hub-evolution:8080")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY", "28hub-secret-2025")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Database Models
class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(50), nullable=True)
    whatsapp_instance = Column(String(100), nullable=True)
    plan = Column(String(50), default="trial")
    wa_number = Column(String(50), nullable=True)
    status = Column(String(50), default="active")
    trial_ends = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    api_key = Column(String(64), nullable=True)
    wa_instance = Column(String(100), nullable=True)
    wa_status = Column(String(50), nullable=True)
    wa_qr_code = Column(Text, nullable=True)
    stripe_customer_id = Column(String(255), nullable=True)

    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    type = Column(String(100), nullable=True)
    client_name = Column(String(255), nullable=True)
    telefone = Column(String(50), nullable=True)
    valor = Column(Numeric(10, 2), nullable=True)
    nf_number = Column(String(100), nullable=True)
    event_type = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(50), default="pending")
    whatsapp_message_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="notifications")


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
def erp_webhook(tenant_id: str, data: dict, db: Session = Depends(get_db)):
    """Receives ERP webhook and creates notification"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # Create notification
    notification = Notification(
        tenant_id=tenant.id,
        type=data.get('type', 'sale'),
        client_name=data.get('client_name'),
        telefone=data.get('telefone'),
        valor=data.get('valor'),
        nf_number=data.get('nf_number'),
        status='pending'
    )
    db.add(notification)
    db.commit()
    
    # TODO: Send WhatsApp message via Evolution API
    
    return {"status": "pending", "notification_id": str(notification.id)}


# 4. Get tenant dashboard
@app.get("/api/v1/28hub/{tenant_id}/dashboard", tags=["Dashboard"])
def tenant_dashboard(tenant_id: str, db: Session = Depends(get_db)):
    """Returns executive dashboard cards"""
    tenant = db.execute(select(Tenant).where(Tenant.id == tenant_id)).scalar_one_or_none()
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado")
    
    # Get notification stats
    total_pending = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.status == 'pending'
        )
    ).scalar() or 0
    
    total_today = db.execute(
        select(func.count(Notification.id)).where(
            Notification.tenant_id == tenant_id,
            Notification.created_at >= datetime.now().date()
        )
    ).scalar() or 0
    
    # Calculate MRR contribution
    mrr = 0
    if tenant.plan == 'pro':
        mrr = 97
    elif tenant.plan == 'enterprise':
        mrr = 497
    
    return {
        "tenant_name": tenant.name,
        "plan": tenant.plan,
        "mrr": f"R$ {mrr}",
        "pending_notifications": total_pending,
        "today_notifications": total_today,
        "whatsapp_status": tenant.wa_status,
        "trial_ends": tenant.trial_ends.isoformat() if tenant.trial_ends else None
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
