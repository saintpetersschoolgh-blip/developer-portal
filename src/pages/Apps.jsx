import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function Apps() {
  const [apps, setApps] = useState([]);
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [apiKeyId, setApiKeyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  async function fetchAll() {
    try {
      const [appsRes, keysRes] = await Promise.all([
        api.get("/api/portal/clients"),
        api.get("/api/portal/api-keys"),
      ]);
      setApps(Array.isArray(appsRes.data.data) ? appsRes.data.data : []);
      setKeys(Array.isArray(keysRes.data.data) ? keysRes.data.data : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  const availableKeys = keys.filter(
    (k) => k.status === "Active" && !k.attachedClientId
  );

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!apiKeyId) {
      setError("Pick an API key for this app");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/portal/clients", { name, redirectUri, apiKeyId });
      setName("");
      setRedirectUri("");
      setApiKeyId("");
      setShowForm(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create app");
    } finally {
      setSaving(false);
    }
  }

  function copyToClipboard(text, key) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Apps</h1>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1f2937] transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "Create App"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4 max-w-lg">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              placeholder="My App"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URI</label>
            <input
              type="url"
              required
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              placeholder="https://myapp.com/callback"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            {availableKeys.length === 0 ? (
              <p className="text-xs text-gray-500">
                No active, unattached keys.{" "}
                <Link to="/api-keys" className="text-[#111827] underline">Create one</Link> first.
              </p>
            ) : (
              <select
                required
                value={apiKeyId}
                onChange={(e) => setApiKeyId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white"
              >
                <option value="">Select an API key…</option>
                {availableKeys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name} — {k.purpose}
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || availableKeys.length === 0}
            className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1f2937] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : apps.length === 0 ? (
        <p className="text-sm text-gray-500">No apps yet. Create your first one.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">App ID</th>
                <th className="px-5 py-3 font-medium">Developer ID</th>
                <th className="px-5 py-3 font-medium">Redirect URI</th>
                <th className="px-5 py-3 font-medium">API Key</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{app.name}</td>
                  <td className="px-5 py-3">
                    {app.clientSupportKey ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate max-w-[140px]">
                          {app.clientSupportKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(app.clientSupportKey, `${app.id}-app`)}
                          className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer shrink-0"
                        >
                          {copiedKey === `${app.id}-app` ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {app.userSupportKey ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono truncate max-w-[140px]">
                          {app.userSupportKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(app.userSupportKey, `${app.id}-dev`)}
                          className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer shrink-0"
                        >
                          {copiedKey === `${app.id}-dev` ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]">{app.redirectUri}</td>
                  <td className="px-5 py-3">
                    {app.apiKeyPreview ? (
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[180px]">
                          {app.apiKeyPreview}
                        </code>
                        <button
                          onClick={() => copyToClipboard(app.apiKeyPreview, `${app.id}-key`)}
                          className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer shrink-0"
                        >
                          {copiedKey === `${app.id}-key` ? "Copied!" : "Copy"}
                        </button>
                        {app.apiKeyName && (
                          <span className="text-xs text-gray-400 shrink-0">({app.apiKeyName})</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      app.status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
