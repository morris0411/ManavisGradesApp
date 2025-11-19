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


@bp.route("/api/seed_exam_master", methods=["POST"])
def seed_exam_master():
    # 並び順（sort_key）はこの配列の順番をそのまま用いる（開催順）
    data = [
        # 高1
        (71, "第1回全統高1模試"),
        (72, "第2回全統高1模試"),
        (73, "第3回全統高1模試"),
        (74, "第4回全統高1模試"),
        # 高2
        (61, "第1回全統高2模試"),
        (62, "第2回全統高2模試"),
        (63, "第3回全統高2模試"),
        (65, "全統記述高2模試"),
        (66, "全統共通テスト高2模試"),
        # 高3（共通・記述）
        (1, "第1回全統共通テスト模試"),
        (5, "第1回全統記述模試"),
        (2, "第2回全統共通テスト模試"),
        (6, "第2回全統記述模試"),
        # 大学別模試（第1回）
        (12, "第1回東大入試オープン"),
        (15, "第1回京大入試オープン"),
        (18, "第1回名大入試オープン"),
        (31, "早慶レベル模試"),
        # 高3（第3回）
        (7, "第3回全統記述模試"),
        (3, "第3回全統共通テスト模試"),
        # 大学別模試（第2回/他）
        (13, "第2回東大入試オープン"),
        (16, "第2回京大入試オープン"),
        (41, "北大入試オープン"),
        (42, "東北大入試オープン"),
        (22, "一橋大入試オープン"),
        (21, "東京科学大入試オープン"),
        (19, "第2回名大入試オープン"),
        (24, "阪大入試オープン"),
        (25, "神大入試オープン"),
        (27, "九大入試オープン"),
        # プレ（最後）
        (4, "全統プレ共通テスト"),
    ]

    # 既存も含めて名称とsort_keyを同期（UPSERT的に更新）
    for idx, (code, name) in enumerate(data, start=1):
        em = ExamMaster.query.get(code)
        if not em:
            em = ExamMaster(exam_code=code, exam_name=name, sort_key=idx)
            db.session.add(em)
        else:
            em.exam_name = name
            em.sort_key = idx
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
