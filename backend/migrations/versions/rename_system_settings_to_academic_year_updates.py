"""rename system_settings to academic_year_updates

Revision ID: g8f9e0d1c2b3
Revises: f7e8d9c0b1a2
Create Date: 2025-01-15 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision = 'g8f9e0d1c2b3'
down_revision = 'f7e8d9c0b1a2'
branch_labels = None
depends_on = None


def upgrade():
    # 新しいテーブルを作成
    op.create_table('academic_year_updates',
        sa.Column('academic_year', sa.Integer(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('academic_year')
    )
    
    # 既存のsystem_settingsからデータを移行
    # last_academic_year_updateの値を年度に変換して新テーブルに挿入
    conn = op.get_bind()
    
    # system_settingsテーブルが存在するか確認
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'system_settings'
        )
    """))
    table_exists = result.scalar()
    
    if table_exists:
        # last_academic_year_updateのレコードを取得
        result = conn.execute(text("""
            SELECT setting_value 
            FROM system_settings 
            WHERE setting_key = 'last_academic_year_update'
        """))
        row = result.fetchone()
        
        if row and row[0]:
            try:
                # ISO形式の日時文字列から年度を抽出
                from datetime import datetime
                last_update_datetime = datetime.fromisoformat(row[0])
                
                # 4月1日を基準に年度を計算
                if last_update_datetime.month >= 4:
                    academic_year = last_update_datetime.year
                else:
                    academic_year = last_update_datetime.year - 1
                
                # 新テーブルに挿入
                conn.execute(text("""
                    INSERT INTO academic_year_updates (academic_year, updated_at)
                    VALUES (:academic_year, :updated_at)
                """), {
                    'academic_year': academic_year,
                    'updated_at': last_update_datetime
                })
            except Exception as e:
                # データ変換に失敗した場合はスキップ
                print(f"Warning: Failed to migrate data: {e}")
    
    # 古いテーブルを削除
    if table_exists:
        op.drop_table('system_settings')


def downgrade():
    # system_settingsテーブルを再作成
    op.create_table('system_settings',
        sa.Column('setting_key', sa.String(), nullable=False),
        sa.Column('setting_value', sa.String(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('setting_key')
    )
    
    # academic_year_updatesからデータを移行
    conn = op.get_bind()
    
    # academic_year_updatesテーブルが存在するか確認
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'academic_year_updates'
        )
    """))
    table_exists = result.scalar()
    
    if table_exists:
        # 最新の更新年度を取得
        result = conn.execute(text("""
            SELECT academic_year, updated_at 
            FROM academic_year_updates 
            ORDER BY academic_year DESC 
            LIMIT 1
        """))
        row = result.fetchone()
        
        if row:
            academic_year, updated_at = row
            # system_settingsに挿入
            conn.execute(text("""
                INSERT INTO system_settings (setting_key, setting_value, updated_at)
                VALUES ('last_academic_year_update', :setting_value, :updated_at)
            """), {
                'setting_value': updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at),
                'updated_at': updated_at
            })
    
    # academic_year_updatesテーブルを削除
    if table_exists:
        op.drop_table('academic_year_updates')

