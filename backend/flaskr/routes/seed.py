from flask import Blueprint, jsonify, request
from .. import db
from ..services import import_service

seed_bp = Blueprint("seed", __name__)

@seed_bp.route("/api/seed_exam_master", methods=["POST"])
def seed_exam_master():
    try:
        count = import_service.seed_exam_master_data()
        return jsonify({
            "seeded": True,
            "count": count
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@seed_bp.route("/api/seed_master", methods=["POST"])
def import_masters():
    # ファイルアップロードから取得
    file = request.files.get("subject_master")
    if not file:
        return jsonify({"error": "subject_master ファイルがありません"}), 400

    try:
        result = import_service.import_subject_master_from_csv(file)
        return jsonify({
            "imported": result,
            "status": "科目マスタ取り込みが完了しました（既存レコードはスキップ済み）"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
