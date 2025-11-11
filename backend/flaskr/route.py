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
        # Students は実データを保持するため削除しない

        db.session.commit()
        return jsonify({"message": "全てのダミーデータを削除しました。"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@bp.route("/api/seed_dummy_data", methods=["POST"]) 
def seed_dummy_data():
    try:
        # --- Students（存在しなければ作成）---
        if not Students.query.get(455387):
            s1 = Students(student_id=455387, name="清水　友貴", name_kana="シミズ　ユウキ", school_name="北野", grade="高3", status="在籍", admission_date="2023-05-01")
            db.session.add(s1)
        if not Students.query.get(2):
            s2 = Students(student_id=2, name="谷口　冬馬", name_kana="タニグチ　トウマ", school_name="四条畷", grade="高2", status="在籍", admission_date="2024-08-01")
            db.session.add(s2)
        db.session.flush()

        # --- Exams（PKは自動採番） ---
        exam_specs = [
            (1, 2024, "共テ"),
            (2, 2024, "共テ"),
            (3, 2024, "共テ"),
            (5, 2024, "記述"),
            (6, 2024, "記述"),
            (7, 2024, "記述"),
            (24, 2024, "OP"),
        ]
        ex_objs = {}
        for code, year, etype in exam_specs:
            ex = Exams.query.filter_by(exam_code=code, exam_year=year, exam_type=etype).first()
            if not ex:
                ex = Exams(exam_code=code, exam_year=year, exam_type=etype)
                db.session.add(ex); db.session.flush()
            ex_objs[(code, year, etype)] = ex

        # --- ExamResults ---
        er_targets = [
            (455387, ex_objs[(1, 2024, "共テ")].exam_id),
            (455387, ex_objs[(2, 2024, "共テ")].exam_id),
            (455387, ex_objs[(3, 2024, "共テ")].exam_id),
            (455387, ex_objs[(5, 2024, "記述")].exam_id),
            (455387, ex_objs[(6, 2024, "記述")].exam_id),
            (455387, ex_objs[(7, 2024, "記述")].exam_id),
            (455387, ex_objs[(24, 2024, "OP")].exam_id),
        ]
        er_objs = {}
        for sid, eid in er_targets:
            er = ExamResults.query.filter_by(student_id=sid, exam_id=eid).first()
            if not er:
                er = ExamResults(student_id=sid, exam_id=eid)
                db.session.add(er); db.session.flush()
            er_objs[(sid, eid)] = er

        # --- SubjectScores（PKは自動採番） ---
        def add_score(er, scode, score, dev):
            ss = SubjectScores.query.filter_by(result_id=er.result_id, subject_code=scode).first()
            if not ss:
                ss = SubjectScores(result_id=er.result_id, subject_code=scode, score=score, deviation_value=dev)
                db.session.add(ss)
            else:
                ss.score = score; ss.deviation_value = dev

        add_score(er_objs[(455387, ex_objs[(1, 2024, "共テ")].exam_id)], 1110, 82, 61.7)
        add_score(er_objs[(455387, ex_objs[(1, 2024, "共テ")].exam_id)], 1520, 86, 67.9)
        add_score(er_objs[(455387, ex_objs[(1, 2024, "共テ")].exam_id)], 2580, 157, 63.2)

        # --- Departments（PKは自動採番） ---
        def get_dep(fid, name):
            dep = Departments.query.filter_by(faculty_id=fid, department_name=name).first()
            if not dep:
                dep = Departments(faculty_id=fid, department_name=name)
                db.session.add(dep); db.session.flush()
            return dep
        dep1 = get_dep(22, "東北　　　　　医　　　　医－前　　　")
        dep2 = get_dep(100, "神戸　　　　　医　　　　医－前　　　")
        dep3 = get_dep(75, "大阪　　　　　医　　　　放射線－前　")

        # --- ExamJudgements（新カラムに対応） ---
        def upsert_judgement(er, order, dep, sougou=None, kyote=None, niji=None):
            j = ExamJudgements.query.filter_by(result_id=er.result_id, preference_order=order).first()
            if not j:
                j = ExamJudgements(result_id=er.result_id, preference_order=order, department_id=dep.department_id,
                                   judgement_sougou=sougou, judgement_kyote=kyote, judgement_niji=niji)
                db.session.add(j)
            else:
                j.department_id = dep.department_id
                j.judgement_sougou = sougou
                j.judgement_kyote = kyote
                j.judgement_niji = niji

        er1 = er_objs[(455387, ex_objs[(1, 2024, "共テ")].exam_id)]
        er2 = er_objs[(455387, ex_objs[(2, 2024, "共テ")].exam_id)]
        upsert_judgement(er1, 1, dep1, sougou="C")
        upsert_judgement(er1, 2, dep2, sougou="B")
        upsert_judgement(er1, 3, dep3, sougou="A")
        upsert_judgement(er2, 1, dep1, sougou="C")
        upsert_judgement(er2, 2, dep2, sougou="B")
        upsert_judgement(er2, 3, dep3, sougou="A")

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
