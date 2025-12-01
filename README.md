<div id="top"></div>

## 使用技術一覧

<!-- シールド一覧 -->
<p style="display: inline">
  <!-- フロントエンドのフレームワーク一覧 -->
  <img src="https://img.shields.io/badge/-Node.js-339933.svg?logo=node.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img src="https://img.shields.io/badge/-Vite-646CFF.svg?logo=vite&style=for-the-badge">
  <img src="https://img.shields.io/badge/-TailwindCSS-38B2AC.svg?logo=tailwindcss&style=for-the-badge">
  <!-- バックエンドのフレームワーク一覧 -->
  <img src="https://img.shields.io/badge/-Flask-000000.svg?logo=flask&style=for-the-badge">
  <!-- バックエンドの言語一覧 -->
  <img src="https://img.shields.io/badge/-Python-3776AB.svg?logo=python&style=for-the-badge">
  <!-- ミドルウェア一覧 -->
  <img src="https://img.shields.io/badge/-PostgreSQL-316192.svg?logo=postgresql&style=for-the-badge">
  <img src="https://img.shields.io/badge/-Gunicorn-199848.svg?logo=gunicorn&style=for-the-badge&logoColor=white">
</p>

## 目次

1. [プロジェクトについて](#プロジェクトについて)
2. [環境](#環境)
3. [データベース構成](#データベース構成)
4. [ディレクトリ構成](#ディレクトリ構成)
5. [開発環境構築](#開発環境構築)
6. [トラブルシューティング](#トラブルシューティング)

<br />

## プロジェクト名

河合塾マナビス 全統模試管理システム

## プロジェクトについて

本アプリケーションは、河合塾マナビスの全統模試の成績を管理するためのWebアプリケーションです。学生情報と試験結果の検索、データのインポート、成績の可視化などの機能を提供します。

### 主な機能

- **認証機能**: ログイン/ログアウト、JWT トークンベースの認証、管理者による新規ユーザー登録
- **学生管理**: 学生情報の検索、学生詳細情報の表示、学生データの一括インポート（CSV形式）
- **試験管理**: 試験結果の検索、試験詳細情報の表示、成績の可視化（グラフ表示）、PDFエクスポート機能
- **データインポート**: 学生データのインポート（CSV形式）、試験データのインポート（Excel形式）、学年更新機能
- **ユーザー管理**: 管理者による新規ユーザーアカウントの作成

<p align="right">(<a href="#top">トップへ</a>)</p>

## 環境

<!-- 言語、フレームワーク、ミドルウェア、インフラの一覧とバージョンを記載 -->

| 言語・フレームワーク | バージョン |
| --------------------- | ---------- |
| Python                | 3.10以上   |
| Flask                 | 3.0.0      |
| SQLAlchemy            | 2.0.36     |
| PostgreSQL            | 12以上     |
| Node.js               | 18以上     |
| React                 | 19.1.1     |
| Vite                  | 7.1.7      |
| Tailwind CSS          | 4.1.17     |

その他のパッケージのバージョンは `backend/requirements.txt` と `frontend/package.json` を参照してください

<p align="right">(<a href="#top">トップへ</a>)</p>

## データベース構成

### ER図

```mermaid
erDiagram
    Students ||--o{ ExamResults : "受験"
    ExamMaster ||--o{ Exams : "試験定義"
    Exams ||--o{ ExamResults : "試験実施"
    ExamResults ||--o{ SubjectScores : "科目スコア"
    ExamResults ||--o{ ExamJudgements : "判定"
    SubjectMaster ||--o{ SubjectScores : "科目"
    Universities ||--o{ Faculties : "学部"
    Faculties ||--o{ Departments : "学科"
    Departments ||--o{ ExamJudgements : "志望"

    Students {
        int student_id PK
        string name
        string name_kana
        string school_name
        string grade
        date admission_date
        string status
    }

    ExamMaster {
        int exam_code PK
        string exam_name UK
        int sort_key
    }

    Exams {
        int exam_id PK
        int exam_code FK
        int exam_year
        string exam_type
    }

    ExamResults {
        int result_id PK
        int student_id FK
        int exam_id FK
    }

    SubjectMaster {
        int subject_code PK
        string subject_name
    }

    SubjectScores {
        int score_id PK
        int result_id FK
        int subject_code FK
        int score
        numeric deviation_value
    }

    Universities {
        int university_id PK
        string university_name UK
    }

    Faculties {
        int faculty_id PK
        int university_id FK
        string faculty_name
    }

    Departments {
        int department_id PK
        int faculty_id FK
        string department_name
    }

    ExamJudgements {
        int judgement_id PK
        int result_id FK
        int preference_order
        int department_id FK
        string judgement_kyote
        string judgement_niji
        string judgement_sougou
    }

    Users {
        int user_id PK
        string login_id UK
        string password_hash
        boolean is_admin
    }

    AcademicYearUpdate {
        int academic_year PK
        datetime updated_at
    }
```

### テーブル構成

#### 学生関連

**students（学生）**
- 学生の基本情報を管理
- `student_id`: マナビス生番号（主キー）
- `status`: 在籍状況（在籍/退会/既卒）

#### 試験関連

**exam_master（試験マスタ）**
- 試験の基本情報を管理
- `exam_code`: 試験コード（主キー）
- `sort_key`: 開催順序

**exams（試験）**
- 年度・種別ごとの試験を管理
- `exam_code`: 試験マスタへの外部キー
- `exam_type`: 試験種別（共テ/高1/高2/記述/OP）

**exam_results（試験結果）**
- 学生と試験の紐付け
- 学生が受験した試験を記録

#### 成績関連

**subject_master（科目マスタ）**
- 科目の基本情報を管理

**subject_scores（科目スコア）**
- 各科目の得点と偏差値を管理
- `result_id`: 試験結果への外部キー
- `subject_code`: 科目マスタへの外部キー

#### 大学・判定関連

**universities（大学）**
- 大学の基本情報を管理

**faculties（学部）**
- 学部の基本情報を管理
- `university_id`: 大学への外部キー

**departments（学科）**
- 学科の基本情報を管理
- `faculty_id`: 学部への外部キー

**exam_judgements（判定）**
- 志望校判定を管理（最大9つまで）
- `result_id`: 試験結果への外部キー
- `preference_order`: 志望順位（1-9）
- `department_id`: 学科への外部キー
- `judgement_kyote`: 共通テスト判定
- `judgement_niji`: 二次判定
- `judgement_sougou`: 総合判定

#### システム関連

**users（ユーザー）**
- システム利用者の認証情報を管理
- `login_id`: ログインID（ユニーク）
- `password_hash`: ハッシュ化されたパスワード
- `is_admin`: 管理者フラグ

**academic_year_updates（年度更新履歴）**
- 年度更新の実行履歴を管理
- `academic_year`: 更新された年度（主キー）
- `updated_at`: 更新日時

### 主要なリレーション

1. **学生 → 試験結果**: 1対多（1人の学生は複数の試験を受験可能）
2. **試験 → 試験結果**: 1対多（1つの試験は複数の学生が受験可能）
3. **試験結果 → 科目スコア**: 1対多（1つの試験結果に複数の科目スコア）
4. **試験結果 → 判定**: 1対多（1つの試験結果に最大9つの判定）
5. **大学 → 学部 → 学科**: 階層構造（1対多の関係）

### データの流れ

1. **学生データのインポート**: CSVファイルから`students`テーブルに学生情報を登録
2. **試験データのインポート**: Excelファイルから以下を一括登録
   - `exams`: 試験情報
   - `exam_results`: 学生と試験の紐付け
   - `subject_scores`: 科目スコア
   - `exam_judgements`: 志望校判定
   - `universities`, `faculties`, `departments`: 大学・学部・学科マスタ（必要に応じて自動作成）

<p align="right">(<a href="#top">トップへ</a>)</p>

## ディレクトリ構成

<!-- Treeコマンドを使ってディレクトリ構成を記載 -->

```
ManavisGradesApp/
├── .gitignore
├── README.md
├── backend/
│   ├── flaskr/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── students.py
│   │   │   ├── exams.py
│   │   │   └── imports.py
│   │   │   └── seed.py  # 開発環境でのみ有効
│   │   ├── services/
│   │   │   ├── academic_year_service.py
│   │   │   ├── exam_service.py
│   │   │   ├── import_service.py
│   │   │   └── students_service.py
│   │   ├── models.py
│   │   └── __init__.py
│   ├── migrations/
│   │   ├── versions/
│   │   ├── alembic.ini
│   │   └── env.py
│   ├── data/
│   │   ├── subject_master.csv
│   │   └── test_data/
│   │       └── テスト用.xlsx
│   ├── gunicorn_config.py
│   ├── wsgi.py
│   ├── build.sh
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── auth.jsx
    │   │   ├── axiosClient.jsx
    │   │   ├── exams.jsx
    │   │   ├── imports.jsx
    │   │   └── students.jsx
    │   ├── components/
    │   │   ├── features/
    │   │   │   ├── dashboard/
    │   │   │   │   ├── tabs/
    │   │   │   │   └── dashboard.tsx
    │   │   │   └── university/
    │   │   │       └── university-judgment.tsx
    │   │   ├── layout/
    │   │   │   ├── Breadcrumb.tsx
    │   │   │   └── header.tsx
    │   │   ├── shared/
    │   │   └── ui/
    │   ├── pages/
    │   │   ├── Admin/
    │   │   ├── Auth/
    │   │   ├── Exams/
    │   │   ├── Home/
    │   │   └── Students/
    │   ├── hooks/
    │   ├── utils/
    │   ├── App.jsx
    │   └── main.jsx
    ├── public/
    ├── package.json
    ├── vite.config.js
    ├── jsconfig.json
    └── eslint.config.js
```

<p align="right">(<a href="#top">トップへ</a>)</p>

## 開発環境構築

### 前提条件

- Python 3.10以上
- Node.js 18以上
- PostgreSQL 12以上
- pip（Pythonパッケージマネージャー）
- npm（Node.jsパッケージマネージャー）

### バックエンドのセットアップ

#### 1. ディレクトリに移動

```bash
cd backend
```

#### 2. 仮想環境の作成と有効化

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### 3. 依存関係のインストール

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

#### 4. 環境変数の設定

`backend/.env`ファイルを作成し、以下の環境変数を設定します。

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
JWT_SECRET_KEY=your-secret-key-here
```

#### 5. データベースの準備

PostgreSQLデータベースを作成します。

```bash
# PostgreSQLに接続
psql -U postgres

# データベースを作成
CREATE DATABASE dbname;
\q
```

#### 6. データベースマイグレーションの実行

```bash
# Flaskアプリケーションのパスを設定（初回のみ）
export FLASK_APP=wsgi:app

# マイグレーションの適用
flask db upgrade
```

#### 7. 開発サーバーの起動

```bash
# 開発モード（デバッグ有効）
python wsgi.py

# または、本番モード（Gunicorn）
gunicorn -c gunicorn_config.py wsgi:app
```

バックエンドはデフォルトでポート10000で起動します。

### フロントエンドのセットアップ

#### 1. ディレクトリに移動

```bash
cd frontend
```

#### 2. 依存関係のインストール

```bash
npm install
```

#### 3. 環境変数の設定（オプション）

ローカル開発環境で使用する場合、`frontend/.env.local`ファイルを作成してAPIのベースURLを設定できます。

```bash
# frontend/.env.local
VITE_API_BASE_URL=http://localhost:10000/api
```

**注意**: 
- `.env.local`ファイルは`.gitignore`に含まれているため、バージョン管理に含まれません
- 環境変数を設定しない場合、デフォルトで`http://localhost:10000/api`が使用されます
- 本番環境では、ビルド時に環境変数を設定してください

#### 4. 開発サーバーの起動

```bash
npm run dev
```

フロントエンドはデフォルトで`http://localhost:5173`で起動します。

### 動作確認

- バックエンド: `http://localhost:10000` にアクセスできるか確認
- フロントエンド: `http://localhost:5173` にアクセスできるか確認

アクセスできたら成功です。

### 環境変数の一覧

#### バックエンド（`backend/.env`）

| 変数名          | 役割                                                         | 必須 | デフォルト値                           | 例                                           |
| --------------- | ------------------------------------------------------------ | ---- | -------------------------------------- | -------------------------------------------- |
| DATABASE_URL    | PostgreSQLデータベース接続URL                                | ✅   | なし                                   | `postgresql://username:password@localhost:5432/dbname` |
| JWT_SECRET_KEY  | JWTトークンの署名に使用する秘密鍵                            | ✅   | `your-secret-key-change-in-production` | 本番環境では強力なランダム文字列を推奨       |

**注意**: 
- `.env`ファイルはバージョン管理に含めないでください（`.gitignore`に追加済み）
- `postgres://`で始まるURLは自動的に`postgresql+psycopg2://`に変換されます
- `DATABASE_URL`が未設定の場合、アプリケーション起動時にエラーが発生します

#### フロントエンド（`frontend/.env.local`）

| 変数名            | 役割                                    | 必須 | デフォルト値                    | 例                                           |
| ----------------- | --------------------------------------- | ---- | ------------------------------- | -------------------------------------------- |
| VITE_API_BASE_URL | APIのベースURL                          | ❌   | `http://localhost:10000/api`    | `https://manavisgradesapp.onrender.com/api`  |

**注意**:
- `.env.local`ファイルはバージョン管理に含めません（`.gitignore`に追加済み）
- 環境変数を設定しない場合、デフォルトでローカル開発環境のURLが使用されます
- 本番環境では、ビルド時に環境変数を設定してください

### コマンド一覧

#### バックエンド

| コマンド                                      | 実行する処理                           |
| --------------------------------------------- | -------------------------------------- |
| `python wsgi.py`                              | 開発サーバーを起動（デバッグモード）   |
| `gunicorn -c gunicorn_config.py wsgi:app`     | 本番サーバーを起動（Gunicorn）         |
| `flask db migrate -m "説明"`                   | 新しいマイグレーションファイルを作成   |
| `flask db upgrade`                            | データベースマイグレーションを適用     |
| `flask db downgrade`                          | データベースマイグレーションを1つ戻す   |
| `pip install -r requirements.txt`             | 依存関係をインストール                 |
| `pip install --upgrade pip setuptools wheel`  | pipとビルドツールをアップグレード     |
| `bash build.sh`                               | ビルドスクリプトを実行（依存関係インストール + マイグレーション） |
| `python create_admin.py <login_id> <password>` | 管理者アカウントを作成                 |

#### フロントエンド

| コマンド           | 実行する処理                           |
| ------------------ | -------------------------------------- |
| `npm install`      | 依存関係をインストール                 |
| `npm run dev`      | 開発サーバーを起動                     |
| `npm run build`    | 本番用ビルドを作成                     |
| `npm run preview` | ビルドしたアプリケーションをプレビュー |
| `npm run lint`     | ESLintでコードをチェック               |

<p align="right">(<a href="#top">トップへ</a>)</p>

## トラブルシューティング

### .env: no such file or directory

`.env`ファイルがないので環境変数の一覧を参考に作成しましょう。

`backend/.env`ファイルを作成し、以下の環境変数を設定してください。

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
JWT_SECRET_KEY=your-secret-key-here
```

### DATABASE_URL が未設定です

**原因**: `.env`ファイルが存在しない、または`DATABASE_URL`が設定されていない

**解決方法**:
1. `backend/.env`ファイルが存在することを確認
2. `DATABASE_URL`が正しく設定されていることを確認
3. ファイルのパスが`backend/.env`であることを確認（`backend`ディレクトリ直下）

### psycopg2 のインストールに失敗する

**原因**: PostgreSQLの開発ライブラリがインストールされていない

**解決方法**:
- **Windows**: PostgreSQLのインストーラーから開発ツールをインストール
- **Linux (Ubuntu/Debian)**: `sudo apt-get install libpq-dev python3-dev`
- **Mac**: `brew install postgresql`

### Ports are not available: address already in use

別のコンテナもしくはローカル上ですでに使っているポートがある可能性があります。

**解決方法**:
1. ポート10000（バックエンド）が使用されていないか確認:
   - Linux/Mac: `netstat -an | grep 10000`
   - Windows: `netstat -an | findstr 10000`
2. ポート5173（フロントエンド）が使用されていないか確認:
   - Linux/Mac: `netstat -an | grep 5173`
   - Windows: `netstat -an | findstr 5173`
3. 使用しているプロセスを終了するか、別のポートを使用する

### マイグレーションが適用できない

**原因**: データベースが存在しない、または接続できない

**解決方法**:
1. PostgreSQLが起動していることを確認
2. データベースが作成されていることを確認
3. `DATABASE_URL`の接続情報が正しいことを確認
4. ユーザーに適切な権限があることを確認

### Module not found

依存関係がインストールされていない可能性があります。

**解決方法**:
- バックエンド: `pip install -r requirements.txt`
- フロントエンド: `npm install`

### npm install が失敗する

**原因**: Node.jsのバージョンが古い、またはネットワークの問題

**解決方法**:
1. Node.jsのバージョンを確認: `node --version`（18以上が必要）
2. npmキャッシュをクリア: `npm cache clean --force`
3. `package-lock.json`を削除して再インストール: `rm package-lock.json && npm install`

### APIリクエストが失敗する（CORSエラー）

**原因**: バックエンドのCORS設定が不適切、またはバックエンドが起動していない

**解決方法**:
1. バックエンドが起動していることを確認
2. `backend/flaskr/__init__.py`のCORS設定を確認
3. フロントエンドのAPI URLが正しいことを確認（`src/api/axiosClient.jsx`）

### ビルドが失敗する

**原因**: 依存関係の問題、またはESLintエラー

**解決方法**:
1. `npm run lint`でエラーを確認
2. 依存関係を再インストール: `rm -rf node_modules package-lock.json && npm install`
3. エラーメッセージを確認して個別に対応

### マイグレーションの競合が発生する

**原因**: 複数のブランチで同時にマイグレーションを作成した

**解決方法**:
1. 競合しているマイグレーションファイルを確認
2. `flask db merge`コマンドでマージマイグレーションを作成
3. 必要に応じて手動でマイグレーションファイルを編集

### データベース接続がタイムアウトする

**原因**: データベースサーバーが応答しない、またはネットワークの問題

**解決方法**:
1. PostgreSQLが起動していることを確認
2. ファイアウォールの設定を確認
3. `DATABASE_URL`のホスト名とポートが正しいことを確認

<p align="right">(<a href="#top">トップへ</a>)</p>

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録（管理者のみ、認証必須）
- `POST /api/auth/login` - ログイン
- `GET /api/auth/me` - 現在のユーザー情報取得（認証必須）
- `GET /api/auth/verify` - トークンの有効性検証（認証必須）

### 学生
- `GET /api/students/search` - 学生検索（クエリパラメータ: `q`, `status[]`）
- `GET /api/students/:id` - 学生詳細取得

### 試験
- `GET /api/exams/years` - 年度一覧取得
- `GET /api/exams/types` - 試験種別一覧取得（クエリパラメータ: `year`）
- `GET /api/exams/names` - 試験名一覧取得（クエリパラメータ: `year`, `exam_type`）
- `GET /api/exams/search` - 試験検索（クエリパラメータ: `year`, `exam_type`, `name`）
- `GET /api/exams/:id` - 試験詳細取得
- `GET /api/exams/filter` - 試験結果フィルタリング（クエリパラメータ: `exam_id`, `name`, `university`, `university_id`, `faculty`, `order_min`, `order_max`, `include_top_universities`）
- `GET /api/exams/universities/top` - 主要大学一覧取得

### インポート
- `POST /api/imports/students` - 学生データインポート（CSV形式）
- `POST /api/imports/exams_xlsx` - 試験データインポート（Excel形式）
- `GET /api/imports/academic_year_status` - 年度更新の状態取得
- `POST /api/imports/update_academic_year` - 年度更新実行

## 注意事項

- 本番環境では必ず`JWT_SECRET_KEY`を安全な値に変更してください
- データベース接続情報は環境変数で管理し、`.env`ファイルをバージョン管理に含めないでください
- 本番環境では適切なCORS設定を行ってください
- 年度更新機能は4月1日以降のみ実行可能で、同じ年度内では1回のみ実行できます
- 試験データのインポート時、同じ年度・模試コードの組み合わせが既に存在する場合はエラーになります
- 新規ユーザー登録は管理者のみが実行可能です。最初の管理者アカウントは`backend/create_admin.py`スクリプトで作成してください
- 管理者アカウントの作成: `python create_admin.py <login_id> <password>`

## ライセンス

このプロジェクトは内部使用を目的としています。
