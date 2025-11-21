from flask import Blueprint, jsonify, request
from werkzeug.datastructures import FileStorage
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
import io

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
        (3, "第3回全統共通テスト模試"),
        (7, "第3回全統記述模試"),
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
    # ファイルアップロードから取得
    file = request.files.get("subject_master")
    if not file:
        return jsonify({"error": "subject_master ファイルがありません"}), 400

    result = {"subjects": 0, "read_from_file": 0, "existing": 0, "new": 0, "skipped": 0}

    # --- 科目マスタの取り込み ---
    try:
        raw = file.read()
        # まずUTF-8で読み取り、失敗したらCP932で再試行
        def read_any(enc: str):
            bio = io.BytesIO(raw)
            return pd.read_csv(bio, encoding=enc)
        
        try:
            df_subj = read_any("utf-8-sig")
        except Exception:
            df_subj = read_any("cp932")
        
        # 列名の確認
        if "subject_code" not in df_subj.columns or "subject_name" not in df_subj.columns:
            return jsonify({
                "error": f"CSVに必要な列が見つかりません。列名: {list(df_subj.columns)}"
            }), 400
        
        df_subj = df_subj.dropna(subset=["subject_code", "subject_name"])
        result["read_from_file"] = len(df_subj)
        
        existing_codes = {s.subject_code for s in SubjectMaster.query.all()}
        result["existing"] = len(existing_codes)
        
        new_subjects = []
        skipped = 0
        for _, row in df_subj.iterrows():
            try:
                code = int(row["subject_code"])
                name = str(row["subject_name"]).strip()
                if code not in existing_codes:
                    new_subjects.append(SubjectMaster(subject_code=code, subject_name=name))
                else:
                    skipped += 1
            except (ValueError, TypeError):
                skipped += 1
                continue
        
        result["new"] = len(new_subjects)
        result["skipped"] = skipped
        
        if new_subjects:
            db.session.add_all(new_subjects)
            db.session.commit()
        result["subjects"] = SubjectMaster.query.count()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "imported": result,
        "status": "科目マスタ取り込みが完了しました（既存レコードはスキップ済み）"
    })

