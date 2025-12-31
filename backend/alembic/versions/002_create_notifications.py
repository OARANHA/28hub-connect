"""create notifications table

Revision ID: 002
Revises: 001_create_tenants
Create Date: 2025-12-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '002_create_notifications'
down_revision = '001_create_tenants'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'notifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE')),
        sa.Column('type', sa.String(50)),  # sale|quote|payment
        sa.Column('client_name', sa.String(255)),
        sa.Column('telefone', sa.String(20)),
        sa.Column('valor', sa.Numeric(10, 2)),
        sa.Column('nf_number', sa.String(100)),
        sa.Column('status', sa.String(50), default='pending'),  # pending|sent|failed
        sa.Column('whatsapp_message_id', sa.String(100)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()')),
    )

def downgrade():
    op.drop_table('notifications')
