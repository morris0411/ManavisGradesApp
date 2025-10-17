export async function searchStudents(keyword) {
    const res = await fetch(`http://localhost:5000/api/search?keyword=${keyword}`);
    return await res.json();
  }
  