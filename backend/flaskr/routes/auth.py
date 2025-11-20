from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import check_password_hash, generate_password_hash
from .. import db
from ..models import Users

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    """ログインエンドポイント"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "リクエストボディが必要です"}), 400
    
    login_id = data.get("login_id")
    password = data.get("password")
    
    if not login_id or not password:
        return jsonify({"error": "login_idとpasswordが必要です"}), 400
    
    # ユーザーを検索
    user = Users.query.filter_by(login_id=login_id).first()
    
    if not user:
        return jsonify({"error": "ログインIDまたはパスワードが正しくありません"}), 401
    
    # パスワードを検証
    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "ログインIDまたはパスワードが正しくありません"}), 401
    
    # JWTトークンを生成
    access_token = create_access_token(identity=user.user_id)
    
    return jsonify({
        "access_token": access_token,
        "user_id": user.user_id,
        "login_id": user.login_id
    }), 200


@auth_bp.route("/auth/register", methods=["POST"])
def register():
    """ユーザー登録エンドポイント（必要に応じて使用）"""
    data = request.get_json()
    
    if not data:
        return jsonify({"error": "リクエストボディが必要です"}), 400
    
    login_id = data.get("login_id")
    password = data.get("password")
    
    if not login_id or not password:
        return jsonify({"error": "login_idとpasswordが必要です"}), 400
    
    # 既存ユーザーのチェック
    existing_user = Users.query.filter_by(login_id=login_id).first()
    if existing_user:
        return jsonify({"error": "このログインIDは既に使用されています"}), 400
    
    # パスワードをハッシュ化
    password_hash = generate_password_hash(password)
    
    # 新しいユーザーを作成
    new_user = Users(login_id=login_id, password_hash=password_hash)
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        "message": "ユーザーが正常に登録されました",
        "user_id": new_user.user_id,
        "login_id": new_user.login_id
    }), 201


@auth_bp.route("/auth/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """現在のユーザー情報を取得"""
    user_id = get_jwt_identity()
    user = Users.query.get(user_id)
    
    if not user:
        return jsonify({"error": "ユーザーが見つかりません"}), 404
    
    return jsonify({
        "user_id": user.user_id,
        "login_id": user.login_id
    }), 200


@auth_bp.route("/auth/verify", methods=["GET"])
@jwt_required()
def verify_token():
    """トークンの有効性を検証"""
    return jsonify({"valid": True}), 200

