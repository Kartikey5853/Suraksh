import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AdminRegisterPayload extends RegisterPayload {
  role: string;
  role_code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  name: string;
  role: string;
  is_onboarded: boolean;
  needs_admin_otp?: boolean;
}

export interface DocumentRequestPayload {
  doc_type: string;
  doc_category: string;
  notes?: string;
  message?: string;
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data),

  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, new_password: string) =>
    api.post("/auth/reset-password", { token, new_password }),

  adminLogin: (data: LoginPayload) =>
    api.post<AuthResponse>("/admin/login", data),

  adminRegister: (data: AdminRegisterPayload) =>
    api.post("/admin/register", data),

  sendOtp: () =>
    api.post("/auth/send-otp"),

  verifyOtp: (code: string) =>
    api.post(`/auth/verify-otp?code=${encodeURIComponent(code)}`),
};

// ── Verification endpoints ────────────────────────────────────────────────────

export const verificationApi = {
  verifyAadhaar: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/verification/aadhaar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  submitFacePhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/verification/face", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getStatus: () => api.get("/verification/status"),

  getMyDetails: () => api.get("/verification/my-details"),

  bypassAadhaar: () => api.post("/verification/bypass"),

  /** Returns a URL to display the user's own ID card image */
  idImageUrl: () => `${BASE_URL}/verification/image/id`,

  /** Returns a URL to display the user's own face image */
  faceImageUrl: () => `${BASE_URL}/verification/image/face`,
};

// ── User endpoints ────────────────────────────────────────────────────────────

export const userApi = {
  getMe: () => api.get("/user/me"),

  updateMe: (data: { name?: string; phone?: string }) =>
    api.put("/user/me", data),

  saveSignature: (image_data: string) =>
    api.post("/user/signature", { image_data }),

  getSignature: () => api.get("/user/signature"),

  getDocuments: () => api.get("/user/documents"),

  getDocumentRequests: () => api.get("/user/document-requests"),

  createDocumentRequest: (data: DocumentRequestPayload) =>
    api.post("/user/document-requests", data),
};

// ── Agreement endpoints ───────────────────────────────────────────────────────

export const agreementApi = {
  // User
  getMyAgreements: () => api.get("/agreements/mine"),
  signAgreement: (id: string) => api.post(`/agreements/${id}/sign`),
  rejectAgreement: (id: string, reason: string) =>
    api.post(`/agreements/${id}/reject`, { reason }),

  // Admin
  getAll: () => api.get("/agreements"),
  create: (data: {
    title: string;
    content: string;
    doc_type: string;
    doc_category?: string;
    sent_to?: string;
    send_to_lawyer?: string;
    key_points?: string;
  }) => api.post("/agreements", data),
  send: (id: string, user_id: string) =>
    api.post(`/agreements/${id}/send`, { user_id }),
  sendToLawyer: (id: string, lawyer_id: string) =>
    api.post(`/agreements/${id}/send-to-lawyer`, { lawyer_id }),
  hold: (id: string, notes?: string) =>
    api.post(`/agreements/${id}/hold`, { notes: notes ?? "" }),
  resume: (id: string) =>
    api.post(`/agreements/${id}/resume`),
  getTimeline: (id: string) =>
    api.get(`/agreements/${id}/timeline`),

  // AI generation
  generate: (data: { prompt: string; doc_type: string; doc_category?: string; title?: string }) =>
    api.post("/agreements/generate", data),

  // AI analysis / scoring
  analyze: (data: { content: string; doc_type: string }) =>
    api.post("/agreements/analyze", data),

  // Pre-built template
  getTemplate: (doc_type: string, doc_category?: string) =>
    api.get(`/agreements/template?doc_type=${encodeURIComponent(doc_type)}&doc_category=${encodeURIComponent(doc_category ?? "")}`),

  // Finalize (run AI + store result)
  finalize: (id: string) => api.post(`/agreements/${id}/finalize`),
  finalizeUser: (id: string) => api.post(`/agreements/${id}/finalize-user`),

  // Lawyer
  getLawyerPending: () => api.get("/agreements/lawyer/pending"),
  lawyerReview: (id: string, action: "approve" | "reject", notes?: string) =>
    api.post(`/agreements/${id}/lawyer-review`, { action, notes: notes ?? "" }),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: () => api.get("/admin/users"),

  updateUserRole: (userId: string, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),

  toggleUserActive: (userId: string) =>
    api.put(`/admin/users/${userId}/toggle-active`),

  getDocumentRequests: () => api.get("/admin/document-requests"),

  updateDocumentRequest: (
    id: string,
    status: string,
    reviewer_notes?: string,
    assigned_to?: string
  ) => api.put(`/admin/document-requests/${id}`, { status, reviewer_notes, assigned_to }),

  sendAgreementFromRequest: (req_id: string, title: string, content: string) =>
    api.post(`/admin/document-requests/${req_id}/send-agreement`, { title, content }),

  getDocuments: () => api.get("/admin/documents"),

  // Verification management
  getVerifications: () => api.get("/admin/verifications"),
  approveVerification: (userId: string) => api.post(`/admin/verifications/${userId}/approve`),
  rejectVerification: (userId: string) => api.post(`/admin/verifications/${userId}/reject`),
  /** URL to view a user's ID card image (admin) */
  userIdImageUrl: (userId: string) => `${BASE_URL}/admin/verifications/${userId}/id-image`,
  /** URL to view a user's face image (admin) */
  userFaceImageUrl: (userId: string) => `${BASE_URL}/admin/verifications/${userId}/face-image`,
};

// ── Token helpers ─────────────────────────────────────────────────────────────

export function saveSession(res: AuthResponse) {
  localStorage.setItem("token", res.access_token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: res.user_id,
      name: res.name,
      role: res.role,
      is_onboarded: res.is_onboarded,
    })
  );
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getStoredUser(): {
  id: string;
  name: string;
  role: string;
  is_onboarded: boolean;
} | null {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}
