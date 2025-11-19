from pathlib import Path
lines = Path(r"frontend/src/api/exams.jsx").read_text(encoding="utf-8").splitlines()
for i,line in enumerate(lines,1):
    if 'filterExamResults' in line:
        print(i, line)
        print(i+1, lines[i])
