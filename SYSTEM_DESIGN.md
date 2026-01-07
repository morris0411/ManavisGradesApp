# システム構成図とフロー図

## 1. システム構成図 (Architecture)

React (Vite) を用いたSPA (Single Page Application) フロントエンドと、FlaskによるREST APIバックエンド、PostgreSQLデータベースからなるWebアプリケーション構成です。

### 主なコンポーネントとその役割
1.  **Client (Frontend)**: 
    - ユーザーインターフェースの描画、ルーティング、状態管理 (React useState/useEffect) を担当。
    - APIサーバーへの非同期通信 (Axios) を行い、取得したJSONデータをレンダリングします。
2.  **Server (Backend)**: 
    - Flask (Gunicorn) 上で動作し、HTTPリクエストを処理します。
    - Blueprintによる機能ごとのルーティング分割、SQLAlchemyによるDB操作、Marshmallow/手動dict変換によるJSONシリアライズを行います。
3.  **Data (Database)**: 
    - PostgreSQLを使用。リレーショナルモデルでデータを正規化して保持します。


```mermaid
graph TD
    User((ユーザー))
    subgraph Client ["クライアントサイド"]
        subgraph Frontend ["React + Vite"]
            UI["UIコンポーネント<br/>(Tailwind CSS)"]
            Router["ルーティング"]
            Auth["認証ハンドラ"]
            API["APIクライアント<br/>(Axios)"]
        end
    end
    
    subgraph Server ["サーバーサイド"]
        subgraph Backend ["Flask API"]
            App["アプリケーション・ファクトリ"]
            AuthBP["認証 Blueprint"]
            ExamBP["試験 Blueprint"]
            StudentBP["学生 Blueprint"]
            ImportBP["インポート Blueprint"]
            ORM["SQLAlchemy ORM"]
        end
        
        subgraph Data ["データ層"]
            DB[("PostgreSQL")]
        end
    end

    User -->|ブラウザ操作| UI
    UI --> Router
    Router --> Auth
    Auth --> API
    
    API -->|"HTTP Request / JSON"| App
    
    App --> AuthBP
    App --> ExamBP
    App --> StudentBP
    App --> ImportBP
    
    AuthBP --> ORM
    ExamBP --> ORM
    StudentBP --> ORM
    ImportBP --> ORM
    
    ORM -->|SQL| DB
    
    %% Data Flow
    ImportBP -.->|"CSV/Excel Upload"| DB
```

## 2. 認証フロー (Authentication Flow)

JWT (JSON Web Token) を使用したステートレスな認証フローを採用しています。
フロントエンドでは `axiosClient` インターセプターにより、LocalStorageに保存されたトークンを自動的にヘッダーに付与し、401エラー時には自動ログアウト処理を行います。

> [!WARNING]
> 現状の実装では、バックエンドの主要なエンドポイント (`/students` 等) に `@jwt_required` デコレータが適用されておらず、セキュリティ上のリスクが存在します（認証なしでアクセス可能）。将来の改修で適用必須です。

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant Client as フロントエンド (React)
    participant API as バックエンド (Flask)
    participant DB as データベース (PostgreSQL)

    %% ログインフェーズ
    Note over User, DB: ログインプロセス
    User->>Client: ログインID / パスワード入力
    Client->>API: POST /api/auth/login (JSON)
    API->>DB: ユーザー検索 (login_id)
    DB-->>API: ユーザーハッシュパスワード
    API->>API: パスワード照合 (werkzeug.security)
    
    alt 認証成功
        API-->>Client: 200 OK { token, user_info }
        Client->>Client: JWTトークンを保存<br/>(LocalStorage/State)
        Client-->>User: ダッシュボードへ遷移
    else 認証失敗
        API-->>Client: 401 Unauthorized
        Client-->>User: エラーメッセージ表示
    end

    %% API利用フェーズ
    Note over User, DB: 認証が必要なAPIリクエスト
    User->>Client: 画面操作 (例: データ取得)
    Client->>API: GET /api/resource<br/>Authorization: Bearer <TOKEN>
    API->>API: JWT署名検証 & 有効期限チェック
    
    alt 検証成功
        API->>DB: データクエリ
        DB-->>API: 結果データ
        API-->>Client: 200 OK (JSONデータ)
        Client-->>User: データを表示
    else 検証失敗 (期限切れ等)
        API-->>Client: 401 Unauthorized
        Client->>Client: トークン破棄 & ログアウト
        Client-->>User: ログイン画面へリダイレクト
    end
