# バックエンド単体テスト仕様書

## 1. 概要

- 対象プロジェクト: `ManavisGradesApp` バックエンド（Flask + SQLAlchemy）
- テストレベル: 単体テスト（主に services 層、必要に応じて routes 層）
- 使用ツール: `pytest`
- 目的:
  - 年度更新や成績集計など、ビジネスロジックが壊れていないことを自動で確認する
  - 仕様変更やリファクタリング時のリグレッション防止

---

## 2. テスト対象範囲

### 2.1 優先度 A（必須でテストを書く）

- `flaskr/services/academic_year_service.py`
  - `get_academic_year`
  - `get_last_update_year`（必要に応じて）
  - `can_update_academic_year`
  - `execute_academic_year_update`
- `flaskr/services/students_service.py`
  - `search_students`
  - `get_student_detail`
- `flaskr/services/exam_service.py`
  - `list_years`
  - `list_exam_types`
  - `list_exam_names`
  - `search_exams`
  - `filter_exam_results`

### 2.2 優先度 B（余裕があればテストを書く）

- `flaskr/services/import_service.py`
- `routes` 層の簡易 API テスト
  - 各 Blueprint の代表的なエンドポイントについて 200/400/404 の確認

---

## 3. テスト環境

- ディレクトリ構成（想定）:

  ```text
  backend/
    flaskr/
      services/
      routes/
      models.py
    tests/
      conftest.py
      services/
        test_academic_year_service.py
        test_students_service.py
        test_exam_service.py
      routes/
        test_students_routes.py
        test_exams_routes.py
  ```

- テスト DB:
  - SQLite（インメモリ）またはテスト用 PostgreSQL を利用
  - `conftest.py` にテスト用アプリケーションコンテキスト／DB セッション用の fixture を定義し、各テストでクリーンな状態を用意する
- 日付依存ロジック:
  - `academic_year_service` 内の `date.today()` 呼び出しは pytest の monkeypatch 等でモックしてテストする

---

## 4. `academic_year_service` 単体テスト仕様

### 4.1 `get_academic_year(target_date=None)`

**目的**  
指定された日付から、想定どおりの「年度」が算出されることを確認する。

| テストID | 前提条件 | 入力 (`target_date`) | 期待結果 | 備考 |
|---------|----------|----------------------|----------|------|
| AY-001  | なし     | 2025-04-01          | 2025     | 4月1日ちょうどは翌年度開始 |
| AY-002  | なし     | 2025-03-31          | 2024     | 3月末は前年度扱い |
| AY-003  | なし     | 2025-12-31          | 2025     | 年末でも年度は変わらない |
| AY-004  | なし     | 2026-01-01          | 2025     | 翌年1〜3月は前年度扱い |

※ 実装上 `target_date=None` の場合は `date.today()` が利用されるため、単体テストでは明示的に `target_date` を指定する。

---

### 4.2 `can_update_academic_year()`

**目的**  
年度更新の実行可否判定ロジックが仕様どおりに動作することを確認する。

- 4 月 1 日以降でないと実行不可
- 同じ年度内では 1 回のみ実行可能

**前提**  
`AcademicYearUpdate` テーブルが適切にマイグレーションされていること。

| テストID | 前提条件 | モック日付 | テーブル状態 | 期待結果 (`can_update`, `error_message`) |
|---------|----------|-----------|--------------|-----------------------------------------|
| AY-101  | なし     | 2025-03-31 | `AcademicYearUpdate` 空 | `(False, "年度更新は4月1日以降に実行可能です（現在: 3月）")` を含むエラーメッセージ |
| AY-102  | なし     | 2025-04-01 | `AcademicYearUpdate` 空 | `(True, None)` |
| AY-103  | 2024 年度に 1 回実行済 | 2025-04-01 | `AcademicYearUpdate(academic_year=2024)` のみ | `(True, None)` |
| AY-104  | 2025 年度に既に実行済 | 2025-12-01 | `AcademicYearUpdate(academic_year=2025)` のみ | `(False, "2025年度の更新は既に実行済みです…")` |

---

### 4.3 `execute_academic_year_update()`

**目的**  
年度更新処理において、学年およびステータスが正しく更新され、更新履歴が記録されることを確認する。

**共通前提データ（Students テーブル）**

- `S1`: `grade="高3"`, `status="在籍"`
- `S2`: `grade="高3"`, `status="退会"`
- `S3`: `grade="高2"`, `status="在籍"`
- `S4`: `grade="高1"`, `status="既卒"`（特殊ケース）

`AcademicYearUpdate` テーブルはテストごとにリセットする。

| テストID | モック日付 | 事前テーブル状態 | 期待される DB 更新内容 | 期待される戻り値 |
|---------|-----------|------------------|------------------------|------------------|
| AY-201  | 2025-04-01 | `AcademicYearUpdate` 空 | - `S1`: `grade="既卒"`, `status="既卒"` に更新（卒業1、更新1）<br>- `S2`: `status="退会"` のため変更なし<br>- `S3`: `grade="高3"` に更新（更新1）<br>- `S4`: 変更なし<br>- `AcademicYearUpdate(academic_year=2025)` が新規作成される | `{"updated": 2, "graduated": 1, "academic_year": 2025}` |
| AY-202  | 2025-04-01 | 既に `AcademicYearUpdate(2025)` が存在 | 生徒更新は AY-201 と同様<br>`AcademicYearUpdate(2025).updated_at` が上書きされる | `updated`, `graduated`, `academic_year` は AY-201 と同一 |
| AY-203  | 2025-03-31 | 任意 | `can_update_academic_year()` が False を返し、`ValueError` が送出される。DB の生徒データおよび `AcademicYearUpdate` が変更されていないことを確認 | `ValueError` 例外発生 |

