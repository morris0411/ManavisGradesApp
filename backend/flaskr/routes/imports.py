from flask import Blueprint, request, jsonify
from ..services import import_service, academic_year_service
from .. import db

imports_bp = Blueprint("imports", __name__)

@imports_bp.route("/imports/students", methods=["POST"])
def import_students():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file がありません"}), 400

    try:
        result = import_service.import_students_from_csv(file)
        return jsonify({
            "ok": True,
            **result,
            "marked_resigned": True,
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@imports_bp.route("/imports/exams_xlsx", methods=["POST"])
def import_exams_xlsx():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file がありません"}), 400
    try:
        result = import_service.import_exams_from_xlsx(file)
        return jsonify({
            "ok": True,
            **result
        })
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@imports_bp.route("/imports/academic_year_status", methods=["GET"])
def academic_year_status():
    """
    年度更新の実行可否と状態を取得
    """
    try:
        current_year = academic_year_service.get_academic_year()
        last_update_year = academic_year_service.get_last_update_year()
        
        # 最終更新日時の取得（表示用）
        from ..models import SystemSettings
        from datetime import datetime
        setting = SystemSettings.query.filter_by(setting_key='last_academic_year_update').first()
        last_update_datetime = None
        if setting:
            try:
                last_update_datetime = datetime.fromisoformat(setting.setting_value).isoformat()
            except:
                pass
        
        can_update, error_message = academic_year_service.can_update_academic_year()
        
        return jsonify({
            "current_academic_year": current_year,
            "last_update_year": last_update_year,
            "can_update": can_update,
            "error_message": error_message,
            "last_update_datetime": last_update_datetime
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@imports_bp.route("/imports/update_academic_year", methods=["POST"])
def update_academic_year():
    """
    年度更新処理
    """
    try:
        result = academic_year_service.execute_academic_year_update()
        return jsonify({
            "ok": True,
            **result,
            "message": f"{result['updated']}名の学年を更新しました（うち{result['graduated']}名を既卒に変更）"
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