```

## 3. 代表ユースケース：模試成績の検索と閲覧

このシステムの中心的機能である「模試データの検索と詳細閲覧」のシーケンスです。

```mermaid
sequenceDiagram
    actor Teacher as 教師ユーザー
    participant UI as フロントエンド
    participant API as バックエンド API
    participant DB as データベース
    
    Note over Teacher, DB: 模試成績の検索・フィルタリングフロー

    %% 検索条件の取得
    Teacher->>UI: 「成績検索」ページを開く
    par マスタデータ取得
        UI->>API: GET /api/exams/years (年度一覧)
        API->>DB: SELECT DISTINCT exam_year...
        DB-->>API: Result
        API-->>UI: 年度リスト
    and
        UI->>API: GET /api/exams/types (試験種別一覧)
        API-->>UI: 種別リスト
    end
    
    Teacher->>UI: 年度 = "2024", 種別 = "記述" を選択
    UI->>API: GET /api/exams/names?year=2024&type=記述
    API->>DB: 試験マスタ検索
    DB-->>API: 試験リスト
    API-->>UI: "第1回全統記述模試" 等を表示

    %% 検索実行
    Teacher->>UI: 試験を選択して「検索」クリック
    UI->>API: GET /api/exams/filter?exam_id=...
    API->>DB: JOIN検索 (Students + ExamResults + SubjectScores + Judgements)
    Note right of API: 複数のテーブルを結合して<br/>一覧用データを構築
    DB-->>API: 検索結果セット
    API-->>UI: 成績リスト (JSON)
    UI-->>Teacher: 学生ごとの合計点・偏差値・判定一覧を表示

    %% 詳細閲覧
    Teacher->>UI: 特定の学生行をクリック
    UI->>API: GET /api/students/{id}
    API->>DB: 学生詳細情報取得
    DB-->>API: 学生データ
    UI->>API: GET /api/exams/student/{id}/history (成績推移)
    API->>DB: 過去の全成績取得
    DB-->>API: 時系列データ
    
    UI->>UI: グラフ描画 (Chart.js等)
    UI-->>Teacher: 学生詳細カルテ画面 (成績推移グラフ付き) を表示
```

## 3.2. 代表ユースケース：生徒検索と詳細閲覧 (Student Search Flow)

ユーザーが「生徒検索」画面で検索を実行し、詳細画面を表示するまでの詳細な処理フローです。

```mermaid
sequenceDiagram
    actor User as ユーザー
    participant UI as フロントエンド (React)
    participant API as バックエンド (Flask)
    participant Service as Service層
    participant DB as データベース (PostgreSQL)

    %% 検索フェーズ
    Note over User, DB: 1. 生徒検索
    User->>UI: キーワード"田中", ステータス"在籍"を入力<br/>「検索」クリック
    UI->>UI: handleSearch() 発火
    UI->>API: GET /api/students/search?q=田中&status=在籍
    Note right of UI: axiosClientがAuthヘッダー付与
    
    API->>Service: search_students(keyword, statuses)
    Service->>DB: 生成SQL実行 (ILIKE検索 + IN句)
    Note right of Service: SELECT * FROM students<br/>WHERE ...
    DB-->>Service: 生徒リスト (List[Students])
    Service-->>API: 辞書リストに変換
    API-->>UI: JSONレスポンス (生徒一覧)
    UI->>User: 検索結果テーブルを表示

    %% 詳細閲覧フェーズ
    Note over User, DB: 2. 生徒詳細閲覧
    User->>UI: 生徒(ID:1001)のリンクをクリック
    UI->>API: GET /api/students/1001
    API->>Service: get_student_detail(1001)
    
    Service->>DB: 生徒基本情報取得 (Students)
    DB-->>Service: 生徒エンティティ
    
    Service->>DB: 関連データ取得 (ExamResults + Exams)
    DB-->>Service: 模試結果リスト
    
    %% N+1問題の可視化
    loop 各模試結果に対して (N+1問題)
        Service->>DB: 判定情報取得 (ExamJudgements...)
        Service->>DB: 科目スコア取得 (SubjectScores...)
    end
    
    Service-->>API: 構造化された詳細データ (Dict)
    API-->>UI: JSONレスポンス (詳細情報)
    UI->>User: 生徒詳細画面描画
