import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  async function fetchKeys() {
    try {
      const res = await api.get("/api/portal/api-keys");
      setKeys(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchKeys(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.post("/api/portal/api-keys", { name, purpose });
      const body = res.data.data;
      setRevealed(body);
      if (body?.keyValue) {
        try {
          localStorage.setItem("ie_dev_identity_api_key", body.keyValue);
        } catch {
          /* ignore */
        }
      }
      setName("");
      setPurpose("");
      setShowForm(false);
      fetchKeys();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create API key");
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(id) {
    if (!window.confirm("Revoke this API key? Any app using it will stop working immediately.")) return;
    try {
      await api.post(`/api/portal/api-keys/${id}/revoke`);
      fetchKeys();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to revoke key");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this API key permanently?")) return;
    try {
      await api.delete(`/api/portal/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete key");
    }
  }

  function copyToClipboard(text, id) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">API Keys</h1>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1f2937] transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "Create API Key"}
        </button>
      </div>

      {revealed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-yellow-900 mb-1">
                Save this key now — it won't be shown again.
              </h2>
              <p className="text-xs text-yellow-800 mb-3">
                "{revealed.name}" — {revealed.purpose}
              </p>
              <code className="block text-xs bg-white border border-yellow-200 rounded-lg px-3 py-2 font-mono break-all">
                {revealed.keyValue}
              </code>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => copyToClipboard(revealed.keyValue, "revealed")}
                className="text-xs bg-[#111827] text-white px-3 py-1.5 rounded-lg hover:bg-[#1f2937] cursor-pointer"
              >
                {copiedId === "revealed" ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => setRevealed(null)}
                className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm p-5 mb-6 space-y-4 max-w-lg">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              placeholder="Production"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <input
              type="text"
              required
              maxLength={255}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
              placeholder="Used by main checkout app"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1f2937] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-gray-500">No API keys yet. Create your first one.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Purpose</th>
                <th className="px-5 py-3 font-medium">Key</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Attached App</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{k.name}</td>
                  <td className="px-5 py-3 text-gray-600 truncate max-w-[200px]">{k.purpose}</td>
                  <td className="px-5 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{k.keyPreview}</code>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      k.status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {k.attachedClientName || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : ""}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {k.status === "Active" ? (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDelete(k.id)}
                        className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
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
