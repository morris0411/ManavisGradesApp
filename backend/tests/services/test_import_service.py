import io
from datetime import date

import pandas as pd
import pytest
from werkzeug.datastructures import FileStorage

from flaskr.models import Exams, ExamMaster, Students, SubjectMaster
from flaskr.services import import_service


def _csv_filestorage(text: str, filename: str = "students.csv") -> FileStorage:
    return FileStorage(stream=io.BytesIO(text.encode("utf-8")), filename=filename, content_type="text/csv")


def _dummy_filestorage(filename: str = "file.bin") -> FileStorage:
    return FileStorage(stream=io.BytesIO(b"dummy"), filename=filename, content_type="application/octet-stream")


def test_import_students_from_csv_inserts_updates_and_marks_resigned(session):
    # 既存（退会→在籍に戻る）
    session.add(
        Students(
            student_id=1001,
            name="旧名",
            name_kana=None,
            school_name="旧校",
            grade="高1",
            admission_date=date(2024, 4, 1),
            status="退会",
        )
    )
    # 既存（ファイルに居ない→退会に更新される）
    session.add(
        Students(
            student_id=2001,
            name="不在生徒",
            name_kana=None,
            school_name="A校",
            grade="高2",
            admission_date=date(2024, 4, 1),
            status="在籍",
        )
    )
    session.commit()

    # pandas.read_csv(header=None) 前提: A..H の8列を用意し、C..H を取り込ませる
    csv_text = "\n".join(
        [
            # A,B, C(student_id), D(name), E(kana), F(admission_date), G(school), H(grade)
            "x,x,1001,山田太郎,ヤマダタロウ,2025/04/01,東京高校,高2",
            "x,x,1002,山本花子,,2025/04/02,大阪高校,高1",
            "x,x,abc,無効行,,2025/04/03,無効校,高3",
        ]
    )
    result = import_service.import_students_from_csv(_csv_filestorage(csv_text))

    assert result["inserted"] == 1
    assert result["updated"] == 1
    assert result["skipped"] == 0
    assert result["total_in_file"] == 2

    s1001 = Students.query.get(1001)
    assert s1001 is not None
    assert s1001.status == "在籍"
    assert s1001.name == "山田太郎"
    assert s1001.name_kana == "ヤマダタロウ"
    assert s1001.grade == "高2"
    assert s1001.admission_date == date(2025, 4, 1)

    s1002 = Students.query.get(1002)
    assert s1002 is not None
    assert s1002.status == "在籍"
    assert s1002.name == "山本花子"
    assert s1002.name_kana is None

    s2001 = Students.query.get(2001)
    assert s2001 is not None
    assert s2001.status == "退会"


def test_import_students_from_csv_skips_new_without_admission_date(session):
    csv_text = "\n".join(
        [
            "x,x,3001,入会日なし,, ,学校,高1",
        ]
    )
    result = import_service.import_students_from_csv(_csv_filestorage(csv_text))
    assert result["inserted"] == 0
    assert result["updated"] == 0
    assert result["skipped"] == 1
    assert result["total_in_file"] == 1
    assert Students.query.get(3001) is None


def test_import_students_from_csv_requires_columns(session):
    # 8列未満だと C〜H が取れず ValueError
    csv_text = "\n".join(
        [
            "only,3,cols",
        ]
    )
    with pytest.raises(ValueError) as e:
        import_service.import_students_from_csv(_csv_filestorage(csv_text))
    assert "CSVに必要な列" in str(e.value)


def test_seed_subject_master_data_inserts_new_and_skips_existing_and_invalid(session):
    session.add(SubjectMaster(subject_code=1, subject_name="数学"))
    session.commit()

    csv_text = "\n".join(
        [
            "subject_code,subject_name",
            "1,数学",
            "2,英語",
            "x,国語",
        ]
    )
    result = import_service.seed_subject_master_data(_csv_filestorage(csv_text, filename="subject_master.csv"))

    assert result["subjects"] == 2
    assert result["existing"] == 1
    assert result["new"] == 1
    assert result["skipped"] == 2
    assert SubjectMaster.query.get(2).subject_name == "英語"


def test_import_exams_from_xlsx_missing_campus_code_column_raises(session, monkeypatch):
    monkeypatch.setattr(import_service, "_debug_df", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(import_service.pd, "read_excel", lambda *_args, **_kwargs: pd.DataFrame({"A": [1]}))
    with pytest.raises(ValueError) as e:
        import_service.import_exams_from_xlsx(_dummy_filestorage("exams.xlsx"))
    assert "校舎コード" in str(e.value)


def test_import_exams_from_xlsx_no_target_rows_returns_note(session, monkeypatch):
    monkeypatch.setattr(import_service, "_debug_df", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(
        import_service.pd,
        "read_excel",
        lambda *_args, **_kwargs: pd.DataFrame({"校舎コード": ["123"]}),
    )
    result = import_service.import_exams_from_xlsx(_dummy_filestorage("exams.xlsx"))
    assert result["inserted"] == {}
    assert result["skipped_students"] == 0
    assert result["note"] == "対象行なし"


def test_import_exams_from_xlsx_duplicate_exam_raises(session, monkeypatch):
    monkeypatch.setattr(import_service, "_debug_df", lambda *_args, **_kwargs: None)

    session.add(
        Students(
            student_id=1001,
            name="山田太郎",
            name_kana=None,
            school_name="東京高校",
            grade="高3",
            admission_date=date(2024, 4, 1),
            status="在籍",
        )
    )
    session.add(ExamMaster(exam_code=1, exam_name="第1回全統共通テスト模試", sort_key=10))
    session.commit()

    # 既に同じ (exam_code, exam_year) が存在 → duplicate 判定
    session.add(Exams(exam_code=1, exam_year=2025, exam_type="共テ"))
    session.commit()

    df = pd.DataFrame(
        [
            {"校舎コード": "940", "マナビス生番号": "1001", "年度": "2025", "模試": "1"},
        ]
    )
    monkeypatch.setattr(import_service.pd, "read_excel", lambda *_args, **_kwargs: df)

    with pytest.raises(ValueError) as e:
        import_service.import_exams_from_xlsx(_dummy_filestorage("exams.xlsx"))
    assert "duplicate:" in str(e.value)
    assert "2025" in str(e.value)


