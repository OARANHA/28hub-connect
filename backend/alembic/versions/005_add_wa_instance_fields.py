"""add wa instance fields

Revision ID: 005
Revises: 004_indexes_performance
Create Date: 2025-12-31
"""
from alembic import op
import sqlalchemy as sa

revision = '005_add_wa_instance_fields'
down_revision = '004_indexes_performance'
branch_labels = None
depends_on = None

def upgrade():
    # Add webhook URL for Evolution API
    op.add_column('tenants', sa.Column('wa_webhook_url', sa.String(500)))
    op.add_column('tenants', sa.Column('wa_qr_code', sa.Text()))

def downgrade():
    op.drop_column('tenants', 'wa_qr_code')
    op.drop_column('tenants', 'wa_webhook_url')
