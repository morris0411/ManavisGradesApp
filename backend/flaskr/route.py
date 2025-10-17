from flask import Blueprint, jsonify, request
from .services import search_students

bp = Blueprint("api", __name__)

@bp.route("/api/search")
def search():
    keyword = request.args.get("keyword", "")
    results = search_students(keyword)
    return jsonify(results)
