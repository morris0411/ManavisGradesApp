from datetime import date

from flaskr.models import (
    Students,
    Exams,
    ExamResults,
    ExamMaster,
    Universities,
    Faculties,
    Departments,
    ExamJudgements,
)
from flaskr.services import exam_service


def _create_basic_exam_data(session):
    """list_years / list_exam_types / list_exam_names / search_exams 用の最小データ"""

    m1 = ExamMaster(exam_code=1, exam_name="共通テスト本試")
    m2 = ExamMaster(exam_code=2, exam_name="記述模試")

    e1 = Exams(exam_id=1, exam_code=1, exam_year=2024, exam_type="共テ")
    e2 = Exams(exam_id=2, exam_code=2, exam_year=2024, exam_type="記述")
    e3 = Exams(exam_id=3, exam_code=1, exam_year=2023, exam_type="共テ")

    s1 = Students(
        student_id=1001,
        name="山田太郎",
        name_kana="ヤマダタロウ",
        school_name="東京高校",
        grade="高2",
        status="在籍",
        admission_date=date(2023, 4, 1),
    )
    s2 = Students(
        student_id=1002,
        name="山本花子",
        name_kana="ヤマモトハナコ",
        school_name="大阪高校",
        grade="高3",
        status="在籍",
        admission_date=date(2023, 4, 1),
    )

    r1 = ExamResults(result_id=1, student_id=1001, exam_id=1)
    r2 = ExamResults(result_id=2, student_id=1002, exam_id=1)
    r3 = ExamResults(result_id=3, student_id=1002, exam_id=2)

    session.add_all([m1, m2, e1, e2, e3, s1, s2, r1, r2, r3])
    session.commit()


def test_list_years_returns_distinct_years_desc(session):
    _create_basic_exam_data(session)

    years = exam_service.list_years()
    assert years == [2024, 2023]


def test_list_exam_types_filtered_by_year(session):
    _create_basic_exam_data(session)

    # 2024 年には 共テ / 記述 の 2 種類
    types_2024 = exam_service.list_exam_types(year=2024)
    assert set(types_2024) == {"共テ", "記述"}

    # 2023 年には 共テ のみ
    types_2023 = exam_service.list_exam_types(year=2023)
    assert types_2023 == ["共テ"]


def test_list_exam_names_filtered_by_year_and_type(session):
    _create_basic_exam_data(session)

    names = exam_service.list_exam_names(year=2024, exam_type="共テ")
    # 2024 年の共テは「共通テスト本試」のみ
    assert names == ["共通テスト本試"]


def test_search_exams_returns_num_students_and_link(session):
    _create_basic_exam_data(session)

    # 2024 年の共テを検索
    results = exam_service.search_exams(year=2024, exam_type="共テ", exam_name="共通テスト本試")

    assert len(results) == 1
    exam = results[0]
    assert exam["exam_year"] == 2024
    assert exam["exam_type"] == "共テ"
    assert exam["exam_name"] == "共通テスト本試"
    # exam_id=1 には 2 名が紐づいている
    assert exam["num_students"] == 2
    assert exam["link"] == "/api/exams/1"


def test_filter_exam_results_basic_structure(session):
    """
    filter_exam_results のフォーマット結果を簡単に検証する。
    詳細なソートロジックまではテストしない。
    """
    # マスタ
    uni = Universities(university_id=1, university_name="東京")
    fac = Faculties(faculty_id=1, university_id=1, faculty_name="理学部")
    dep = Departments(department_id=1, faculty_id=1, department_name="数学科")

    m1 = ExamMaster(exam_code=1, exam_name="共通テスト本試")
    e1 = Exams(exam_id=1, exam_code=1, exam_year=2024, exam_type="共テ")

    s1 = Students(
        student_id=1001,
        name="山田太郎",
        name_kana="ヤマダタロウ",
        school_name="東京高校",
        grade="高2",
        status="在籍",
        admission_date=date(2023, 4, 1),
    )

    r1 = ExamResults(result_id=1, student_id=1001, exam_id=1)

    j1 = ExamJudgements(
        judgement_id=1,
        result_id=1,
        preference_order=1,
        department_id=1,
        judgement_kyote="A",
        judgement_niji=None,
        judgement_sougou=None,
    )

    session.add_all([uni, fac, dep, m1, e1, s1, r1, j1])
    session.commit()

    rows = exam_service.filter_exam_results(exam_id=1)

    assert len(rows) == 1
    row = rows[0]
    assert row["student_id"] == 1001
    assert row["name"] == "山田太郎"
    assert row["school_name"] == "東京高校"

    # 第1志望が設定されていること
    first = row["第1志望"]
    assert first["university_name"] == "東京"
    assert first["faculty_name"] == "理学部"
    assert first["department_name"] == "数学科"
    assert first["judgement_kyote"] == "A"


