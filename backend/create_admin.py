#!/usr/bin/env python
"""
CLIで管理者アカウントを作成するスクリプト

使用方法:
    python create_admin.py <login_id> <password>

例:
    python create_admin.py admin password123
"""
import sys
from flaskr import create_app, db
from flaskr.models import Users
from werkzeug.security import generate_password_hash

def create_admin(login_id, password):
    app = create_app()
    with app.app_context():
        # 既存ユーザーのチェック
        existing_user = Users.query.filter_by(login_id=login_id).first()
        if existing_user:
            # 既存ユーザーを管理者に変更
            existing_user.is_admin = True
            existing_user.password_hash = generate_password_hash(password)
            db.session.commit()
            print(f"既存ユーザー '{login_id}' を管理者に変更しました。")
            return True
        
        # パスワードをハッシュ化
        password_hash = generate_password_hash(password)
        
        # 新しい管理者ユーザーを作成
        new_user = Users(login_id=login_id, password_hash=password_hash, is_admin=True)
        db.session.add(new_user)
        db.session.commit()
        
        print(f"管理者ユーザー '{login_id}' が正常に作成されました。")
        return True

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("使用方法: python create_admin.py <login_id> <password>")
        print("例: python create_admin.py admin password123")
        sys.exit(1)
    
    login_id = sys.argv[1]
    password = sys.argv[2]
    
    if len(password) < 6:
        print("エラー: パスワードは6文字以上である必要があります。")
        sys.exit(1)
    
    if len(login_id) < 3:
        print("エラー: ログインIDは3文字以上である必要があります。")
        sys.exit(1)
    
    try:
        create_admin(login_id, password)
    except Exception as e:
        print(f"エラー: {str(e)}")
        sys.exit(1)