```

> [!NOTE]
> **パフォーマンス上の注意点**: 
> 1. **フルスキャン**: 名前検索は `ILIKE '%...%'` (中間一致) のためインデックスが効きにくく、データ量増加に伴い低速化する可能性があります。
> 2. **N+1問題**: 詳細取得時 (`get_student_detail`)、ループ内で都度クエリを発行しており、受験回数が多い生徒を表示する際にDB負荷が高まります。将来的な改善ポイントです。

## 4. レイヤー別責務とテスト観点

現状の `routes` / `services` 構成に基づいた各層の責務定義と、実装時のテスト観点です。

### Routes層 (`backend/flaskr/routes/`)

**責務:**
HTTPリクエストの受付、パラメータの抽出・検証、適切なServiceの呼び出し、およびJSONレスポンスの生成のみを行い、ビジネスロジックは持たない。

**テスト観点:**
- **ステータスコード:** 正常系(200 OK)、異常系(400 Bad Request, 404 Not Found, 401 Unauthorized等)が正しく返却されるか。
- **レスポンス形式:** 定義通りのJSONスキーマ（キー名、データ型）で返却されるか。
- **入力値検証:** クエリパラメータやリクエストボディの型、必須チェック、バリデーションが機能しているか。
- **Service連携:** Service層の関数が正しい引数で呼び出されているか（Serviceをモックして検証）。

### Services層 (`backend/flaskr/services/`)

**責務:**
データベースアクセス(ORM操作)、複雑な検索ロジック、データの加工・整形、およびビジネスルールの適用を担当し、HTTPには依存しない。

**テスト観点:**
- **ビジネスロジック:** フィルタリング、ソート、集計ロジックが仕様通りに動作するか。（例：特定の大学判定の優先順位計算など）
- **DB操作:** 意図したクエリが発行されているか、データが正しくCRUDされているか。
- **データ加工:** DBからの取得結果が、フロントエンドが利用しやすい形式に正しく変換されているか。
- **境界値・異常系:** データが存在しない場合、大量データの場合、不正なデータがDBに含まれる場合の挙動。

## 5. 面接対策：アーキテクチャに関する想定問答

### Q. Flask + Gunicorn の同時処理モデルについて説明してください

#### 回答（30秒バージョン：要点のみ）
Flaskは標準ではシングルスレッドの同期処理モデルですが、本番環境ではGunicornをWSGIサーバーとして前に置くことで並行処理を実現しています。Gunicornが複数のワーカープロセスを立ち上げ（preforkモデル）、各ワーカーが独立してリクエストを処理することで、同時に複数のユーザーからのアクセスを捌ける構成になっています。

#### 回答（2分バージョン：詳細・メリデメ・ボトルネック）
**仕組みの補足:**
Gunicornは「マスタープロセス」が「ワーカープロセス」を管理する構成です。マスター自体はリクエストを処理せず、フォークされた子プロセス（ワーカー）が実際にFlaskアプリケーションをロードしてリクエストを処理します。デフォルトの同期ワーカー（Sync Worker）を使用している場合、1つのワーカーは同時に1つのリクエストしか処理できません。

**Worker数を増やすメリット・デメリット:**
- **メリット:** 
  - 並行処理数（Concurrency）が向上します。
  - PythonのGIL（Global Interpreter Lock）の制約をプロセス単位で回避できるため、CPUのマルチコア性能を有効活用できます（通常 `(2 x CPUコア数) + 1` が推奨値）。
- **デメリット:** 
  - **メモリ消費量:** 各ワーカーがアプリ全体をロードするため、ワーカー数に比例してメモリ消費が増えます。
  - **DB接続数:** 各ワーカーが個別にDB接続プールを持つため、ワーカーを増やしすぎるとDBの最大接続数（max_connections）を枯渇させるリスクがあります。
  - **オーバーヘッド:** コンテキストスイッチやスケジューリングのコストが増加します。

**どこで詰まるか（ボトルネック）:**
この構成で詰まる（ブロッキングする）主なポイントは、**I/O待ち**です。
- Flaskの処理は同期的なので、DBへのクエリ実行中や外部APIへのリクエスト中は、そのワーカープロセスは完全に停止（ブロック）し、他のリクエストを処理できません。
- 全てのワーカーが重いDB検索などでブロックされていると、新しいリクエストはバックログ（待ち行列）に溜まり、最終的にタイムアウトします。
- これを解消するには、クエリのチューニングで待ち時間を減らすか、非同期ワーカー（Gevent等）への切り替え、あるいはCelery等のタスクキューによる非同期処理へのオフロードが必要です。


### Q. JWT認証の流れをHTTPリクエストレベルで説明してください

#### 回答（リクエスト/レスポンス例）

**1. ログイン（トークン発行）**
ユーザーがIDとパスワードを送信し、サーバーが検証してJWT（アクセストークン）を発行します。

- **Request:**
  ```http
  POST /api/auth/login HTTP/1.1
  Content-Type: application/json

  {
    "login_id": "teacher001",
    "password": "password123"
  }
  ```

- **Response (Success):**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "login_id": "teacher001",
      "is_admin": false
    }
  }
  ```

