# backend/routes/students.py
from flask import Blueprint, request, jsonify
from ..services.students_service import search_students, get_student_detail


students_bp = Blueprint("students", __name__)

# ------------------------
# 生徒検索（名前・高校名・マナビス生番号で部分一致）
# ------------------------
@students_bp.route("/students/search", methods=["GET"])
def search_students_api():
    keyword = request.args.get("q", "")
    # 複数指定可能: /students/search?status=在籍&status=既卒
    # axios の配列は status[]=... になる場合があるため双方対応
    statuses = request.args.getlist("status") or request.args.getlist("status[]") or None
    results = search_students(keyword, statuses)
    return jsonify(results)

# ------------------------
# 生徒詳細情報
# ------------------------
@students_bp.route("/students/<int:student_id>", methods=["GET"])
def student_detail_api(student_id):
    detail = get_student_detail(student_id)
    if not detail:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(detail)