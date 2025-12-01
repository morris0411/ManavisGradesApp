from flask import Blueprint, jsonify, request
from .. import db
from ..services import import_service

seed_bp = Blueprint("seed", __name__)

@seed_bp.route("/seed_exam_master", methods=["POST"])
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

@seed_bp.route("/seed_subject_master", methods=["POST"])
def seed_subject_master():
    try:
        result = import_service.seed_subject_master_data()
        return jsonify({
            "seeded": True,
            "count": result
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500 
