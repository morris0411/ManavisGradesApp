from flask import Blueprint, jsonify, request
from ..services.exam_service import (
    list_years, list_exam_types, list_exam_names,
    search_exams, get_exam_results, filter_exam_results,
    list_top_universities,
)

exams_bp = Blueprint("exams", __name__)

@exams_bp.route("/exams/years", methods=["GET"])
def years_route():
    return jsonify(list_years())


@exams_bp.route("/exams/types", methods=["GET"])
def types_route():
    year = request.args.get("year", type=int)
    return jsonify(list_exam_types(year))


@exams_bp.route("/exams/names", methods=["GET"])
def names_route():
    year = request.args.get("year", type=int)
    exam_type = request.args.get("exam_type")
    return jsonify(list_exam_names(year, exam_type))


@exams_bp.route("/exams/search", methods=["GET"])
def search_exams_route():
    year = request.args.get("year", type=int)
    exam_type = request.args.get("exam_type")
    exam_name = request.args.get("name")
    return jsonify(search_exams(year, exam_type, exam_name))

@exams_bp.route("/exams/<int:exam_id>", methods=["GET"])
def get_exam_results_route(exam_id):
    return jsonify(get_exam_results(exam_id))

@exams_bp.route("/exams/universities/top", methods=["GET"])
def top_universities_route():
    return jsonify(list_top_universities())

@exams_bp.route("/exams/filter", methods=["GET"])
def filter_exam_results_route():
    exam_id = request.args.get("exam_id", type=int)
    name = request.args.get("name")
    university = request.args.get("university")
    university_id = request.args.get("university_id", type=int)
    faculty = request.args.get("faculty")
    order_min = request.args.get("order_min", type=int)
    order_max = request.args.get("order_max", type=int)
    include_top = request.args.get("include_top_universities", default="false")
    include_top = str(include_top).lower() in ("1", "true", "yes")
    return jsonify(filter_exam_results(exam_id, name, university, university_id, faculty, order_min, order_max, include_top))
