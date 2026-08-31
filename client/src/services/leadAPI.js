import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
  timeout: 15000,
});

export async function analyzeLeads(file, criteria) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("criteria", JSON.stringify(criteria));

  const response = await api.post(
    "/leads/analyze",
    formData
  );

  return response.data;
}