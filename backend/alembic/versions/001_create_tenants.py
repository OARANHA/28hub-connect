"""create tenants table

Revision ID: 001
Revises: 
Create Date: 2025-12-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '001_create_tenants'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'tenants',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('wa_number', sa.String(20), unique=True),
        sa.Column('wa_instance', sa.String(100)),
        sa.Column('wa_status', sa.String(50), default='disconnected'),
        sa.Column('plan', sa.String(50), default='trial'),
        sa.Column('trial_ends', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW() + INTERVAL \'7 days\'')),
        sa.Column('api_key', sa.String(32), unique=True, default=lambda: uuid.uuid4().hex),
        sa.Column('status', sa.String(50), default='active'),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()')),
    )

def downgrade():
    op.drop_table('tenants')
