from pathlib import Path
path = Path(r"frontend/src/pages/Exams/Detail.jsx")
text = path.read_text(encoding="utf-8")
old = '{ label: examName || "�͎��ڍ�" }'
if old not in text:
    raise SystemExit('old text not found')
text = text.replace(old, '{ label: examTitle }', 1)
path.write_text(text, encoding="utf-8")
