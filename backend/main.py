from flaskr import create_app
app = create_app()

from flaskr import create_app, db

app = create_app()

with app.app_context():
    db.create_all()
    print("✅ データベースとテーブルを作成しました！")

if __name__ == "__main__":
    app.run(debug=True)
