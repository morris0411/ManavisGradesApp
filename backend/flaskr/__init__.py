from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import pathlib

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    load_dotenv(dotenv_path=pathlib.Path(__file__).resolve().parents[1] / ".env", override=True)
    app = Flask(__name__)

    db_url = os.getenv("DATABASE_URL", "").strip()
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
    if not db_url:
        raise RuntimeError("DATABASE_URL が未設定です。")

    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # JWT設定
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False  # トークンの有効期限を無期限に設定（必要に応じて変更）

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # CORS設定: Authorizationヘッダーを許可
    CORS(app, supports_credentials=True, allow_headers=["Content-Type", "Authorization"])
    
    # --- Blueprint登録 ---
    from .route import bp
    from .routes.students import students_bp
    from .routes.exams import exams_bp
    from .routes.imports import imports_bp
    from .routes.auth import auth_bp

    app.register_blueprint(bp)
    app.register_blueprint(students_bp, url_prefix="/api")
    app.register_blueprint(exams_bp, url_prefix="/api")
    app.register_blueprint(imports_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    
    return app