/**
 * Public env vars (Vite: prefix with VITE_). Override via .env in dev-portal root.
 * Copy .env.example → .env and set values.
 */
const env = import.meta.env;

export const apiBaseUrl =
  env.VITE_API_BASE_URL !== undefined ? env.VITE_API_BASE_URL : "http://localhost:8080";

/** @deprecated use getIdentityEngineApiKey() — supports runtime localStorage in dev */
export const identityEngineApiKey = env.VITE_IDENTITY_ENGINE_API_KEY || "";

/**
 * For /api/* (non-portal) calls, ApiKeyFilter requires X-API-Key.
 * Order: VITE_ env (restart Vite after changing .env) then localStorage `ie_dev_identity_api_key` (no restart).
 */
export function getIdentityEngineApiKey() {
  const fromEnv = (env.VITE_IDENTITY_ENGINE_API_KEY || "").trim();
  if (fromEnv) return fromEnv;
  try {
    if (typeof localStorage !== "undefined") {
      return (localStorage.getItem("ie_dev_identity_api_key") || "").trim();
    }
  } catch {
    /* private mode / blocked storage */
  }
  return "";
}

export function setDevIdentityApiKey(value) {
  try {
    localStorage.setItem("ie_dev_identity_api_key", (value || "").trim());
  } catch {
    /* ignore */
  }
}

export function clearDevIdentityApiKey() {
  try {
    localStorage.removeItem("ie_dev_identity_api_key");
  } catch {
    /* ignore */
  }
}

function requestPath(config) {
  const u = config.url || "";
  if (u.startsWith("http")) {
    try {
      return new URL(u).pathname;
    } catch {
      return u;
    }
  }
  return u;
}

/** True when ApiKeyFilter expects X-API-Key (same idea as backend: not /api/portal/) */
export function needsIdentityApiKeyHeader(config) {
  const p = requestPath(config);
  return p.startsWith("/api/") && !p.startsWith("/api/portal/");
}

export function isPortalRequest(config) {
  return requestPath(config).startsWith("/api/portal/");
}
