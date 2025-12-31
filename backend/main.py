from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://28hub:28hub_password@db:5432/28hub_db")

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
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="notifications")


# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic Models
class TenantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str


class TenantResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
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
    """
    # Check if email already exists
    existing_tenant = db.query(Tenant).filter(Tenant.email == tenant.email).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new tenant
    new_tenant = Tenant(
        name=tenant.name,
        email=tenant.email,
        phone=tenant.phone
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
    
    # TODO: Send WhatsApp notification here
    # TODO: Process with AI if needed
    
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
