from ..models import (
    Exams, ExamResults, Students,
    ExamJudgements, Departments, Faculties, Universities, ExamMaster
)
from .. import db
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, asc, desc

TOP_UNIVERSITY_IDS = [1, 2, 3, 4, 5, 6, 7, 9, 11, 14]

def list_years():
    rows = (
        db.session.query(Exams.exam_year)
        .distinct()
        .order_by(Exams.exam_year.desc())
        .all()
    )
    return [y for (y,) in rows]


def list_exam_types(year=None):
    q = db.session.query(Exams.exam_type).distinct()
    if year:
        q = q.filter(Exams.exam_year == year)
    rows = q.order_by(Exams.exam_type).all()
    return [t for (t,) in rows]


def list_exam_names(year=None, exam_type=None):
    q = (
        db.session.query(ExamMaster.exam_name)
        .join(Exams, Exams.exam_code == ExamMaster.exam_code)
    )
    if year:
        q = q.filter(Exams.exam_year == year)
    if exam_type:
        q = q.filter(Exams.exam_type == exam_type)
    rows = q.distinct().order_by(ExamMaster.exam_name).all()
    return [n for (n,) in rows]


def search_exams(year=None, exam_type=None, exam_name=None):
    query = (
        db.session.query(Exams, ExamMaster)
        .join(ExamMaster, ExamMaster.exam_code == Exams.exam_code)
    )

    if year:
        query = query.filter(Exams.exam_year == year)
    if exam_type:
        query = query.filter(Exams.exam_type == exam_type)
    if exam_name:
        query = query.filter(ExamMaster.exam_name == exam_name)

    exams = query.order_by(
        desc(Exams.exam_year),
        desc(ExamMaster.sort_key),
        asc(ExamMaster.exam_name),
        asc(Exams.exam_id),
    ).all()

    results = []
    for ex, em in exams:
        num_students = db.session.query(ExamResults).filter(ExamResults.exam_id == ex.exam_id).count()
        results.append({
            "exam_id": ex.exam_id,
            "exam_year": ex.exam_year,
            "exam_type": ex.exam_type,
            "exam_name": em.exam_name,
            "num_students": num_students,
            "link": f"/api/exams/{ex.exam_id}",
        })
    return results

def get_exam_results(exam_id):
    rows = (
        db.session.query(
            Students.student_id,
            Students.name,
            Students.school_name,
            ExamJudgements.preference_order,
            ExamJudgements.judgement_kyote,
            ExamJudgements.judgement_niji,
            ExamJudgements.judgement_sougou,
            Departments.department_name,
            Faculties.faculty_name,
            Universities.university_name
        )
        .join(ExamResults, ExamResults.student_id == Students.student_id)
        .join(ExamJudgements, ExamJudgements.result_id == ExamResults.result_id)
        .outerjoin(Departments, Departments.department_id == ExamJudgements.department_id)
        .outerjoin(Faculties, Faculties.faculty_id == Departments.faculty_id)
        .outerjoin(Universities, Universities.university_id == Faculties.university_id)
        .filter(ExamResults.exam_id == exam_id)
        .order_by(Students.student_id, ExamJudgements.preference_order)
        .all()
    )
    return _format_exam_results(rows)

def list_top_universities():
    """難関10大学の一覧を取得"""
    universities = (
        db.session.query(Universities.university_id, Universities.university_name)
        .filter(Universities.university_id.in_(TOP_UNIVERSITY_IDS))
        .order_by(Universities.university_id)
        .all()
    )
    return [{"university_id": u.university_id, "university_name": u.university_name} for u in universities]


def filter_exam_results(exam_id, name=None, university=None, university_id=None, faculty=None, order_min=None, order_max=None, include_top_universities=False):
    query = (
        db.session.query(
            Students.student_id,
            Students.name,
            Students.school_name,
            ExamJudgements.preference_order,
            ExamJudgements.judgement_kyote,
            ExamJudgements.judgement_niji,
            ExamJudgements.judgement_sougou,
            Departments.department_name,
            Faculties.faculty_name,
            Universities.university_name,
            Universities.university_id
        )
        .join(ExamResults, ExamResults.student_id == Students.student_id)
        .join(ExamJudgements, ExamJudgements.result_id == ExamResults.result_id)
        .outerjoin(Departments, Departments.department_id == ExamJudgements.department_id)
        .outerjoin(Faculties, Faculties.faculty_id == Departments.faculty_id)
        .outerjoin(Universities, Universities.university_id == Faculties.university_id)
        .filter(ExamResults.exam_id == exam_id)
    )

    if name:
        query = query.filter(Students.name.ilike(f"%{name}%"))
    if include_top_universities:
        query = query.filter(Universities.university_id.in_(TOP_UNIVERSITY_IDS))
    elif university_id:
        # プルダウンから選択した場合はuniversity_idで完全一致
        query = query.filter(Universities.university_id == university_id)
    elif university:
        # テキスト入力の場合はuniversity_nameで部分一致
        query = query.filter(Universities.university_name.ilike(f"%{university}%"))
    if faculty:
        query = query.filter(Faculties.faculty_name.ilike(f"%{faculty}%"))
    if order_min and order_max:
        query = query.filter(ExamJudgements.preference_order.between(order_min, order_max))

    rows = query.order_by(Students.student_id, ExamJudgements.preference_order).all()
    return _format_exam_results(rows)


# 共通整形関数
def _format_exam_results(rows):
    grouped = {}
    max_order = 0
    
    for r in rows:
        sid = r.student_id
        if r.preference_order and r.preference_order > max_order:
            max_order = r.preference_order
        
        if sid not in grouped:
            grouped[sid] = {
                "student_id": sid,
                "name": r.name,
                "school_name": r.school_name,
                "志望": {}
            }

        uni = (r.university_name or "").strip()
        fac = (r.faculty_name or "").strip()
        dep = (r.department_name or "").strip()
        jk = (r.judgement_kyote or "").strip()
        jn = (r.judgement_niji or "").strip()
        js = (r.judgement_sougou or "").strip()
        # 判定は存在するものだけ括弧内に並べる
        judgements = " / ".join([x for x in [jk, jn, js] if x])
        judgements_part = f" ({judgements})" if judgements else ""
        name_part = " ".join([x for x in [uni, fac, dep] if x]).strip()
        if r.preference_order:
            grouped[sid]["志望"][r.preference_order] = f"{name_part}{judgements_part}"

    # 最大順位まで列を生成（最低でも5まで、最大順位が5より大きい場合はそれまで）
    max_cols = max(max_order, 5) if max_order > 0 else 5
    
    result = []
    for s in grouped.values():
        row = {
            "student_id": s["student_id"],
            "name": s["name"],
            "school_name": s["school_name"]
        }
        for i in range(1, max_cols + 1):
            row[f"第{i}志望"] = s["志望"].get(i, "")
        result.append(row)

    return result
