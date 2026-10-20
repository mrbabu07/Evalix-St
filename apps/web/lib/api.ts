export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string[]>) { super(message); }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: "Request failed." }));
    throw new ApiError(body.message ?? "Request failed.", response.status, body.errors);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export type User = { id: string; name: string; email: string; role: "STUDENT" | "MENTOR" };
export type Submission = {
  id: string; projectName: string; repoUrl: string; liveUrl: string; description: string;
  status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string; reviewedAt?: string | null;
  student?: { id: string; name: string; email: string };
  reviewer?: { id: string; name: string; email: string } | null;
  feedback?: { id: string; message: string; createdAt: string; author?: { name: string } }[];
};
