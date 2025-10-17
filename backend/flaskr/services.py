from .models import students

def search_students(keyword):
    return [s for s in students if keyword in s["name"] or keyword in s["subject"]]