---

## 5. `students_service` 単体テスト仕様

### 5.1 `search_students(keyword=None, statuses=None)`

**目的**  
生徒検索におけるキーワード・ステータスフィルタが正しく適用されることを確認する。

**前提データ（Students テーブル例）**

- `S1`: `student_id=1001`, `name="山田太郎"`, `name_kana="ヤマダタロウ"`, `school_name="東京高校"`, `grade="高2"`, `status="在籍"`
- `S2`: `student_id=1002`, `name="山本花子"`, `name_kana="ヤマモトハナコ"`, `school_name="大阪高校"`, `grade="高3"`, `status="既卒"`
- `S3`: `student_id=2001`, `name="佐藤次郎"`, `name_kana=None`, `school_name="東京高校"`, `grade="高1"`, `status="退会"`

| テストID | 入力 (`keyword`, `statuses`) | 期待される `student_id` 一覧 | 観点 |
|---------|------------------------------|-------------------------------|------|
| ST-101  | `(None, None)`              | `[1001, 1002, 2001]`          | フィルタ無しで全件取得、ID 昇順 |
| ST-102  | `("山田", None)`            | `[1001]`                      | 名前部分一致 |
| ST-103  | `("東京", None)`            | `[1001, 2001]`                | 学校名部分一致 |
| ST-104  | `("1001", None)`           | `[1001]`                      | `student_id` の文字列部分一致 |
| ST-105  | `(None, ["在籍"])`         | `[1001]`                      | ステータスフィルタ（在籍） |
| ST-106  | `("東京", ["在籍", "既卒"])` | `[1001]`                     | 学校名 + ステータス複合条件 |

戻り値の各要素について、以下のキーが存在し値が設定されていることも併せて確認する:

- `student_id`, `name`, `name_kana`, `school_name`, `grade`, `status`

---

### 5.2 `get_student_detail(student_id)`

**目的**  
生徒詳細において、模試・志望校・科目スコアが正しくネストされた構造で返されることを確認する。

**前提データ（例）**

- `Students`: 1 名
- `Exams`, `ExamResults`, `ExamMaster`: その生徒が受験した模試 1 件
- `ExamJudgements`, `Departments`, `Faculties`, `Universities`: 志望校情報 1 件
- `SubjectScores`, `SubjectMaster`: 科目スコア 2 件

| テストID | 入力 | 期待結果（概要） |
|---------|------|------------------|
| ST-201  | 既存の `student_id` | 戻り値は dict であり、`student_id`, `name`, `school_name`, `grade`, `status`, `admission_date` が正しいこと。`exams` が配列で、各要素に `exam_name`, `exam_year`, `exam_type` が含まれること。`judgements` 配列の各要素に `university_name`, `faculty_name`, `department_name`, 各判定 (`judgement_kyote`, `judgement_niji`, `judgement_sougou`) が含まれること。`scores` 配列の各要素に `subject_code`, `subject_name`, `score`, `deviation_value` が含まれること。 |
| ST-202  | 存在しない `student_id` | 戻り値が `None` であること。 |

---

## 6. `exam_service` 単体テスト仕様（概要）

### 6.1 `list_years()`

**目的**  
存在する模試の年度一覧を、重複無しかつ降順で取得できること。

- 前提:
  - `Exams.exam_year` に `2023, 2024, 2024, 2025` などが存在する。
- 期待結果:
  - 戻り値が `[2025, 2024, 2023]` となる。

### 6.2 `list_exam_types(year=None)`

**目的**  
指定された年度に存在する模試種別（例: 共テ / 記述）が重複無しで取得できること。

- 年度指定なしの場合: 全年度を対象に distinct で一覧を取得
- 年度指定ありの場合: 指定年度に絞り込んだ上で distinct 取得

### 6.3 `list_exam_names(year=None, exam_type=None)`

**目的**  
年度および模試種別でフィルタした上で、模試名一覧を取得できること。

- 前提:
  - `ExamMaster.exam_name` と `Exams` の関連が適切に張られていること。
- 期待結果:
  - 戻り値が重複無しの模試名リストであり、ソート順が仕様どおり（五十音順）であること。

### 6.4 `search_exams(year=None, exam_type=None, exam_name=None)`

**目的**  
年度・模試種別・模試名で一覧検索した結果が正しいことを確認する。

主な観点:

- 条件に応じて `Exams` + `ExamMaster` が正しく絞り込まれること
- 各要素に以下の情報が含まれること:
  - `exam_id`, `exam_year`, `exam_type`, `exam_name`
  - `num_students`: 対応する `ExamResults` 件数と一致すること
  - `link`: `/api/exams/<exam_id>` 形式で生成されていること

### 6.5 `filter_exam_results(...)`

**目的**  
模試結果の詳細一覧に対して、さまざまなフィルタ条件とソート条件が仕様どおりに適用されることを確認する。

主な観点:

- 生徒名 (`name`) による部分一致フィルタ
- 大学名 (`university`)／大学 ID (`university_id`)／難関 10 大フラグ (`include_top_universities`) によるフィルタ
- 学部名 (`faculty`) による部分一致フィルタ
- 志望順位 (`order_min`, `order_max`) 範囲によるフィルタ
- 大学フィルタが指定されている場合に、**最小志望順位**およびその中での**最良判定**でソートされること
- 戻り値の各行に「第1志望〜第N志望」の列が生成され、最大順位または 5 までの列が存在すること

---

## 7. エビデンスの扱い

- ローカル実行時:
  - `pytest -q` の実行ログを残す。
- CI 導入時:
  - GitHub Actions 等でテストを自動実行し、テスト結果をアーティファクト（JUnit XML 等）として保存することで、どのテスト ID がいつ通ったかを追跡可能にする。


