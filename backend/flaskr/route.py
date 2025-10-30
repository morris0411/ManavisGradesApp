from flask import Blueprint, jsonify, request
# students service の関数を直接参照しない（blueprint側で呼び出すため削除）
from . import db
from .models import Students
from .models import ExamMaster
from sqlalchemy import text
from .models import SubjectMaster
from .models import Universities, Faculties, Students, Exams, ExamResults, SubjectScores, ExamJudgements, Departments
import pandas as pd
import os
import openpyxl

bp = Blueprint("api", __name__)

    
@bp.route("/api/reset_dummy_data", methods=["DELETE"])
def reset_dummy_data():
    try:
        # 外部キーの依存関係に注意して、下位のテーブルから順に削除
        db.session.query(SubjectScores).delete()
        db.session.query(ExamJudgements).delete()
        db.session.query(ExamResults).delete()
        db.session.query(Departments).delete()
        db.session.query(Exams).delete()
        db.session.query(Students).delete()

        db.session.commit()
        return jsonify({"message": "全てのダミーデータを削除しました。"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@bp.route("/api/seed_dummy_data", methods=["POST"]) 
def seed_dummy_data():
    try:
        # --- Students ---
        students = [
            Students(student_id=455387, name="清水友貴", school_name="北野", grade="高3", admission_date="2023-05-01"),
            Students(student_id=2, name="谷口冬馬", school_name="四条畷", grade="高2", admission_date="2024-08-01")
        ]
        db.session.add_all(students)

        # --- Exams ---
        exams = [
            Exams(exam_id=1, exam_code=1, exam_year=2024, exam_type="共テ"),
            Exams(exam_id=2, exam_code=2, exam_year=2024, exam_type="共テ"),
            Exams(exam_id=3, exam_code=3, exam_year=2024, exam_type="共テ"),
            Exams(exam_id=4, exam_code=5, exam_year=2024, exam_type="記述"),
            Exams(exam_id=5, exam_code=6, exam_year=2024, exam_type="記述"),
            Exams(exam_id=6, exam_code=7, exam_year=2024, exam_type="記述"),
            Exams(exam_id=7, exam_code=24, exam_year=2024, exam_type="OP")
        ]
        db.session.add_all(exams)

        # --- ExamResults ---
        exam_results = [
            ExamResults(result_id=1, student_id=455387, exam_id=1),
            ExamResults(result_id=2, student_id=455387, exam_id=2),
            ExamResults(result_id=3, student_id=455387, exam_id=3),
            ExamResults(result_id=4, student_id=455387, exam_id=4),
            ExamResults(result_id=5, student_id=455387, exam_id=5),
            ExamResults(result_id=6, student_id=455387, exam_id=6),
            ExamResults(result_id=7, student_id=455387, exam_id=7)
        ]
        db.session.add_all(exam_results)

        # --- SubjectScores ---
        subject_scores = [
            SubjectScores(score_id=1, result_id=1, subject_code=1110, score=82, deviation_value=61.7),
            SubjectScores(score_id=2, result_id=1, subject_code=1520, score=86, deviation_value=67.9),
            SubjectScores(score_id=3, result_id=1, subject_code=2580, score=157, deviation_value=63.2),
            SubjectScores(score_id=4, result_id=1, subject_code=3120, score=105, deviation_value=71.9),
            SubjectScores(score_id=5, result_id=1, subject_code=3910, score=157, deviation_value=65.5),
            SubjectScores(score_id=6, result_id=1, subject_code=4310, score=68, deviation_value=62.6),
            SubjectScores(score_id=7, result_id=1, subject_code=4410, score=55, deviation_value=57.3),
            SubjectScores(score_id=8, result_id=1, subject_code=5210, score=70, deviation_value=64.5),
            SubjectScores(score_id=9, result_id=1, subject_code=6110, score=75, deviation_value=58.4),
            SubjectScores(score_id=10, result_id=1, subject_code=7665, score=765, deviation_value=58.4),
            
            SubjectScores(score_id=11, result_id=2, subject_code=1110, score=82, deviation_value=61.7),
            SubjectScores(score_id=12, result_id=2, subject_code=1520, score=86, deviation_value=67.9),
            SubjectScores(score_id=13, result_id=2, subject_code=2580, score=157, deviation_value=63.2),
            SubjectScores(score_id=14, result_id=2, subject_code=3120, score=105, deviation_value=71.9),
            SubjectScores(score_id=15, result_id=2, subject_code=3910, score=157, deviation_value=65.5),
            SubjectScores(score_id=16, result_id=2, subject_code=4310, score=68, deviation_value=62.6),
            SubjectScores(score_id=17, result_id=2, subject_code=4410, score=55, deviation_value=57.3),
            SubjectScores(score_id=18, result_id=2, subject_code=5210, score=70, deviation_value=64.5),
            SubjectScores(score_id=19, result_id=2, subject_code=6110, score=75, deviation_value=58.4),
            SubjectScores(score_id=20, result_id=2, subject_code=7665, score=765, deviation_value=58.4),
            
            SubjectScores(score_id=21, result_id=2, subject_code=2270, score=95, deviation_value=72.5),
            SubjectScores(score_id=22, result_id=3, subject_code=1710, score=80, deviation_value=69.6)
        ]
        db.session.add_all(subject_scores)

        # --- Departments ---
        departments = [
            Departments(department_id=100, faculty_id=22, department_name="東北　　　　　医　　　　医－前　　　"),
            Departments(department_id=200, faculty_id=100, department_name="神戸　　　　　医　　　　医－前　　　"),
            Departments(department_id=300, faculty_id=75, department_name="大阪　　　　　医　　　　放射線－前　")
        ]
        db.session.add_all(departments)

        # --- ExamJudgements ---
        exam_judgements = [
            ExamJudgements(judgement_id=1, result_id=1, preference_order=1, department_id=100, judgement="C"),
            ExamJudgements(judgement_id=2, result_id=1, preference_order=2, department_id=200, judgement="B"),
            ExamJudgements(judgement_id=3, result_id=1, preference_order=3, department_id=300, judgement="A"),
            
            ExamJudgements(judgement_id=4, result_id=2, preference_order=1, department_id=100, judgement="C"),
            ExamJudgements(judgement_id=5, result_id=2, preference_order=2, department_id=200, judgement="B"),
            ExamJudgements(judgement_id=6, result_id=2, preference_order=3, department_id=300, judgement="A")
        ]
        db.session.add_all(exam_judgements)

        db.session.commit()

        return jsonify({"message": "ダミーデータを登録しました。"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/api/seed_exam_master", methods=["POST"])
def seed_exam_master():
    data = [
        (1, "第1回全統共通テスト模試"),
        (2, "第2回全統共通テスト模試"),
        (3, "第3回全統共通テスト模試"),
        (4, "全統プレ共通テスト"),
        (5, "第1回全統記述模試"),
        (6, "第2回全統記述模試"),
        (7, "第3回全統記述模試"),
        (12, "第1回東大入試オープン"),
        (13, "第2回東大入試オープン"),
        (15, "第1回京大入試オープン"),
        (16, "第2回京大入試オープン"),
        (18, "第1回名大入試オープン"),
        (19, "第2回名大入試オープン"),
        (21, "東京科学大入試オープン"),
        (22, "一橋大入試オープン"),
        (24, "阪大入試オープン"),
        (25, "神大入試オープン"),
        (27, "九大入試オープン"),
        (31, "早慶レベル模試"),
        (38, "共通テストリサーチ"),
        (41, "北大入試オープン"),
        (42, "東北大入試オープン"),
        (61, "第1回全統高2模試"),
        (62, "第2回全統高2模試"),
        (63, "第3回全統高2模試"),
        (65, "全統記述高2模試"),
        (66, "全統共通テスト高2模試"),
        (71, "第1回全統高1模試"),
        (72, "第2回全統高1模試"),
        (73, "第3回全統高1模試"),
        (74, "第4回全統高1模試"),
    ]

    # すでにデータが入っていない場合のみ登録
    if ExamMaster.query.count() == 0:
        records = [ExamMaster(exam_code=c, exam_name=n) for c, n in data]
        db.session.add_all(records)
        db.session.commit()

    return jsonify({
        "seeded": True,
        "count": ExamMaster.query.count()
    })
    
    
@bp.route("/api/seed_master", methods=["POST"])
def import_masters():
    # ファイルパス
    subjects_path = r"C:\ManavisGradesApp\backend\科目コード.csv"
    universities_path = r"C:\ManavisGradesApp\backend\大学コード.csv"
    faculties_path = r"C:\ManavisGradesApp\backend\学部コード.csv"

    result = {"universities": 0, "faculties": 0, "subjects": 0}

    # --- 大学マスタの取り込み ---
    try:
        df_uni = pd.read_csv(universities_path, encoding="utf-8-sig").dropna(subset=["university_code", "university_name"]) 
        existing_uni_ids = {u.university_id for u in Universities.query.all()}
        new_uni = []
        for _, row in df_uni.iterrows():
            try:
                code = int(row["university_code"])  # PKとして採用
                name = str(row["university_name"]).strip()
                if code not in existing_uni_ids:
                    new_uni.append(Universities(university_id=code, university_name=name))
            except (ValueError, TypeError):
                continue
        if new_uni:
            db.session.add_all(new_uni)
            db.session.commit()
        result["universities"] = Universities.query.count()
    except FileNotFoundError:
        pass

    # --- 学部マスタの取り込み（university_code を使用） ---
    try:
        df_fac = pd.read_csv(faculties_path, encoding="utf-8-sig").dropna(subset=["faculty_code", "faculty_name", "university_code"]) 
        existing_fac_ids = {f.faculty_id for f in Faculties.query.all()}
        existing_uni_ids = {u.university_id for u in Universities.query.all()}
        new_unis = []
        new_fac = []
        for _, row in df_fac.iterrows():
            try:
                fac_code = int(row["faculty_code"])  # Faculties PK
                uni_code = int(row["university_code"])  # Universities FK
                fac_name = str(row["faculty_name"]).strip()
                # 大学が未登録ならプレースホルダー名称で作成
                if uni_code not in existing_uni_ids:
                    new_unis.append(Universities(university_id=uni_code, university_name=f"未登録({uni_code})"))
                    existing_uni_ids.add(uni_code)
                if fac_code not in existing_fac_ids:
                    new_fac.append(Faculties(faculty_id=fac_code, university_id=uni_code, faculty_name=fac_name))
            except (ValueError, TypeError):
                continue
        if new_unis:
            db.session.add_all(new_unis)
            db.session.commit()
        if new_fac:
            db.session.add_all(new_fac)
            db.session.commit()
        result["faculties"] = Faculties.query.count()
    except FileNotFoundError:
        pass

    # --- 科目マスタの取り込み ---
    try:
        df_subj = pd.read_csv(subjects_path, encoding="utf-8-sig").dropna(subset=["subject_code", "subject_name"]) 
        existing_codes = {s.subject_code for s in SubjectMaster.query.all()}
        new_subjects = []
        for _, row in df_subj.iterrows():
            try:
                code = int(row["subject_code"]) 
                name = str(row["subject_name"]).strip()
                if code not in existing_codes:
                    new_subjects.append(SubjectMaster(subject_code=code, subject_name=name))
            except (ValueError, TypeError):
                continue
        if new_subjects:
            db.session.add_all(new_subjects)
            db.session.commit()
        result["subjects"] = SubjectMaster.query.count()
    except FileNotFoundError:
        pass

    return jsonify({
        "imported": result,
        "status": "✅ マスタ取り込みが完了しました（存在分はスキップ）"
    })