**2. API利用（トークン使用）**
発行されたトークンを `Authorization` ヘッダーに `Bearer <token>` の形式で付与してリクエストします。

- **Request:**
  ```http
  GET /api/students/1001 HTTP/1.1
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

- **Response (Success):**
  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json

  {
    "student_id": 1001,
    "name": "山田 太郎",
    ...
  }
  ```

### Q. 401 Unauthorized エラーが返る典型的な原因を3つ挙げてください

#### 回答
1.  **トークンの未送信 (Missing Authorization Header)**
    - クライアント側でヘッダー付与ロジックが漏れている、あるいは `Bearer ` プレフィックスの付け忘れなど。
2.  **有効期限切れ (Token Expired)**
    - JWTの `exp` (Expiration Time) クレームの日時を過ぎている場合。セキュリティのため有効期限は短く設定されることが多く、リフレッシュトークン等の再取得フローの実装漏れで発生しやすい。
3.  **署名の検証失敗 (Invalid Signature / Malformed Token)**
    - トークンが改ざんされている、サーバー側の `JWT_SECRET_KEY` が変更された（環境変数の設定ミス等）、あるいはトークン形式自体が破損している場合。

### Q. このER図とAPIから、重いJOINが起きそうな箇所を指摘し、インデックス案を提示してください

#### 回答（ボトルネック箇所と理由）
**ボトルネック候補:** `GET /api/exams/filter` (成績検索・フィルタリング)

**理由:**
このエンドポイントは検索フィルタリング機能を提供しており、以下のような**多段JOIN**が発生するため最も負荷が高くなると予想されます。
- `ExamResults` (中間テーブル/データ量多) を基点に、
- `Students` (学生情報)
- `ExamJudgements` (判定情報/レコード数＝Results×志望数)
- `Departments` -> `Faculties` -> `Universities` (マスタ参照)
これら全てを結合し、かつ `Students.name` や `Universities.university_name` などで部分一致検索(`ilike`)を行っています。データ量が増えると、フルスキャンが発生しやすく応答速度が低下する可能性が高いです。

