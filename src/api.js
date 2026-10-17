function apiBaseUrl() {
  const configured = String(import.meta.env.VITE_API_URL ?? "http://localhost:3000")
    .trim()
    .replace(/\/+$/, "");
  return configured.endsWith("/api") ? configured : `${configured}/api`;
}

const API_URL = apiBaseUrl();
const TOKEN_KEY = "accessToken";

let unauthorizedHandler = () => {};

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(details, status, body) {
    super(details[0] ?? "Request failed");
    this.name = "ApiError";
    this.details = details;
    this.status = status;
    this.body = body ?? {};
  }
}

export function errorDetails(error) {
  if (error instanceof ApiError) return error.details;
  if (error instanceof Error && error.message) return [error.message];
  return ["Something went wrong. Please try again."];
}

function detailList(body) {
  if (Array.isArray(body?.errors) && body.errors.length > 0) {
    return body.errors.map(String);
  }
  if (Array.isArray(body?.message) && body.message.length > 0) {
    return body.message.map(String);
  }
  if (typeof body?.message === "string" && body.message.trim()) {
    return [body.message];
  }
  return ["Request failed"];
}

export function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function api(path, options = {}) {
  const { redirectOnUnauthorized = true, headers, ...request } = options;
  const token = getToken();
  const isLogin = path.startsWith("/auth/login");

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...request,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(
      [
        "The notification service could not be reached. Check that it is running and try again.",
      ],
      0,
      {},
    );
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = detailList(body);
    const wrongCurrentPassword = body?.message === "Current password is incorrect";
    if (
      response.status === 401 &&
      redirectOnUnauthorized &&
      !isLogin &&
      !wrongCurrentPassword
    ) {
      clearToken();
      unauthorizedHandler();
    }
    throw new ApiError(details, response.status, body);
  }

  return body;
}
