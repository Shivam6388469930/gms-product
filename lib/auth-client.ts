// Client helpers for the auth API. Assumes tokens live in httpOnly cookies.

export type ApiResult = {
  ok: boolean;
  status: number;
  data: { success?: boolean; message?: string; [key: string]: unknown };
};

export async function postJSON(url: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Couldn't reach the server. Check your connection and try again." },
    };
  }
}

let refreshing: Promise<boolean> | null = null;

// Shares one in-flight refresh across parallel requests.
export function refreshSession(): Promise<boolean> {
  refreshing ??= postJSON("/api/auth/refresh")
    .then((r) => r.ok)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

// Use instead of fetch() for protected endpoints: retries once after a 401.
export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const options: RequestInit = { ...init, credentials: "same-origin" };
  let res = await fetch(input, options);
  if (res.status === 401 && (await refreshSession())) {
    res = await fetch(input, options);
  }
  return res;
}

export function logout() {
  return postJSON("/api/auth/logout");
}

// Authenticated JSON request with automatic token refresh. Used by the app pages.
export async function apiJSON<T = Record<string, unknown>>(
  url: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown
): Promise<{ ok: boolean; status: number; data: { success?: boolean; message?: string } & T }> {
  try {
    const res = await authFetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.success !== false, status: res.status, data };
  } catch {
    return {
      ok: false,
      status: 0,
      data: { message: "Couldn't reach the server. Check your connection and try again." } as never,
    };
  }
}