#### 回答（インデックス提案）

パフォーマンスを改善するために、以下のインデックス追加を提案します。

1.  **外部キーへのインデックス**
    - **`exam_results(exam_id, student_id)`**:
      - 特定の試験に絞り込んで学生情報を引く処理が頻発するため有効です。
    - **`exam_judgements(result_id)`**:
      - `ExamResults` と `ExamJudgements` のJOINは、1対多でレコード数が膨大になるため、結合キーへのインデックスは必須です。

2.  **検索/ソート用インデックス**
    - **`exam_judgements(preference_order)`**:
      - 「第1志望のみ」等の絞り込みや、志望順位でのソートに使用される場合に有効です。
    - **`students(name)` (※要検討)**:
      - 名前検索のためですが、PostgreSQLで `ILIKE '%...%'` (中間一致) を高速化するには、標準のB-Treeではなく `pg_trgm` (トライグラム) 拡張とGINインデックスの導入を検討すべきです。

3.  **カバリングインデックス (Advanced)**
    - **`exam_results(exam_id) INCLUDE (student_id)`**:
      - 検索条件が `exam_id` だけであれば、テーブル本体を見に行かずにインデックスだけで処理を完結（Index Only Scan）させ、高速化できます。

### Q. APIレスポンス形式の統一規格とエラーコード設計を提案してください

#### 回答（現在の課題と提案）
現在は成功時に `jsonify(data)` でデータのみを直接返しているエンドポイントが多いですが、RESTful APIとしての一貫性と拡張性を保つため、以下の共通フォーマット（エンベロープ）を提案します。

**1. 共通レスポンス形式 (Success)**
```json
// HTTP 200 OK
{
  "success": true,
  "data": {
    // 実際のリソースデータ (リストまたはオブジェクト)
    "student_id": 1001,
    "name": "山田 太郎"
  },
  "metadata": {
    // ページネーション等のメタ情報（必要に応じ）
    "count": 1,
    "total": 100
  }
}
```

**2. 共通レスポンス形式 (Error)**
```json
// HTTP 4xx / 5xx
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたIDの学生は見つかりませんでした。",
    "details": null  // バリデーションエラー時はフィールド毎のエラー配列等
  }
}
```

**3. エラーコード設計案**
HTTPステータスコードに加えて、クライアントがプログラムでハンドリングしやすい識別子（文字列コード）を定義します。

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| 400 | `INVALID_PARAMETER` | 入力値が不正、必須パラメータ欠如 |
| 401 | `AUTHENTICATION_REQUIRED` | トークン未送信、期限切れ |
| 403 | `PERMISSION_DENIED` | 管理者権限が必要な操作 |
| 404 | `RESOURCE_NOT_FOUND` | URLまたはリソースが存在しない |
| 409 | `RESOURCE_CONFLICT` | 登録データが重複している（一意制約違反） |
| 422 | `VALIDATION_ERROR` | データ形式のバリデーション失敗 |
| 500 | `INTERNAL_SERVER_ERROR` | サーバー内部エラー（DB接続断など） |

#### 回答（なぜ統一するのか？：面接用）
**「予測可能性（Predictability）とクライアント実装の簡素化のためです。」**

1.  **フロントエンドのコード共通化:**
    - 成功時は必ず `response.data.data` にアクセスし、失敗時は `response.data.error` を見れば良いというルールがあれば、API呼び出しのラッパー関数（Client Hooks）を共通化でき、開発効率が上がります。
2.  **エラーハンドリングの明確化:**
    - HTTP 400だけでは「パラメータ不足」なのか「バリデーションエラー」なのか判別しにくい場合があります。独自のエラーコード（`VALIDATION_ERROR` 等）を返すことで、クライアントは適切なエラーメッセージをユーザーに出し分けられます。
