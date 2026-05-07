import { useState } from "react";
import { Link } from "react-router-dom";
import { getIdentityEngineApiKey, setDevIdentityApiKey, clearDevIdentityApiKey } from "../config.js";

const hasEnvKey = () => !!(import.meta.env.VITE_IDENTITY_ENGINE_API_KEY || "").trim();

export default function PlatformApiKeyBanner() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(() => getIdentityEngineApiKey().length > 0);
  const [dismissed, setDismissed] = useState(false);

  if (hasEnvKey() || saved || dismissed) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Platform API key needed</p>
      <p className="mt-1 text-amber-900/90">
        <strong>Users</strong>, <strong>Billing</strong>, and <strong>SMS config</strong> call <code className="rounded bg-amber-100 px-1">/api/…</code> routes
        that require an <code className="rounded bg-amber-100 px-1">X-API-Key</code> (your Identity Engine app key, active and
        {" "}
        <Link to="/apps" className="font-medium text-amber-950 underline">attached to an app</Link>
        ). Paste the raw key below (from{" "}
        <Link to="/api-keys" className="font-medium text-amber-950 underline">API Keys</Link>
        ) or set <code className="rounded bg-amber-100 px-1">VITE_IDENTITY_ENGINE_API_KEY</code> in <code className="rounded bg-amber-100 px-1">.env</code> and restart Vite.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <label className="sr-only" htmlFor="dev-ie-key">Raw API key</label>
          <input
            id="dev-ie-key"
            type="password"
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="ie_live_…"
            className="w-full rounded-md border border-amber-300/80 bg-white px-3 py-2 font-mono text-xs text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setDevIdentityApiKey(value);
            setValue("");
            if (getIdentityEngineApiKey().length > 0) {
              setSaved(true);
            }
          }}
          className="cursor-pointer rounded-md bg-amber-900 px-3 py-2 text-xs font-medium text-white hover:bg-amber-950"
        >
          Save for this browser
        </button>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            setValue("");
          }}
          className="cursor-pointer rounded-md border border-amber-300/80 bg-white px-3 py-2 text-xs font-medium text-amber-950 hover:bg-amber-100"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={() => {
            clearDevIdentityApiKey();
            setSaved(false);
            setValue("");
          }}
          className="cursor-pointer text-xs text-amber-800/80 underline"
        >
          Clear saved key
        </button>
      </div>
    </div>
  );
}
