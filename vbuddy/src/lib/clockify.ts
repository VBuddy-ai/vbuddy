const CLOCKIFY_API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
console.log("clockify_key", CLOCKIFY_API_KEY);
const CLOCKIFY_API_BASE = "https://api.clockify.me/api/v1";

if (!CLOCKIFY_API_KEY) {
  throw new Error("CLOCKIFY_API_KEY is not set in environment variables");
}

export interface ClockifyWorkspace {
  id: string;
  name: string;
}

export interface ClockifyUser {
  id: string;
  name: string;
  email: string;
}

export interface ClockifyProject {
  id: string;
  name: string;
  workspaceId: string;
}

export interface ClockifyTimeEntry {
  id: string;
  description: string;
  start: string;
  end: string;
  userId: string;
  projectId: string;
  duration: string;
}

async function clockifyFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${CLOCKIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-Api-Key": CLOCKIFY_API_KEY!,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Clockify API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function getWorkspaces(): Promise<ClockifyWorkspace[]> {
  return clockifyFetch<ClockifyWorkspace[]>("/workspaces");
}

export async function getUsers(workspaceId: string): Promise<ClockifyUser[]> {
  return clockifyFetch<ClockifyUser[]>(`/workspaces/${workspaceId}/users`);
}

export async function createProject(
  workspaceId: string,
  name: string
): Promise<ClockifyProject> {
  return clockifyFetch<ClockifyProject>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function getTimeEntries(
  workspaceId: string,
  userId: string,
  start: string,
  end: string
): Promise<ClockifyTimeEntry[]> {
  const params = new URLSearchParams({
    start,
    end,
  });
  return clockifyFetch<ClockifyTimeEntry[]>(
    `/workspaces/${workspaceId}/user/${userId}/time-entries?${params.toString()}`
  );
}
