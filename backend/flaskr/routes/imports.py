from flask import Blueprint, request, jsonify
from werkzeug.datastructures import FileStorage
from .. import db
from ..models import Students
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text
import pandas as pd
import io
import datetime as dt

imports_bp = Blueprint("imports", __name__)


def _read_students_csv(file: FileStorage) -> pd.DataFrame:
    raw = file.read()
    # まずUTF-8で読み取り、失敗したらCP932で再試行
    def read_any(enc: str):
        bio = io.BytesIO(raw)
        return pd.read_csv(bio, header=None, encoding=enc)
    try:
        df_all = read_any("utf-8-sig")
    except Exception:
        df_all = read_any("cp932")
    # 6列分が存在することを前提に安全に切り出し
    use_idx = [2, 3, 4, 5, 6, 7]
    # 列不足時はエラー
    if df_all.shape[1] <= max(use_idx):
        raise ValueError("CSVに必要な列(C〜H)が不足しています")
    df = df_all.iloc[:, use_idx].copy()
    df.columns = [
        "student_id",  # C
        "name",        # D
        "name_kana",   # E
        "admission_date",  # F (YYYY/M/D)
        "school_name", # G
        "grade",       # H
    ]
    return df


@imports_bp.route("/imports/students", methods=["POST"])
def import_students():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file がありません"}), 400

    try:
        df = _read_students_csv(file)

        # student_id が数値でない行は除外
        df["student_id"] = pd.to_numeric(df["student_id"], errors="coerce")
        df = df[df["student_id"].notna()]
        df["student_id"] = df["student_id"].astype("int64")

        # 文字列整形
        for col in ["name", "name_kana", "school_name", "grade"]:
            if col in df.columns:
                df[col] = df[col].fillna("").map(lambda x: str(x).strip())

        # 日付（例: 2025/7/12）を date に
        if "admission_date" in df.columns:
            df["admission_date"] = pd.to_datetime(
                df["admission_date"], format="%Y/%m/%d", errors="coerce"
            ).dt.date

        # 同一 student_id は後勝ち
        df = df.drop_duplicates(subset=["student_id"], keep="last")
        file_ids = set(df["student_id"].tolist())

        inserted, updated, skipped = 0, 0, 0

        for _, r in df.iterrows():
            sid = int(r["student_id"])
            stu = Students.query.get(sid)

            # admission_date が欠損の新規はスキップ（NOT NULL制約）
            if not stu and (r.get("admission_date") is None or pd.isna(r.get("admission_date"))):
                skipped += 1
                continue

            if not stu:
                stu = Students(
                    student_id=sid,
                    status="在籍",
                    admission_date=r["admission_date"],
                )
                inserted += 1
            else:
                updated += 1
                # 退会済みがファイルに現れたら在籍に戻す運用
                if stu.status == "退会":
                    stu.status = "在籍"
                # 入会日は提供があれば更新
                if r.get("admission_date") is not None and not pd.isna(r.get("admission_date")):
                    stu.admission_date = r["admission_date"]

            stu.name = r.get("name") or ""
            stu.name_kana = r.get("name_kana") or None
            stu.school_name = r.get("school_name") or ""
            stu.grade = r.get("grade") or ""
            db.session.add(stu)

        db.session.flush()

        # ファイルに存在しない生徒は退会扱いに更新
        if file_ids:
            db.session.query(Students)\
                .filter(~Students.student_id.in_(file_ids))\
                .update({Students.status: "退会"}, synchronize_session=False)

        db.session.commit()
        return jsonify({
            "ok": True,
            "inserted": inserted,
            "updated": updated,
            "skipped": skipped,
            "marked_resigned": True,
            "total_in_file": len(file_ids),
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@imports_bp.route("/imports/exams_xlsx", methods=["POST"])
def import_exams_xlsx():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file がありません"}), 400
    try:
        raw = file.read()
        bio = io.BytesIO(raw)
        # すべて文字列で取り込む（欠損混在を吸収）
        df = pd.read_excel(bio, engine="openpyxl", dtype=str)

        def _cleanup(s):
            if pd.isna(s) or s is None:
                return ""
            return str(s).replace(" ", "").replace("　", "").strip()

        # 校舎コード == 940 のみ
        if "校舎コード" not in df.columns:
            return jsonify({"error": "校舎コード 列が見つかりません"}), 400
        df = df[df["校舎コード"].map(_cleanup) == "940"].copy()
        if df.empty:
            return jsonify({"ok": True, "inserted": {}, "skipped_students": 0, "note": "対象行なし"})

        # 大学名i の分割（1..9）
        for i in range(1, 10):
            col = f"大学名{i}"
            if col in df.columns:
                def _split3(x):
                    x = _cleanup(x)
                    u = x[0:7]
                    f = x[7:12]
                    d = x[12:18]
                    return pd.Series([_cleanup(u), _cleanup(f), _cleanup(d)])
                df[[f"大学名{i}", f"学部名{i}", f"募集区分名{i}"]] = df[col].apply(_split3)

        # コード突合
        from ..models import Universities, Faculties, Exams, ExamMaster, ExamResults, SubjectMaster, SubjectScores, Departments, ExamJudgements
        code_cache_uni = {}
        code_cache_fac = {}

        def get_university_id_by_name(name: str):
            name = _cleanup(name)
            if not name:
                return None
            if name in code_cache_uni:
                return code_cache_uni[name]
            u = Universities.query.filter(Universities.university_name == name).first()
            if not u:
                return None
            code_cache_uni[name] = u.university_id
            return u.university_id

        def get_faculty_id_by_name(university_id, name: str):
            name = _cleanup(name)
            if not name or not university_id:
                return None
            key = (university_id, name)
            if key in code_cache_fac:
                return code_cache_fac[key]
            f = Faculties.query.filter(
                Faculties.university_id == university_id,
                Faculties.faculty_name == name
            ).first()
            if not f:
                return None
            code_cache_fac[key] = f.faculty_id
            return f.faculty_id

        for i in range(1, 10):
            uname_col = f"大学名{i}"
            fname_col = f"学部名{i}"
            if uname_col in df.columns:
                ucode_col = f"大学コード{i}"
                df[ucode_col] = df[uname_col].map(get_university_id_by_name)
            if fname_col in df.columns:
                fcode_col = f"学部コード{i}"
                def _map_fac(row):
                    uid = row.get(f"大学コード{i}")
                    return get_faculty_id_by_name(uid, row.get(fname_col))
                df[fcode_col] = df.apply(_map_fac, axis=1)

        # 必須列の解決
        def find_col(candidates):
            for c in candidates:
                if c in df.columns:
                    return c
            return None
        col_student = find_col(["マナビス生番号", "student_id"])
        col_year = find_col(["年度", "exam_year"])
        col_exam = find_col(["模試", "exam_code"])
        if not (col_student and col_year and col_exam):
            return jsonify({"error": "必須列（マナビス生番号/年度/模試）が見つかりません"}), 400

        # exam_type 判定
        kyote_codes = {1, 2, 3, 4, 38, 66}
        kijutsu_codes = {5, 6, 7, 61, 62, 63, 65, 71, 72, 73, 74}
        op_codes = {12, 13, 15, 16, 18, 19, 21, 22, 24, 25, 27, 31, 41, 42}

        def exam_type_of(code):
            try:
                c = int(str(code))
            except Exception:
                return "不明"
            if c in kyote_codes:
                return "共テ"
            if c in kijutsu_codes:
                return "記述"
            if c in op_codes:
                return "OP"
            return "不明"

        inserted = {"exams": 0, "exam_results": 0, "subject_scores": 0, "judgements": 0}
        skipped_students = 0

        for _, r in df.iterrows():
            sid_str = _cleanup(r.get(col_student))
            if not sid_str.isdigit():
                continue
            sid = int(sid_str)
            stu = Students.query.get(sid)
            if not stu:
                skipped_students += 1
                continue

            # 年度・模試
            year_raw = _cleanup(r.get(col_year))
            exam_code_raw = _cleanup(r.get(col_exam))
            try:
                year = int(year_raw)
                exam_code_val = int(exam_code_raw)
            except Exception:
                continue
            etype = exam_type_of(exam_code_val)

        # ExamMaster
            em = ExamMaster.query.get(exam_code_val)
            if not em:
                em = ExamMaster(exam_code=exam_code_val, exam_name=str(exam_code_val))
                db.session.add(em); db.session.flush()

        # Exams（シーケンスずれに備えリトライ）
        ex = Exams.query.filter_by(exam_code=exam_code_val, exam_year=year, exam_type=etype).first()
        if not ex:
            try:
                ex = Exams(exam_code=exam_code_val, exam_year=year, exam_type=etype)
                db.session.add(ex); db.session.flush()
                inserted["exams"] += 1
            except IntegrityError:
                # PKシーケンスずれを修正して再試行
                db.session.rollback()
                try:
                    db.session.execute(text(
                        "SELECT setval(pg_get_serial_sequence('exams','exam_id'), "
                        "(SELECT COALESCE(MAX(exam_id),0) FROM exams))"
                    ))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                ex = Exams.query.filter_by(exam_code=exam_code_val, exam_year=year, exam_type=etype).first()
                if not ex:
                    ex = Exams(exam_code=exam_code_val, exam_year=year, exam_type=etype)
                    db.session.add(ex); db.session.flush()
                    inserted["exams"] += 1

            # ExamResults
            er = ExamResults.query.filter_by(student_id=sid, exam_id=ex.exam_id).first()
            if not er:
                er = ExamResults(student_id=sid, exam_id=ex.exam_id)
                db.session.add(er); db.session.flush()
                inserted["exam_results"] += 1

            # 科目スコア 01..26
            for n in range(1, 27):
                nn = f"{n:02d}"
                scode_col = f"科{nn}"
                score_col = f"得{nn}"
                dev_col = f"偏{nn}"
                if scode_col not in df.columns:
                    continue
                scode_str = _cleanup(r.get(scode_col))
                if not scode_str.isdigit():
                    continue
                scode = int(scode_str)
                if not SubjectMaster.query.get(scode):
                    continue
                score_val = 0
                dev_val = 0.0
                s_raw = r.get(score_col)
                d_raw = r.get(dev_col)
                if s_raw is not None and _cleanup(s_raw) != "":
                    try:
                        score_val = int(_cleanup(s_raw))
                    except Exception:
                        score_val = 0
                if d_raw is not None and _cleanup(d_raw) != "":
                    try:
                        dev_val = float(_cleanup(d_raw))
                    except Exception:
                        dev_val = 0.0
                ss = SubjectScores.query.filter_by(result_id=er.result_id, subject_code=scode).first()
                if not ss:
                    ss = SubjectScores(result_id=er.result_id, subject_code=scode, score=score_val, deviation_value=dev_val)
                    db.session.add(ss)
                    inserted["subject_scores"] += 1
                else:
                    ss.score = score_val
                    ss.deviation_value = dev_val

            # 志望 1..9
            for i in range(1, 10):
                ucode = r.get(f"大学コード{i}")
                fcode = r.get(f"学部コード{i}")
                dname = _cleanup(r.get(f"募集区分名{i}")) if f"募集区分名{i}" in df.columns else ""
                if (ucode is None and fcode is None and not dname):
                    continue
                try:
                    ucode_val = int(_cleanup(ucode)) if ucode not in [None, ""] else None
                except Exception:
                    ucode_val = None
                try:
                    fcode_val = int(_cleanup(fcode)) if fcode not in [None, ""] else None
                except Exception:
                    fcode_val = None

                dep_id = None
                if fcode_val:
                    dep = Departments.query.filter_by(faculty_id=fcode_val, department_name=dname or "").first()
                    if not dep:
                        dep = Departments(faculty_id=fcode_val, department_name=dname or "")
                        db.session.add(dep); db.session.flush()
                    dep_id = dep.department_id

                kyote = _cleanup(r.get(f"評テ{i}")) if f"評テ{i}" in df.columns else ""
                niji = _cleanup(r.get(f"評二{i}")) if f"評二{i}" in df.columns else ""
                sougou = _cleanup(r.get(f"評総{i}")) if f"評総{i}" in df.columns else ""

                j = ExamJudgements.query.filter_by(result_id=er.result_id, preference_order=i).first()
                if not j:
                    j = ExamJudgements(result_id=er.result_id, preference_order=i, department_id=dep_id,
                                       judgement_kyote=kyote or None, judgement_niji=niji or None, judgement_sougou=sougou or None)
                    db.session.add(j)
                    inserted["judgements"] += 1
                else:
                    j.department_id = dep_id
                    j.judgement_kyote = kyote or None
                    j.judgement_niji = niji or None
                    j.judgement_sougou = sougou or None

        db.session.commit()
        return jsonify({"ok": True, "inserted": inserted, "skipped_students": skipped_students})
    except ValueError as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

