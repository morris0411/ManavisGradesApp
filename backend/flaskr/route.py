from flask import Blueprint, jsonify, request
from .services import search_students
from . import db
from .models import Student
from sqlalchemy import text

bp = Blueprint("api", __name__)

@bp.route("/api/search")
def search():
    keyword = request.args.get("keyword", "")
    results = search_students(keyword)
    return jsonify(results)


@bp.route("/api/health")
def health():
    # 簡易ヘルスチェック（DB接続確認）
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "ng", "error": str(e)}), 500


@bp.route("/api/seed", methods=["POST"]) 
def seed():
    # 初期データを投入（重複を避けるため存在チェック）
    if Student.query.count() == 0:
        samples = [
            Student(name="田中太郎", subject="数学", score=85),
            Student(name="佐藤花子", subject="英語", score=92),
            Student(name="鈴木一郎", subject="理科", score=78),
        ]
        db.session.add_all(samples)
        db.session.commit()
    return jsonify({"seeded": True, "count": Student.query.count()})
