import { useState } from "react";
import { searchStudents } from "./api/client";

function App() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const data = await searchStudents(keyword);
    setResults(data);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>成績検索</h1>
      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="名前や科目を入力"
      />
      <button onClick={handleSearch}>検索</button>

      <ul>
        {results.map((s) => (
          <li key={s.id}>
            {s.name}（{s.subject}: {s.score}点）
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
