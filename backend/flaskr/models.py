from datetime import date, datetime
from . import db


class Students(db.Model):
    __tablename__ = 'students'

    student_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    name_kana = db.Column(db.String, nullable=True)
    school_name = db.Column(db.String, nullable=False)
    grade = db.Column(db.String, nullable=False)
    admission_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String, nullable=False, default='在籍')  # 在籍/退会/既卒


class ExamMaster(db.Model):
    __tablename__ = 'exam_master'

    exam_code = db.Column(db.Integer, primary_key=True)
    exam_name = db.Column(db.String, nullable=False, unique=True)
    # 開催順（同一カテゴリ/学年内での標準順序）
    sort_key = db.Column(db.Integer, nullable=True)


class Exams(db.Model):
    __tablename__ = 'exams'

    exam_id = db.Column(db.Integer, primary_key=True)
    exam_code = db.Column(db.Integer, db.ForeignKey('exam_master.exam_code'), nullable=False)
    exam_year = db.Column(db.Integer, nullable=False)
    exam_type = db.Column(db.String, nullable=False)

    exam_master = db.relationship('ExamMaster', backref=db.backref('exams', lazy=True))


class ExamResults(db.Model):
    __tablename__ = 'exam_results'

    result_id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.exam_id'), nullable=False)

    student = db.relationship('Students', backref=db.backref('exam_results', lazy=True))
    exam = db.relationship('Exams', backref=db.backref('exam_results', lazy=True))


class SubjectMaster(db.Model):
    __tablename__ = 'subject_master'

    subject_code = db.Column(db.Integer, primary_key=True)
    subject_name = db.Column(db.String, nullable=False)


class SubjectScores(db.Model):
    __tablename__ = 'subject_scores'

    score_id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey('exam_results.result_id'), nullable=False)
    subject_code = db.Column(db.Integer, db.ForeignKey('subject_master.subject_code'), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    deviation_value = db.Column(db.Numeric(5, 2), nullable=False)

    exam_result = db.relationship('ExamResults', backref=db.backref('subject_scores', lazy=True))
    subject = db.relationship('SubjectMaster', backref=db.backref('subject_scores', lazy=True))


class Universities(db.Model):
    __tablename__ = 'universities'

    university_id = db.Column(db.Integer, primary_key=True)
    university_name = db.Column(db.String, nullable=False, unique=True)


class Faculties(db.Model):
    __tablename__ = 'faculties'

    faculty_id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.Integer, db.ForeignKey('universities.university_id'), nullable=False)
    faculty_name = db.Column(db.String, nullable=False)

    university = db.relationship('Universities', backref=db.backref('faculties', lazy=True))


class Departments(db.Model):
    __tablename__ = 'departments'

    department_id = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculties.faculty_id'), nullable=False)
    department_name = db.Column(db.String, nullable=False)

    faculty = db.relationship('Faculties', backref=db.backref('departments', lazy=True))


class ExamJudgements(db.Model):
    __tablename__ = 'exam_judgements'

    judgement_id = db.Column(db.Integer, primary_key=True)
    result_id = db.Column(db.Integer, db.ForeignKey('exam_results.result_id'), nullable=False)
    preference_order = db.Column(db.Integer)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'))
    judgement_kyote = db.Column(db.String)
    judgement_niji = db.Column(db.String)
    judgement_sougou = db.Column(db.String)

    exam_result = db.relationship('ExamResults', backref=db.backref('exam_judgements', lazy=True))
    department = db.relationship('Departments', backref=db.backref('exam_judgements', lazy=True))


class Users(db.Model):
    __tablename__ = 'users'

    user_id = db.Column(db.Integer, primary_key=True)
    login_id = db.Column(db.String, nullable=False, unique=True)
    password_hash = db.Column(db.String, nullable=False)


class SystemSettings(db.Model):
    __tablename__ = 'system_settings'
    
    setting_key = db.Column(db.String, primary_key=True)
    setting_value = db.Column(db.String, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)