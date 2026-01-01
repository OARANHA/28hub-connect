"""add missing notification fields

Revision ID: 006_add_missing_notification_fields
Revises: 005_add_wa_instance_fields
Create Date: 2025-12-31
"""
from alembic import op
import sqlalchemy as sa

revision = '006_add_missing_notification_fields'
down_revision = '005_add_wa_instance_fields'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('notifications', sa.Column('client_phone', sa.String(255), nullable=True))
    op.add_column('notifications', sa.Column('value', sa.Numeric(10, 2), nullable=True))
    op.add_column('notifications', sa.Column('retry_count', sa.Integer(), server_default='0', nullable=False))
    op.add_column('notifications', sa.Column('error_message', sa.Text(), nullable=True))
    op.add_column('notifications', sa.Column('whatsapp_id', sa.String(255), nullable=True))
    op.add_column('notifications', sa.Column('products', sa.JSON(), nullable=True))
    op.add_column('notifications', sa.Column('sent_at', sa.DateTime(), nullable=True))

def downgrade():
    op.drop_column('notifications', 'sent_at')
    op.drop_column('notifications', 'products')
    op.drop_column('notifications', 'whatsapp_id')
    op.drop_column('notifications', 'error_message')
    op.drop_column('notifications', 'retry_count')
    op.drop_column('notifications', 'value')
    op.drop_column('notifications', 'client_phone')
