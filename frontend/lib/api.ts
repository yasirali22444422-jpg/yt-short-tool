import {
  Project,
  ProjectListItem,
  ProviderInfo,
  SaveKeyPayload,
  SceneAnalysisData,
  FullAnalysisPackage,
  SystemStatus,
  TestConnectionResponse,
  UploadResponse,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchProjects(includeInternal: boolean = false): Promise<ProjectListItem[]> {
  const url = includeInternal ? `${API_BASE}/projects?include_internal=true` : `${API_BASE}/projects`;
  const res = await fetch(url, { cache: "no-store" });
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

export async function triggerProjectAnalysis(
  projectId: string,
  payload?: { provider?: string; model?: string; mode?: string }
): Promise<FullAnalysisPackage> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to trigger analysis.");
  }
  return res.json();
}

export async function fetchProjectAnalysis(projectId: string): Promise<FullAnalysisPackage> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/analysis`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to fetch analysis package.");
  }
  return res.json();
}

export async function regenerateScenePrompts(
  projectId: string,
  sceneNum: number
): Promise<SceneAnalysisData> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneNum}/regenerate`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to regenerate Scene ${sceneNum}`);
  }
  return res.json();
}

export async function updateSceneAnalysis(
  projectId: string,
  sceneNum: number,
  updates: Partial<SceneAnalysisData>
): Promise<SceneAnalysisData> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/scenes/${sceneNum}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Failed to update Scene ${sceneNum}`);
  }
  return res.json();
}

export function getExportUrl(projectId: string, format: "json" | "markdown" | "txt"): string {
  return `${API_BASE}/projects/${projectId}/export?format=${format}`;
}

export async function fetchPromptTemplates(category?: string): Promise<import("@/types").PromptTemplate[]> {
  const url = new URL(`${API_BASE}/prompts/templates`);
  if (category && category !== "All") {
    url.searchParams.set("category", category);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to fetch prompt templates");
  }
  return res.json();
}

export async function fetchPromptTemplate(id: string): Promise<import("@/types").PromptTemplate> {
  const res = await fetch(`${API_BASE}/prompts/templates/${id}`, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to fetch prompt template");
  }
  return res.json();
}

export async function updatePromptTemplate(
  id: string,
  updates: Partial<import("@/types").PromptTemplate>
): Promise<import("@/types").PromptTemplate> {
  const res = await fetch(`${API_BASE}/prompts/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to update prompt template");
  }
  return res.json();
}

export async function reimportPromptLibrary(): Promise<{ message: string; count: number }> {
  const res = await fetch(`${API_BASE}/prompts/import-library`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to re-import prompt library");
  }
  return res.json();
}

