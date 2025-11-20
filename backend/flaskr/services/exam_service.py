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
    # 模試タイプを取得
    exam = db.session.query(Exams).filter(Exams.exam_id == exam_id).first()
    exam_type = exam.exam_type if exam else None
    
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

    # 検索条件に合致する大学が指定されているかどうかを判定
    has_university_filter = include_top_universities or university_id or university
    
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

    # 検索条件に合致する大学が指定されている場合、その大学の志望度順にソート
    if has_university_filter:
        # 各生徒の検索条件に合致する大学の最小志望順位を計算してソート
        from sqlalchemy import func, case
        
        # サブクエリ用のクエリを作成（フィルタ条件は同じ）
        subquery_base = (
            db.session.query(
                Students.student_id,
                ExamJudgements.preference_order
            )
            .join(ExamResults, ExamResults.student_id == Students.student_id)
            .join(ExamJudgements, ExamJudgements.result_id == ExamResults.result_id)
            .outerjoin(Departments, Departments.department_id == ExamJudgements.department_id)
            .outerjoin(Faculties, Faculties.faculty_id == Departments.faculty_id)
            .outerjoin(Universities, Universities.university_id == Faculties.university_id)
            .filter(ExamResults.exam_id == exam_id)
        )
        
        # メインクエリと同じフィルタ条件を適用
        if name:
            subquery_base = subquery_base.filter(Students.name.ilike(f"%{name}%"))
        if include_top_universities:
            subquery_base = subquery_base.filter(Universities.university_id.in_(TOP_UNIVERSITY_IDS))
        elif university_id:
            subquery_base = subquery_base.filter(Universities.university_id == university_id)
        elif university:
            subquery_base = subquery_base.filter(Universities.university_name.ilike(f"%{university}%"))
        if faculty:
            subquery_base = subquery_base.filter(Faculties.faculty_name.ilike(f"%{faculty}%"))
        if order_min and order_max:
            subquery_base = subquery_base.filter(ExamJudgements.preference_order.between(order_min, order_max))
        
        # 判定の優先順位を数値化（A=1, B=2, C=3, D=4, E=5, その他=6）
        def judgment_priority(judgment):
            if not judgment:
                return 6
            judgment_upper = str(judgment).strip().upper()
            if judgment_upper == "A":
                return 1
            elif judgment_upper == "B":
                return 2
            elif judgment_upper == "C":
                return 3
            elif judgment_upper == "D":
                return 4
            elif judgment_upper == "E":
                return 5
            else:
                return 6
        
        # 各生徒の最小志望順位と、その志望順位での最良判定を計算
        min_pref_order = func.min(
            case(
                (ExamJudgements.preference_order.isnot(None), ExamJudgements.preference_order),
                else_=9999
            )
        ).label('min_pref_order')
        
        # 判定の優先順位を数値化
        # 模試タイプが「共テ」の場合はjudgement_kyoteを優先、なければjudgement_niji
        # それ以外の場合はjudgement_niji優先
        if exam_type == "共テ":
            judgment_value = case(
                (ExamJudgements.judgement_kyote.isnot(None),
                 case(
                     (ExamJudgements.judgement_kyote == "A", 1),
                     (ExamJudgements.judgement_kyote == "B", 2),
                     (ExamJudgements.judgement_kyote == "C", 3),
                     (ExamJudgements.judgement_kyote == "D", 4),
                     (ExamJudgements.judgement_kyote == "E", 5),
                     else_=6
                 )),
                (ExamJudgements.judgement_niji.isnot(None),
                 case(
                     (ExamJudgements.judgement_niji == "A", 1),
                     (ExamJudgements.judgement_niji == "B", 2),
                     (ExamJudgements.judgement_niji == "C", 3),
                     (ExamJudgements.judgement_niji == "D", 4),
                     (ExamJudgements.judgement_niji == "E", 5),
                     else_=6
                 )),
                else_=6
            )
        else:
            # それ以外の場合はjudgement_niji優先
            judgment_value = case(
                (ExamJudgements.judgement_niji.isnot(None),
                 case(
                     (ExamJudgements.judgement_niji == "A", 1),
                     (ExamJudgements.judgement_niji == "B", 2),
                     (ExamJudgements.judgement_niji == "C", 3),
                     (ExamJudgements.judgement_niji == "D", 4),
                     (ExamJudgements.judgement_niji == "E", 5),
                     else_=6
                 )),
                else_=6
            )
        
        # まず最小志望順位を取得するサブクエリ
        min_order_subquery = (
            subquery_base.with_entities(
                Students.student_id, 
                min_pref_order
            )
            .group_by(Students.student_id)
            .subquery()
        )
        
        # 次に、最小志望順位での判定を取得するサブクエリ
        # 判定の優先順位を数値化
        # 模試タイプが「共テ」の場合はjudgement_kyoteを優先、なければjudgement_niji
        # それ以外の場合はjudgement_niji優先
        # A=1, B=2, C=3, D=4, E=5, その他=6
        if exam_type == "共テ":
            judgment_value_for_subquery = case(
                (ExamJudgements.judgement_kyote.isnot(None),
                 case(
                     (ExamJudgements.judgement_kyote == "A", 1),
                     (ExamJudgements.judgement_kyote == "B", 2),
                     (ExamJudgements.judgement_kyote == "C", 3),
                     (ExamJudgements.judgement_kyote == "D", 4),
                     (ExamJudgements.judgement_kyote == "E", 5),
                     else_=6
                 )),
                (ExamJudgements.judgement_niji.isnot(None),
                 case(
                     (ExamJudgements.judgement_niji == "A", 1),
                     (ExamJudgements.judgement_niji == "B", 2),
                     (ExamJudgements.judgement_niji == "C", 3),
                     (ExamJudgements.judgement_niji == "D", 4),
                     (ExamJudgements.judgement_niji == "E", 5),
                     else_=6
                 )),
                else_=6
            )
        else:
            # それ以外の場合はjudgement_niji優先
            judgment_value_for_subquery = case(
                (ExamJudgements.judgement_niji.isnot(None),
                 case(
                     (ExamJudgements.judgement_niji == "A", 1),
                     (ExamJudgements.judgement_niji == "B", 2),
                     (ExamJudgements.judgement_niji == "C", 3),
                     (ExamJudgements.judgement_niji == "D", 4),
                     (ExamJudgements.judgement_niji == "E", 5),
                     else_=6
                 )),
                else_=6
            )
        
        judgment_subquery_base = (
            db.session.query(
                Students.student_id,
                ExamJudgements.preference_order,
                judgment_value_for_subquery.label('judgment_priority')
            )
            .join(ExamResults, ExamResults.student_id == Students.student_id)
            .join(ExamJudgements, ExamJudgements.result_id == ExamResults.result_id)
            .outerjoin(Departments, Departments.department_id == ExamJudgements.department_id)
            .outerjoin(Faculties, Faculties.faculty_id == Departments.faculty_id)
            .outerjoin(Universities, Universities.university_id == Faculties.university_id)
            .filter(ExamResults.exam_id == exam_id)
        )
        
        # メインクエリと同じフィルタ条件を適用
        if name:
            judgment_subquery_base = judgment_subquery_base.filter(Students.name.ilike(f"%{name}%"))
        if include_top_universities:
            judgment_subquery_base = judgment_subquery_base.filter(Universities.university_id.in_(TOP_UNIVERSITY_IDS))
        elif university_id:
            judgment_subquery_base = judgment_subquery_base.filter(Universities.university_id == university_id)
        elif university:
            judgment_subquery_base = judgment_subquery_base.filter(Universities.university_name.ilike(f"%{university}%"))
        if faculty:
            judgment_subquery_base = judgment_subquery_base.filter(Faculties.faculty_name.ilike(f"%{faculty}%"))
        if order_min and order_max:
            judgment_subquery_base = judgment_subquery_base.filter(ExamJudgements.preference_order.between(order_min, order_max))
        
        # 最小志望順位での最良判定を取得
        best_judgment = func.min(judgment_value_for_subquery).label('best_judgment')
        
        judgment_subquery = (
            judgment_subquery_base
            .join(min_order_subquery, Students.student_id == min_order_subquery.c.student_id)
            .filter(ExamJudgements.preference_order == min_order_subquery.c.min_pref_order)
            .with_entities(Students.student_id, best_judgment)
            .group_by(Students.student_id)
            .subquery()
        )
        
        # メインクエリに両方のサブクエリを結合してソート
        rows = (
            query
            .join(min_order_subquery, Students.student_id == min_order_subquery.c.student_id)
            .outerjoin(judgment_subquery, Students.student_id == judgment_subquery.c.student_id)
            .order_by(
                min_order_subquery.c.min_pref_order,
                func.coalesce(judgment_subquery.c.best_judgment, 6),
                Students.student_id,
                ExamJudgements.preference_order
            )
            .all()
        )
    else:
        # 検索条件に合致する大学が指定されていない場合は従来通り
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
        
        if r.preference_order:
            grouped[sid]["志望"][r.preference_order] = {
                "university_name": uni,
                "faculty_name": fac,
                "department_name": dep,
                "judgement_kyote": jk,
                "judgement_niji": jn,
                "judgement_sougou": js
            }

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
            pref_data = s["志望"].get(i, {})
            row[f"第{i}志望"] = pref_data
        result.append(row)

    return result
