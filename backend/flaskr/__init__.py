from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
import pathlib

db = SQLAlchemy()
migrate = Migrate()

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

    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    
    # --- Blueprint登録 ---
    from .route import bp
    from .routes.students import students_bp
    from .routes.exams import exams_bp

    app.register_blueprint(bp)
    app.register_blueprint(students_bp, url_prefix="/api")
    app.register_blueprint(exams_bp, url_prefix="/api")
    
    return app