3.  **メタデータの分離:**
3.  **メタデータの分離:**
    - ページング情報などをデータ本体と混ぜずに `metadata` フィールドとして分離することで、データ構造を汚さずに付加情報をやり取りできます。

### Q. このアプリの想定障害トップ10と切り分け手順、ログ設計を教えてください

#### 回答（想定障害トップ10と一次切り分け）

1.  **ログイン失敗 (401/500)**
    - **原因:** パスワード間違い、DB接続エラー、サーバー日時ズレ（JWT作成時）。
    - **切り分け:** ステータスコードが401ならクライアント入力または認証処理、500ならDB/サーバー要因。
2.  **画面が真っ白 (White Screen)**
    - **原因:** フロントエンドのJSバンドル読み込みエラー、Reactレンダリングエラー。
    - **切り分け:** ブラウザのDevTools > Consoleを確認。静的配信サーバーの状態を確認。
3.  **検索結果が返ってこない (Timeout)**
    - **原因:** 検索条件によるクエリ負荷増大（インデックス効かず）、DBロック。
    - **切り分け:** 特定の検索条件のみか（クエリ）、全リクエストか（DB全体）。
4.  **CSVインポートエラー (4xx)**
    - **原因:** ファイルフォーマット（列不足、文字コード）、一意制約違反。
    - **切り分け:** エラーメッセージの詳細（行番号・理由）を確認。少量のファイルで再現するか。
5.  **PDF/帳票出力失敗 (500)**
    - **原因:** 日本語フォント欠落（サーバー環境）、メモリ不足。
    - **切り分け:** サーバーログのスタックトレースを確認（`OSError`, `MemoryError`）。
6.  **年度更新ができない**
    - **原因:** 既に更新済み、排他制御（他ユーザーが実行中）。
    - **切り分け:**DBの `academic_year_updates` テーブルの状態を確認。
7.  **502 Bad Gateway**
    - **原因:** Flask(Gunicorn)プロセスがダウンまたは応答なし。
    - **切り分け:** バックエンドプロセスの生存確認。再起動で直るか。
8.  **DB接続エラー (Connection Refused)**
    - **原因:** PostgreSQLダウン、最大接続数（max_connections）超過。
    - **切り分け:** 他のツールからDBに接続できるか。アクティブな接続数を確認。
9.  **ディスク容量不足**
    - **原因:** ログファイルの肥大化、アップロード一時ファイルの削除漏れ。
    - **切り分け:** `df -h` でディスク使用率を確認。
10. **CORSエラー**
    - **原因:** フロント/バックのドメイン不一致、Allowed Origin設定ミス。
    - **切り分け:** ブラウザのNetworkタブでPreflightリクエスト(OPTIONS)の結果を確認。

#### 回答（ログに出すべきフィールド設計案）

障害発生時に迅速な追跡（トレーサビリティ）を可能にするため、JSON形式の構造化ログを推奨します。

```json
{
  "timestamp": "2024-03-20T10:00:00.123Z",
  "level": "ERROR",
  "request_id": "req-12345-abcde",       // トレース用ID（Nginx等で付与し、アプリ全体で引き回す）
  "user_id": 1001,                       // 操作ユーザー（未ログイン時はnull）
  "client_ip": "203.0.113.1",
  "method": "POST",
  "endpoint": "/api/imports/students",   // パスパラメータ含む
  "status_code": 500,
  "duration_ms": 1500,                   // 処理時間（パフォーマンス分析用）
  "error_code": "DB_CONNECTION_ERROR",   // 独自定義のエラーコード
  "message": "Database connection failed",
  "stack_trace": "Traceback (most recent call last)..." // ERRORレベル時のみ
}
```

**重要なポイント:**
- **request_id:** 1回のリクエストに対するログを串刺しで検索するために必須。
- **user_id:** 「特定のユーザーだけで起きる不具合」の特定に役立ちます。
- **duration_ms:** 遅延の原因箇所（API単位）の特定、およびアラート設定（例: 3秒以上で警告）に使用します。






