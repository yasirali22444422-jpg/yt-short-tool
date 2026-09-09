import {
  Project,
  ProjectListItem,
  ProviderInfo,
  SaveKeyPayload,
  SystemStatus,
  TestConnectionResponse,
  UploadResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchProjects(): Promise<ProjectListItem[]> {
  const res = await fetch(`${API_BASE}/projects`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch project ${id}: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete project: ${res.statusText}`);
  }
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/system/status`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch system status: ${res.statusText}`);
  }
  return res.json();
}

export function uploadVideoWithProgress(
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch {
          reject(new Error("Invalid JSON response from server."));
        }
      } else {
        try {
          const errJson = JSON.parse(xhr.responseText);
          reject(new Error(errJson.detail || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during video upload. Please ensure backend server is running."));
    };

    xhr.send(formData);
  });
}

export async function fetchProviders(): Promise<ProviderInfo[]> {
  const res = await fetch(`${API_BASE}/providers`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch providers: ${res.statusText}`);
  }
  return res.json();
}

export async function saveProviderKey(
  provider: string,
  payload: SaveKeyPayload
): Promise<ProviderInfo> {
  const res = await fetch(`${API_BASE}/providers/${provider}/key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to save ${provider} key`);
  }
  return res.json();
}

export async function deleteProviderKey(provider: string): Promise<void> {
  const res = await fetch(`${API_BASE}/providers/${provider}/key`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete ${provider} key`);
  }
}

export async function testProviderConnection(
  provider: string,
  payload?: SaveKeyPayload
): Promise<TestConnectionResponse> {
  const res = await fetch(`${API_BASE}/providers/${provider}/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to test ${provider} connection`);
  }
  return res.json();
}
