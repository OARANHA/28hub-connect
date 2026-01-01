from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from uuid import uuid4

# Import Base from database module to avoid circular imports
from database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    name = Column(String, nullable=False)
    wa_number = Column(String, nullable=False)  # WhatsApp number
    plan = Column(String, default="trial")  # trial|basic|pro|enterprise
    trial_ends = Column(DateTime, default=lambda: datetime.now() + timedelta(days=7))
    api_key = Column(String, unique=True, default=lambda: str(uuid4())[:16])
    status = Column(String, default="active")  # active|suspended
    wa_instance_name = Column(String)  # WhatsApp instance name
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    # Additional fields for billing and integration
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    wa_status = Column(String, nullable=True)  # connected|disconnected|qr_pending
    wa_qr_code = Column(Text, nullable=True)
    stripe_customer_id = Column(String, nullable=True)

    notifications = relationship("Notification", back_populates="tenant", cascade="all, delete-orphan")
    templates = relationship("Template", back_populates="tenant", cascade="all, delete-orphan")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    type = Column(String, nullable=False)  # sale|quote|payment
    client_name = Column(String)
    client_phone = Column(String)
    value = Column(Float)
    nf_number = Column(String)  # Nota Fiscal
    status = Column(String, default="pending")  # pending|sent|failed
    whatsapp_id = Column(String)  # ID da mensagem WhatsApp
    products = Column(JSON)  # Products list as JSON
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    sent_at = Column(DateTime)

    # Additional fields for compatibility
    telefone = Column(String)  # Legacy field for backward compatibility
    valor = Column(Float)  # Legacy field for backward compatibility
    event_type = Column(String)  # Legacy field for backward compatibility
    message = Column(Text)  # Legacy field for backward compatibility
    whatsapp_message_id = Column(String)  # Legacy field for backward compatibility

    tenant = relationship("Tenant", back_populates="notifications")


class Template(Base):
    __tablename__ = "templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # sale|quote|payment
    content = Column(String, nullable=False)  # Template mensagem
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    tenant = relationship("Tenant", back_populates="templates")
