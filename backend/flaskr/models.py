from . import db


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, index=True)
    subject = db.Column(db.String(50), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False)