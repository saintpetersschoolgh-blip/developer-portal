import axios from "axios";
import { apiBaseUrl, getIdentityEngineApiKey, needsIdentityApiKeyHeader, isPortalRequest } from "../config.js";

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const idKey = getIdentityEngineApiKey();
  if (idKey && needsIdentityApiKeyHeader(config)) {
    config.headers["X-API-Key"] = idKey;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Treat 401s from /api/portal/** as session expiry: PortalJwtFilter rejects
    // missing/invalid/expired Authorization Bearer tokens with 401, and that
    // means the developer's session is dead — bounce to login. 401s from any
    // other route (e.g. ApiKeyFilter on platform endpoints) must NOT tear down
    // the portal session.
    const cfg = error.config;
    if (error.response?.status === 401 && cfg && isPortalRequest(cfg)) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }
    return Promise.reject(error);
  }
);

export default api;
