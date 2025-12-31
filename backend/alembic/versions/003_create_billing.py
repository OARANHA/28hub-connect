"""create billing table

Revision ID: 003
Revises: 002_create_notifications
Create Date: 2025-12-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '003_create_billing'
down_revision = '002_create_notifications'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'billing',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE')),
        sa.Column('stripe_customer_id', sa.String(100)),
        sa.Column('stripe_subscription_id', sa.String(100)),
        sa.Column('plan', sa.String(50)),
        sa.Column('amount', sa.Numeric(10, 2)),
        sa.Column('status', sa.String(50)),
        sa.Column('period_start', sa.TIMESTAMP(timezone=True)),
        sa.Column('period_end', sa.TIMESTAMP(timezone=True)),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('NOW()')),
    )

def downgrade():
    op.drop_table('billing')
