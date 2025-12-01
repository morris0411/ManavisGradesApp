"""add is_admin to users

Revision ID: f7e8d9c0b1a2
Revises: 1e5322b98070
Create Date: 2025-01-15 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f7e8d9c0b1a2'
down_revision = '1e5322b98070'
branch_labels = None
depends_on = None


def upgrade():
    # 既存行にデフォルト値を設定してからNOT NULLに変更
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), nullable=True, server_default='false'))
    # サーバデフォルトで既存行が更新された後、NOT NULLへ
    op.alter_column('users', 'is_admin', nullable=False)
    # サーバデフォルトは不要なので外す
    op.alter_column('users', 'is_admin', server_default=None)


def downgrade():
    op.drop_column('users', 'is_admin')

