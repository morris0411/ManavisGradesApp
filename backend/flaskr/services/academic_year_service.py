from datetime import date, datetime
from .. import db
from ..models import Students, AcademicYearUpdate

def get_academic_year(target_date=None):
    """
    年度を取得（4月1日を基準）
    例: 2025年4月1日〜2026年3月31日 → 2025年度
    """
    if target_date is None:
        target_date = date.today()
    
    if target_date.month >= 4:
        return target_date.year
    else:
        return target_date.year - 1


def get_last_update_year():
    """
    前回の年度更新が実行された年度を取得
    """
    try:
        # 最新の更新年度を取得（academic_yearの降順でソート）
        last_update = AcademicYearUpdate.query.order_by(AcademicYearUpdate.academic_year.desc()).first()
        if last_update:
            return last_update.academic_year
        return None
    except Exception:
        # テーブルが存在しない場合はNoneを返す
        return None


def can_update_academic_year():
    """
    年度更新が実行可能かどうかを判定
    - 4月1日以降のみ実行可能
    - 同じ年度内では1回のみ実行可能
    """
    current_date = date.today()
    current_year = get_academic_year(current_date)
    
    # 4月1日以降でないと実行不可
    if current_date.month < 4:
        return False, f"年度更新は4月1日以降に実行可能です（現在: {current_date.month}月）"
    
    # テーブルが存在しない場合のエラーハンドリング
    try:
        last_update_year = get_last_update_year()
    except Exception:
        # テーブルが存在しない場合は、4月1日以降なら実行可能
        return True, None
    
    # 前回更新がない、または前回更新が前年度以前なら実行可能
    if last_update_year is None:
        return True, None
    
    if last_update_year < current_year:
        return True, None
    
    # 同じ年度内で既に更新済み
    return False, f"{current_year}年度の更新は既に実行済みです（最終更新: {last_update_year}年度）"


def execute_academic_year_update():
    """
    年度更新処理を実行
    """
    # 実行可能かチェック
    can_update, error_message = can_update_academic_year()
    if not can_update:
        raise ValueError(error_message)
    
    # 学年の更新マッピング
    grade_map = {
        "中3": "高1",
        "高1": "高2",
        "高2": "高3",
    }
    
    updated_count = 0
    graduated_count = 0
    
    # 退会者以外の全生徒を取得
    students = Students.query.filter(Students.status != "退会").all()
    
    for student in students:
        current_grade = student.grade
        
        # 高3生は既卒に
        if current_grade == "高3":
            if student.status == "在籍":
                student.grade = "既卒"
                student.status = "既卒"
                graduated_count += 1
                updated_count += 1
        # その他の学年は1つ上げる
        elif current_grade in grade_map:
            student.grade = grade_map[current_grade]
            updated_count += 1
        # 既卒やその他の学年はそのまま
    
    # 更新日時を記録
    now = datetime.utcnow()
    current_year = get_academic_year()
    
    # 現在の年度の更新レコードを取得または作成
    update_record = AcademicYearUpdate.query.filter_by(academic_year=current_year).first()
    if update_record:
        update_record.updated_at = now
    else:
        update_record = AcademicYearUpdate(
            academic_year=current_year,
            updated_at=now
        )
        db.session.add(update_record)
    
    db.session.commit()
    
    return {
        "updated": updated_count,
        "graduated": graduated_count,
        "academic_year": get_academic_year()
    }
