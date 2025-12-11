from datetime import date

from flaskr.models import Students
from flaskr.services import students_service


def _create_student(
    session,
    student_id,
    name,
    name_kana,
    school_name,
    grade,
    status,
):
    s = Students(
        student_id=student_id,
        name=name,
        name_kana=name_kana,
        school_name=school_name,
        grade=grade,
        status=status,
        admission_date=date(2023, 4, 1),
    )
    session.add(s)
    return s


def test_search_students_no_filters_returns_all_in_id_order(session):
    _create_student(session, 1002, "山本花子", "ヤマモトハナコ", "大阪高校", "高3", "既卒")
    _create_student(session, 1001, "山田太郎", "ヤマダタロウ", "東京高校", "高2", "在籍")
    _create_student(session, 2001, "佐藤次郎", None, "東京高校", "高1", "退会")
    session.commit()

    result = students_service.search_students()
    ids = [r["student_id"] for r in result]

    assert ids == [1001, 1002, 2001]


def test_search_students_filter_by_name_and_status(session):
    _create_student(session, 1001, "山田太郎", "ヤマダタロウ", "東京高校", "高2", "在籍")
    _create_student(session, 1002, "山本花子", "ヤマモトハナコ", "大阪高校", "高3", "既卒")
    _create_student(session, 2001, "佐藤次郎", None, "東京高校", "高1", "退会")
    session.commit()

    # 「東京」を含む + 在籍 or 既卒
    result = students_service.search_students(keyword="東京", statuses=["在籍", "既卒"])
    ids = [r["student_id"] for r in result]

    # 退会の 2001 は除外される
    assert ids == [1001]


def test_search_students_filter_by_student_id_string(session):
    _create_student(session, 1001, "山田太郎", "ヤマダタロウ", "東京高校", "高2", "在籍")
    _create_student(session, 1002, "山本花子", "ヤマモトハナコ", "大阪高校", "高3", "既卒")
    session.commit()

    result = students_service.search_students(keyword="1001")
    ids = [r["student_id"] for r in result]

    assert ids == [1001]


def test_get_student_detail_returns_none_when_not_found(session):
    # 生徒が登録されていない状態
    result = students_service.get_student_detail(9999)
    assert result is None


