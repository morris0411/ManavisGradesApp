import os
import sys
from pathlib import Path

import pytest
from flask import Flask

# backend ディレクトリを import パスに追加して、
# プロジェクトルートから pytest を実行しても `flaskr` を解決できるようにする
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from flaskr import db  # noqa: E402
from flaskr import models  # noqa: E402,F401  # ensure models are imported so metadata is registered


@pytest.fixture(scope="session")
def app():
    """
    テスト用の最小限の Flask アプリケーション。

    - SQLite を使用してインメモリに近い軽量な DB を構築
    - 本番の create_app() には依存せず、DB まわりだけ初期化する
    """
    # 環境変数に依存しないテスト用アプリ
    os.environ.setdefault("FLASK_ENV", "testing")

    app = Flask(__name__)
    app.config["TESTING"] = True
    # ファイルベース SQLite（in-memory だとコネクションごとに DB が消えるため）
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def session(app):
    """
    SQLAlchemy セッションをテストごとにクリーンな状態で提供する。
    """
    from flaskr import db as _db  # ローカルインポートで app コンテキストに紐づける

    with app.app_context():
        # 毎テスト前にテーブルを作り直して完全にクリーンな状態にする
        _db.drop_all()
        _db.create_all()

        yield _db.session

        _db.session.rollback()
        _db.session.remove()


