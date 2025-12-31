from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os
import httpx
import json

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

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    phone = Column(String(50), nullable=False)
    whatsapp_instance = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    event_type = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
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


# Tenant registration endpoint
@app.post("/api/v1/28hub/register", response_model=TenantResponse, status_code=status.HTTP_201_CREATED, tags=["Tenants"])
async def register_tenant(tenant: TenantCreate, db: Session = Depends(get_db)):
    """
    Register a new tenant/organization
    
    - **name**: Organization name
    - **email**: Contact email (must be unique)
    - **phone**: Contact phone number
    - **whatsapp_instance**: Optional WhatsApp instance name
    """
    # Check if email already exists
    existing_tenant = db.query(Tenant).filter(Tenant.email == tenant.email).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create WhatsApp instance if provided
    instance_name = tenant.whatsapp_instance or f"tenant_{tenant.email.replace('@', '_').replace('.', '_')}"
    
    try:
        # Try to create the instance
        await create_whatsapp_instance(instance_name)
    except HTTPException:
        # Instance might already exist, try to connect
        pass
    
    # Create new tenant
    new_tenant = Tenant(
        name=tenant.name,
        email=tenant.email,
        phone=tenant.phone,
        whatsapp_instance=instance_name
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    
    return new_tenant


# ERP webhook endpoint
@app.post("/api/v1/28hub/{tenant_id}/webhook/erp", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED, tags=["Webhooks"])
async def erp_webhook(tenant_id: int, notification: NotificationCreate, db: Session = Depends(get_db)):
    """
    Receive ERP events and create notifications
    
    - **tenant_id**: ID of the tenant
    - **event_type**: Type of ERP event (e.g., order_created, payment_received)
    - **message**: Notification message content
    """
    # Verify tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Create notification
    new_notification = Notification(
        tenant_id=tenant_id,
        event_type=notification.event_type,
        message=notification.message,
        status="pending"
    )
    db.add(new_notification)
    db.commit()
    db.refresh(new_notification)
    
    # Send WhatsApp notification
    if tenant.whatsapp_instance and tenant.phone:
        try:
            result = await send_whatsapp_message(
                phone=tenant.phone,
                message=notification.message,
                instance=tenant.whatsapp_instance
            )
            
            # Update notification status
            new_notification.status = "delivered"
            new_notification.whatsapp_message_id = result.get("key", {}).get("id")
            db.commit()
            db.refresh(new_notification)
        except HTTPException as e:
            # Mark as failed but don't fail the entire request
            new_notification.status = "failed"
            db.commit()
            db.refresh(new_notification)
    
    return new_notification


# Dashboard endpoint
@app.get("/api/v1/28hub/{tenant_id}/dashboard", response_model=DashboardResponse, tags=["Dashboard"])
async def get_dashboard(tenant_id: int, db: Session = Depends(get_db)):
    """
    Get dashboard data for a tenant including notifications and statistics
    
    - **tenant_id**: ID of the tenant
    """
    # Get tenant
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get notifications
    notifications = db.query(Notification).filter(Notification.tenant_id == tenant_id).order_by(Notification.created_at.desc()).all()
    
    # Calculate statistics
    total_notifications = len(notifications)
    pending_notifications = len([n for n in notifications if n.status == "pending"])
    delivered_notifications = len([n for n in notifications if n.status == "delivered"])
    
    return DashboardResponse(
        tenant=tenant,
        notifications=notifications,
        total_notifications=total_notifications,
        pending_notifications=pending_notifications,
        delivered_notifications=delivered_notifications
    )


# WhatsApp instance management endpoints
@app.post("/api/v1/28hub/{tenant_id}/whatsapp/connect", tags=["WhatsApp"])
async def connect_whatsapp(tenant_id: int, db: Session = Depends(get_db)):
    """
    Connect/Reconnect WhatsApp instance for a tenant
    
    - **tenant_id**: ID of the tenant
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if not tenant.whatsapp_instance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No WhatsApp instance configured for this tenant"
        )
    
    result = await connect_whatsapp_instance(tenant.whatsapp_instance)
    return {
        "status": "success",
        "instance": tenant.whatsapp_instance,
        "qr_code": result.get("qrcode"),
        "message": "WhatsApp connection initiated. Scan the QR code to connect."
    }


@app.post("/api/v1/28hub/{tenant_id}/whatsapp/send", tags=["WhatsApp"])
async def send_message(tenant_id: int, message_data: dict, db: Session = Depends(get_db)):
    """
    Send a custom WhatsApp message for a tenant
    
    - **tenant_id**: ID of the tenant
    - **message**: Message content to send
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    if not tenant.whatsapp_instance or not tenant.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="WhatsApp not configured for this tenant"
        )
    
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
