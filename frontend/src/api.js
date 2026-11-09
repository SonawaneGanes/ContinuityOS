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

export const getClaims = (projectId) =>
  request(`/projects/${encodeURIComponent(projectId)}/claims`);

export const getSource = (projectId, claimId) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/claims/${encodeURIComponent(claimId)}/source`,
  );

export const getGaps = (projectId) =>
  request(`/projects/${encodeURIComponent(projectId)}/gaps`);

export const approveHandover = (projectId, approvedBy) =>
  request(
    `/projects/${encodeURIComponent(projectId)}/approve?approved_by=${encodeURIComponent(approvedBy)}`,
    { method: "POST" },
  );

export function uploadFile(projectId, file) {
  const form = new FormData();
  form.append("file", file);
  return request(`/projects/${encodeURIComponent(projectId)}/upload`, {
    method: "POST",
    body: form,
  });
}
