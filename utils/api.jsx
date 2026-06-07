import { API_BASE } from "./config";

// TOKEN STORAGE
export function getAccessToken() {
  return localStorage.getItem("accessToken");

  const token = localStorage.getItem("accessToken");
  console.log("TOKEN:", token);
}

export function setAccessToken(token) {
  localStorage.setItem("accessToken", token);
}

export function removeAccessToken() {
  localStorage.removeItem("accessToken");
}

// refresh token
export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function setRefreshToken(token) {
  localStorage.setItem("refreshToken", token);
}

export function removeRefreshToken() {
  localStorage.removeItem("refreshToken");
}

// REFRESH ACCESS TOKEN
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();

    if (!refreshToken) return null;

    const response = await fetch(`${API_BASE}/auth`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    const newAccessToken = result.data.accessToken;
    setAccessToken(newAccessToken);

    return newAccessToken;
  } catch (error) {
    return null;
  }
}

// API REQUEST
export async function apiRequest(endpoint, options = {}) {
  let token = getAccessToken();

  // 1. Cek apakah data yang dikirim adalah FormData (File)
  const isFormData = options.body instanceof FormData;

  // 2. Setup Headers (JANGAN ada "Content-Type" di sini secara default)
  let headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  // 3. Tambahkan "Content-Type: application/json" HANYA jika bukan FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  // 4. Setup Body: Jangan di-stringify kalau FormData
  const body = isFormData ? options.body : (options.body ? JSON.stringify(options.body) : null);

  // REQUEST PERTAMA
  let response = await fetch(`${API_BASE}${endpoint}`, {
    method: options.method || "GET",
    headers,
    body,
  });

  // PENANGANAN TOKEN EXPIRED
  if (response.status === 401) {
    const newToken = await refreshAccessToken();

    if (!newToken) {
      removeAccessToken();
      removeRefreshToken();
      window.location.href = "/login";
      return;
    }

    // Retry request
    headers.Authorization = `Bearer ${newToken}`;
    response = await fetch(`${API_BASE}${endpoint}`, {
      method: options.method || "GET",
      headers,
      body,
    });
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Request error");
  }

  return result;
}

// REGISTER
export async function registry(body) {
  return apiRequest("/users", {
    method: "POST",
    body,
  });
}

// LOGIN
export async function login(body) {
  const result = await apiRequest("/auth", {
    method: "POST",
    body,
  });

  const { accessToken, refreshToken } = result.data;

  setAccessToken(accessToken);
  setRefreshToken(refreshToken);

  localStorage.setItem( "accessToken", result.data.accessToken);

  return result;
}

// LOGOUT
export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    await apiRequest("/auth", {
      method: "DELETE",
      body: { refreshToken, },
    });
  } catch (error) {
    console.error(error);
  }

  removeAccessToken();
  removeRefreshToken();
}

// USER
export async function getUserById(id) {
  return apiRequest(`/users/${id}`);
}

export async function getCurrentUser() {
   return apiRequest("/users/me");
}

export async function startAbilityTest() {
  return apiRequest(
    "/test-abilities/start", 
    { method: "POST" });
}
// export async function 

export async function submitAbilityTest(body) {
  return apiRequest("/test-abilities/submit", {
    method: "POST",
    body,
  });
}

export async function checkUserStatus() {
  return apiRequest("/test-abilities/check-status", {
    method: "GET",
  });
}

// UPLOAD DOKUMEN & GENERATE SOAL (Versi Clean Code)
// UPLOAD DOKUMEN & GENERATE SOAL PERTAMA
export async function uploadDocumentAndGenerate(file) {
  // --- LANGKAH 1: UPLOAD PDF ---
  const formData = new FormData();
  // WAJIB bernama "file" agar cocok dengan uploadSinglePdf('file') di backend
  formData.append("file", file); 

  const uploadRes = await apiRequest("/documents", {
    method: "POST",
    body: formData,
  });
  
  const documentId = uploadRes.data.document_id;

  // --- LANGKAH 2: MULAI SESI UJIAN ADAPTIF ---
  const sessionRes = await apiRequest("/sessions/start", {
    method: "POST",
    body: { document_id: documentId } // Inisialisasi Theta 0 di backend
  });
  
  const sessionId = sessionRes.data.session_id;

  // --- LANGKAH 3: MINTA SOAL PERTAMA DARI MODEL T5 ---
  const firstQuestionRes = await apiRequest("/sessions/next-question", {
    method: "POST",
    body: { 
      session_id: sessionId, 
      document_id: documentId 
    }
  });

  // --- LANGKAH 4: BUNGKUS DATA UNTUK QUIZPAGE ---
  return {
    status: 'success',
    data: {
      session_id: sessionId,
      document_id: documentId,
      ...firstQuestionRes.data // Menggabungkan teks bacaan, soal, dan opsi jawaban
    }
  };
}

// AMBIL RIWAYAT LATIHAN
export async function getHistorySessions() {
  return apiRequest("/sessions"); // Targetkan ke rute baru!
}

// SUBMIT JAWABAN SESI ADAPTIF
export async function submitSessionAnswer(body) {
  return apiRequest("/sessions/submit-answer", {
    method: "POST",
    body,
  });
}

// AMBIL SOAL SELANJUTNYA DARI AI
export async function fetchNextQuestion(body) {
  return apiRequest("/sessions/next-question", {
    method: "POST",
    body,
  });
}

export async function getSessionSummary(sessionId) {
  return apiRequest(`/sessions/${sessionId}/summary`);
}

// AMBIL DETAIL PEMBAHASAN SOAL (REVIEW)
export async function getSessionReview(sessionId) {
  return apiRequest(`/sessions/${sessionId}/review`);
}
