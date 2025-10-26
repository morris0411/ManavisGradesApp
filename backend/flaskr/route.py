from flask import Blueprint, jsonify, request
from .services import search_students
from . import db
from .models import Students
from .models import ExamMaster
from sqlalchemy import text
from .models import SubjectMaster
import pandas as pd
import os
import openpyxl

bp = Blueprint("api", __name__)

@bp.route("/api/search")
def search():
    keyword = request.args.get("keyword", "")
    results = search_students(keyword)
    return jsonify(results)


@bp.route("/api/health")
def health():
    # 簡易ヘルスチェック（DB接続確認）
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"status": "ng", "error": str(e)}), 500


@bp.route("/api/seed", methods=["POST"]) 
def seed():
    # 初期データを投入（重複を避けるため存在チェック）
    if Students.query.count() == 0:
        samples = [
            Students(name="田中太郎", subject="数学", score=85),
            Students(name="佐藤花子", subject="英語", score=92),
            Students(name="鈴木一郎", subject="理科", score=78),
        ]
        db.session.add_all(samples)
        db.session.commit()
    return jsonify({"seeded": True, "count": Students.query.count()})


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
    
    
@bp.route("/api/seed_subject_master", methods=["POST"])
def import_subject_master():
    file_path = r"C:\ManavisGradesApp\backend\科目コード.csv"

    # ✅ UTF-8(BOM付き含む)で安全に読み込み
    df = pd.read_csv(file_path, encoding="utf-8-sig")

    # ✅ 欠損行をスキップ
    df = df.dropna(subset=["subject_code", "subject_name"])

    # ✅ 既存コードを除外して登録
    existing_codes = {s.subject_code for s in SubjectMaster.query.all()}
    new_records = []

    for _, row in df.iterrows():
        try:
            code = int(row["subject_code"])
            name = str(row["subject_name"]).strip()
            if code not in existing_codes:
                new_records.append(SubjectMaster(subject_code=code, subject_name=name))
        except (ValueError, TypeError):
            continue

    db.session.add_all(new_records)
    db.session.commit()

    return jsonify({
        "imported": len(new_records),
        "total": SubjectMaster.query.count(),
        "status": "✅ UTF-8で正常に登録されました"
    })
