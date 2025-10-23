from datetime import date
from . import db

# --- Students ---
class Student(db.Model):
    __tablename__ = "students"
    student_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    school_name = db.Column(db.String)
    grade = db.Column(db.Integer)
    admission_date = db.Column(db.Date)

    exam_results = db.relationship("ExamResult", backref="student")


# --- Exam_master ---
class ExamMaster(db.Model):
    __tablename__ = "exam_master"
    exam_code = db.Column(db.Integer, primary_key=True)
    exam_name = db.Column(db.String)

    exams = db.relationship("Exam", backref="exam_master")


# --- Exams ---
class Exam(db.Model):
    __tablename__ = "exams"
    exam_id = db.Column(db.Integer, primary_key=True)
    exam_code = db.Column(db.Integer, db.ForeignKey("exam_master.exam_code"))
    exam_year = db.Column(db.Integer)
    exam_type = db.Column(db.String)

    exam_results = db.relationship("ExamResult", backref="exam")


# --- ExamResults ---
class ExamResult(db.Model):
    __tablename__ = "exam_results"
    result_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.student_id"))
    exam_id = db.Column(db.Integer, db.ForeignKey("exams.exam_id"))
    uploaded_by = db.Column(db.Integer, db.ForeignKey("users.user_id"))

    subject_scores = db.relationship("SubjectScore", backref="exam_result")
    exam_judgements = db.relationship("ExamJudgement", backref="exam_result")


# --- Subject_master ---
class SubjectMaster(db.Model):
    __tablename__ = "subject_master"
    subject_code = db.Column(db.Integer, primary_key=True)
    subject_name = db.Column(db.String)

    subject_scores = db.relationship("SubjectScore", backref="subject_master")


# --- SubjectScores ---
class SubjectScore(db.Model):
    __tablename__ = "subject_scores"
    score_id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey("exam_results.result_id"))
    subject_code = db.Column(db.Integer, db.ForeignKey("subject_master.subject_code"))
    score = db.Column(db.Integer)
    deviation_value = db.Column(db.Numeric(5, 2))


# --- ExamJudgements ---
class ExamJudgement(db.Model):
    __tablename__ = "exam_judgements"
    judgement_id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey("exam_results.result_id"))
    preference_order = db.Column(db.Integer)
    department_id = db.Column(db.Integer, db.ForeignKey("departments.department_id"))
    judgment = db.Column(db.String)


# --- Departments ---
class Department(db.Model):
    __tablename__ = "departments"
    department_id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.Integer, db.ForeignKey("universities.university_id"))
    faculty_name = db.Column(db.String)
    department_name = db.Column(db.String)

    exam_judgements = db.relationship("ExamJudgement", backref="department")


# --- Universities ---
class University(db.Model):
    __tablename__ = "universities"
    university_id = db.Column(db.Integer, primary_key=True)
    university_name = db.Column(db.String)

    departments = db.relationship("Department", backref="university")


# --- Users ---
class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    login_id = db.Column(db.String)
    password_hash = db.Column(db.String)

    exam_results = db.relationship("ExamResult", backref="user")
