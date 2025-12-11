from datetime import date

import pytest

from flaskr.models import Students, AcademicYearUpdate
from flaskr.services import academic_year_service
from flaskr import db


class _FixedDate(date):
    """academic_year_service.date を差し替えるためのヘルパークラス"""

    @classmethod
    def today(cls):
        # デフォルトは 2025-04-01
        return cls(2025, 4, 1)


def _set_today(monkeypatch, year, month, day):
    """academic_year_service 内の date.today() を任意の日付に差し替える"""

    class _D(date):
        @classmethod
        def today(cls):
            return cls(year, month, day)

    monkeypatch.setattr(academic_year_service, "date", _D)


def test_get_academic_year_april_first():
    d = date(2025, 4, 1)
    assert academic_year_service.get_academic_year(d) == 2025


def test_get_academic_year_before_april():
    d = date(2025, 3, 31)
    assert academic_year_service.get_academic_year(d) == 2024


def test_can_update_academic_year_before_april(monkeypatch, session):
    _set_today(monkeypatch, 2025, 3, 31)

    can_update, message = academic_year_service.can_update_academic_year()

    assert can_update is False
    assert "年度更新は4月1日以降に実行可能です" in message


def test_can_update_academic_year_first_time_after_april(monkeypatch, session):
    _set_today(monkeypatch, 2025, 4, 1)

    # AcademicYearUpdate テーブルは空
    can_update, message = academic_year_service.can_update_academic_year()

    assert can_update is True
    assert message is None


def test_can_update_academic_year_already_updated_same_year(monkeypatch, session):
    _set_today(monkeypatch, 2025, 12, 1)

    # 2025 年度は既に更新済み
    session.add(AcademicYearUpdate(academic_year=2025))
    session.commit()

    can_update, message = academic_year_service.can_update_academic_year()

    assert can_update is False
    assert "2025年度の更新は既に実行済みです" in message


def test_execute_academic_year_update_updates_grades_and_status(monkeypatch, session):
    _set_today(monkeypatch, 2025, 4, 1)

    # Students データ準備
    s1 = Students(
        student_id=1,
        name="高3在籍",
        name_kana="コウサンザイセキ",
        school_name="テスト高校",
        grade="高3",
        admission_date=date(2023, 4, 1),
        status="在籍",
    )
    s2 = Students(
        student_id=2,
        name="高3退会",
        name_kana="コウサンタイカイ",
        school_name="テスト高校",
        grade="高3",
        admission_date=date(2023, 4, 1),
        status="退会",
    )
    s3 = Students(
        student_id=3,
        name="高2在籍",
        name_kana="コウニザイセキ",
        school_name="テスト高校",
        grade="高2",
        admission_date=date(2024, 4, 1),
        status="在籍",
    )
    s4 = Students(
        student_id=4,
        name="既卒その他",
        name_kana="キソツソノタ",
        school_name="テスト高校",
        grade="高1",
        admission_date=date(2024, 4, 1),
        status="既卒",
    )

    session.add_all([s1, s2, s3, s4])
    session.commit()

    result = academic_year_service.execute_academic_year_update()

    session.refresh(s1)
    session.refresh(s2)
    session.refresh(s3)
    session.refresh(s4)

    # 高3在籍 → 既卒 + ステータス既卒
    assert s1.grade == "既卒"
    assert s1.status == "既卒"

    # 高3退会 → 更新対象外
    assert s2.grade == "高3"
    assert s2.status == "退会"

    # 高2在籍 → 高3
    assert s3.grade == "高3"
    assert s3.status == "在籍"

    # grade がマッピング対象（高1）であれば、status が既卒でも学年だけは1つ上がる
    assert s4.grade == "高2"
    assert s4.status == "既卒"

    # 戻り値（学年が変わった人数 = s1, s3, s4 / 卒業 = s1）
    assert result["updated"] == 3  # s1, s3, s4
    assert result["graduated"] == 1  # s1
    assert result["academic_year"] == 2025

    # AcademicYearUpdate が記録されていること
    record = session.query(AcademicYearUpdate).filter_by(academic_year=2025).first()
    assert record is not None


def test_execute_academic_year_update_raises_before_april(monkeypatch, session):
    _set_today(monkeypatch, 2025, 3, 31)

    # 生徒が存在していても 3 月中は実行不可
    s = Students(
        student_id=1,
        name="テスト",
        name_kana="テスト",
        school_name="テスト高校",
        grade="高3",
        admission_date=date(2023, 4, 1),
        status="在籍",
    )
    session.add(s)
    session.commit()

    with pytest.raises(ValueError) as excinfo:
        academic_year_service.execute_academic_year_update()

    assert "年度更新は4月1日以降に実行可能です" in str(excinfo.value)

    # ロールバックされていることを確認（学年は変わらない）
    session.refresh(s)
    assert s.grade == "高3"


