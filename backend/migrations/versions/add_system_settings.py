"""add system_settings

Revision ID: a1b2c3d4e5f6
Revises: c79db3b92a4f
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'c79db3b92a4f'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('system_settings',
        sa.Column('setting_key', sa.String(), nullable=False),
        sa.Column('setting_value', sa.String(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('setting_key')
    )


def downgrade():
    op.drop_table('system_settings')

