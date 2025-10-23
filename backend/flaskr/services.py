from .models import Student
from sqlalchemy import or_


def search_students(keyword):
    if not keyword:
        return [
            {"id": s.id, "name": s.name, "subject": s.subject, "score": s.score}
            for s in Student.query.order_by(Student.id).all()
        ]

    q = "%" + keyword + "%"
    results = Student.query.filter(or_(Student.name.ilike(q), Student.subject.ilike(q))).order_by(Student.id).all()
    return [
        {"id": s.id, "name": s.name, "subject": s.subject, "score": s.score}
        for s in results
    ]
