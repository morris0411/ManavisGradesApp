# backend/flaskr/services/students_service.py
from ..models import (
    Students, Exams, ExamResults, ExamJudgements,
    Departments, Faculties, Universities,
    SubjectScores, SubjectMaster, ExamMaster
)
from sqlalchemy import or_, asc
from .. import db


# ------------------------
# 生徒検索（名前・高校名・マナビス生番号）
# ------------------------
def search_students(keyword=None, statuses=None):
    """
    生徒名・高校名・マナビス生番号（student_id）で部分一致検索
    """
    query = Students.query
    if keyword:
        q = f"%{keyword}%"
        query = query.filter(
            or_(
                Students.name.ilike(q),
                Students.name_kana.ilike(q),
                Students.school_name.ilike(q),
                Students.student_id.cast(db.String).ilike(q)
            )
        )
    # ステータスフィルタ（在籍/既卒/退会）
    if statuses:
        query = query.filter(Students.status.in_(statuses))
    students = query.order_by(Students.student_id).all()
    return [
        {
            "student_id": s.student_id,
            "name": s.name,
            "name_kana": s.name_kana,
            "school_name": s.school_name,
            "grade": s.grade,
            "status": s.status,
        }
        for s in students
    ]


# ------------------------
# 生徒詳細（模試・志望校・科目スコア）
# ------------------------
def get_student_detail(student_id):
    """
    生徒IDから詳細情報を取得
    - 基本情報（id, name, school_name, grade）
    - 受けた模試（exam_name, exam_year, exam_type）
    - 各模試の志望校情報（university_name, faculty_name, department_name, preference_order, judgement）
    - 各模試の科目情報（subject_name, score, deviation_value）
    """
    student = Students.query.get(student_id)
    if not student:
        return None

    # 生徒の模試結果一覧
    exam_results = (
        db.session.query(ExamResults, Exams, ExamMaster)
        .join(Exams, Exams.exam_id == ExamResults.exam_id)
        .join(ExamMaster, ExamMaster.exam_code == Exams.exam_code)
        .filter(ExamResults.student_id == student_id)
        .order_by(asc(Exams.exam_year), asc(ExamMaster.sort_key), asc(Exams.exam_id))
        .all()
    )

    exam_details = []
    for er, ex, em in exam_results:
        # --- 志望校・判定情報 ---
        judgements = (
            db.session.query(ExamJudgements, Departments, Faculties, Universities)
            .join(Departments, ExamJudgements.department_id == Departments.department_id)
            .join(Faculties, Departments.faculty_id == Faculties.faculty_id)
            .join(Universities, Faculties.university_id == Universities.university_id)
            .filter(ExamJudgements.result_id == er.result_id)
            .all()
        )

        # --- 科目スコア ---
        subject_scores = (
            db.session.query(SubjectScores, SubjectMaster)
            .join(SubjectMaster, SubjectScores.subject_code == SubjectMaster.subject_code)
            .filter(SubjectScores.result_id == er.result_id)
            .all()
        )

        exam_details.append({
            "exam_name": em.exam_name if em else None,
            "exam_year": ex.exam_year,
            "exam_type": ex.exam_type,
            "judgements": [
                {
                    "university_name": u.university_name,
                    "faculty_name": f.faculty_name,
                    "department_name": d.department_name,
                    "preference_order": j.preference_order,
                    "judgement": (j.judgement_sougou or j.judgement_kyote or j.judgement_niji),
                    "judgement_kyote": j.judgement_kyote,
                    "judgement_niji": j.judgement_niji,
                    "judgement_sougou": j.judgement_sougou
                }
                for j, d, f, u in judgements
            ],
            "scores": [
                {
                    "subject_code": s.subject_code,
                    "subject_name": s.subject_name,
                    "score": sc.score,
                    "deviation_value": float(sc.deviation_value)
                }
                for sc, s in subject_scores
            ]
        })

    return {
        "student_id": student.student_id,
        "name": student.name,
        "name_kana": student.name_kana,
        "school_name": student.school_name,
        "grade": student.grade,
        "status": student.status,
        "admission_date": student.admission_date,
        "exams": exam_details
    }
