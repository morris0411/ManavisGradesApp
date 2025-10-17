from flask import Flask
from flask_cors import CORS
from .route import bp

def create_app():
    app = Flask(__name__)
    CORS(app)  # Reactからのアクセス許可
    app.register_blueprint(bp)
    return app
