// API Client — Base fetch wrapper with error handling

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface ApiError {
  code: string;
  message: string;
  status: number;
}

class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(error: ApiError) {
    super(error.message);
    this.code = error.code;
    this.status = error.status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }

    const errorData: ApiError = {
      code: errorBody?.error?.code || errorBody?.code || "UNKNOWN",
      message: errorBody?.error?.message || errorBody?.message || errorBody?.detail || response.statusText,
      status: response.status,
    };

    throw new ApiClientError(errorData);
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: "POST", body: formData, headers: {} }),
};

export { ApiClientError };
export type { ApiError };
