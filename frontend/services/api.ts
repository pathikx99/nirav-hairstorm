/**
 * API Client — Nirav Hairstorm Backend
 */

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname) {
    return `http://${window.location.hostname}:8000/api/v1`;
  }
  return "http://localhost:8000/api/v1";
}

export const API_BASE_URL = getApiBaseUrl();

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail =
          typeof errorJson.detail === "string"
            ? errorJson.detail
            : Array.isArray(errorJson.detail)
            ? errorJson.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ")
            : JSON.stringify(errorJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
