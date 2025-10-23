from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app():
    load_dotenv()
    app = Flask(__name__)

    # DB設定
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
        "DATABASE_URL",
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # 拡張の初期化
    db.init_app(app)
    migrate.init_app(app, db)

    CORS(app)  # Reactからのアクセス許可

    # Blueprint登録
    from .route import bp
    app.register_blueprint(bp)

    return app