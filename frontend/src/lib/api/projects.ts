import {
  ProjectRecord,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectsResponse,
  SingleProjectResponse,
} from '@/types/project';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

function getAuthHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userId) {
    headers['Authorization'] = `Bearer ${userId}`;
    headers['X-User-Id'] = userId;
  }
  return headers;
}

export async function fetchUserProjects(userId: string): Promise<ProjectRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/core/projects`, {
      headers: getAuthHeaders(userId),
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 401) {
        return [];
      }
      throw new Error(`Failed to fetch projects (${res.status})`);
    }

    const data: ProjectsResponse = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('[API] Error fetching user projects:', error);
    return [];
  }
}

export async function fetchProjectById(
  id: string,
  userId: string
): Promise<ProjectRecord | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/core/projects/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(userId),
      cache: 'no-store',
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch project ${id} (${res.status})`);
    }

    const data: SingleProjectResponse = await res.json();
    return data.data || null;
  } catch (error) {
    console.error(`[API] Error fetching project ${id}:`, error);
    return null;
  }
}

export async function createProject(
  payload: CreateProjectDto,
  userId: string
): Promise<ProjectRecord> {
  const res = await fetch(`${API_BASE_URL}/core/projects`, {
    method: 'POST',
    headers: getAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.message || `Failed to create project (${res.status})`
    );
  }

  const data: SingleProjectResponse = await res.json();
  return data.data;
}

export async function updateProject(
  id: string,
  payload: UpdateProjectDto,
  userId: string
): Promise<ProjectRecord> {
  const res = await fetch(`${API_BASE_URL}/core/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(userId),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.message || `Failed to update project (${res.status})`
    );
  }

  const data: SingleProjectResponse = await res.json();
  return data.data;
}

export async function deleteProject(
  id: string,
  userId: string
): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/core/projects/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(userId),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(
      errorJson.message || `Failed to delete project (${res.status})`
    );
  }

  return true;
}
