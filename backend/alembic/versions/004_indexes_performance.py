"""create performance indexes

Revision ID: 004
Revises: 003_create_billing
Create Date: 2025-12-31
"""
from alembic import op

revision = '004_indexes_performance'
down_revision = '003_create_billing'
branch_labels = None
depends_on = None

def upgrade():
    # Indexes for notifications table
    op.create_index('idx_notifications_tenant_status', 'notifications', ['tenant_id', 'status'])
    op.create_index('idx_notifications_created', 'notifications', ['created_at'])
    
    # Index for tenants table
    op.create_index('idx_tenants_plan_status', 'tenants', ['plan', 'status'])

def downgrade():
    op.drop_index('idx_tenants_plan_status', 'tenants')
    op.drop_index('idx_notifications_created', 'notifications')
    op.drop_index('idx_notifications_tenant_status', 'notifications')
