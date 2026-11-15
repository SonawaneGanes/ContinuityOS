const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);
  const responseText = await response.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    data = responseText;
  }

  if (!response.ok) {
    const detail = data && typeof data === "object" ? data.detail : data;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return data;
}

export const checkHealth = () => request("/health");

function authenticatedOptions(token, options = {}) {
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

export const login = (username, password) =>
  request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

export const getProjectStatus = (projectId, token) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/status`,
    authenticatedOptions(token),
  );

export const getClaims = (projectId, token) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/claims`,
    authenticatedOptions(token),
  );

export const getSource = (projectId, claimId, token) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/claims/${encodeURIComponent(claimId)}/source`,
    authenticatedOptions(token),
  );

export const getGaps = (projectId, token) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/gaps`,
    authenticatedOptions(token),
  );

export const approveHandover = (projectId, approvedBy, token) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/approve?approved_by=${encodeURIComponent(approvedBy)}`,
    authenticatedOptions(token, { method: "POST" }),
  );

export function uploadFile(projectId, file, token) {
  const form = new FormData();
  form.append("file", file);
  return request(`/projects/${encodeURIComponent(projectId)}/upload`, {
    ...authenticatedOptions(token),
    method: "POST",
    body: form,
  });
}
