import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { apiBaseUrl } from "../config.js";

function trimTrailingSlash(s) {
  return (s || "").replace(/\/+$/, "");
}

function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.08l6.79-6.79a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CodeBlock({ code, ariaLabel }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const ta = document.createElement("textarea");
        ta.value = code;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore copy failures */
    }
  };
  return (
    <div className="relative">
      <pre className="bg-[#0f172a] text-gray-100 rounded-lg p-4 pr-16 text-xs font-mono overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={ariaLabel || "Copy code"}
        className="absolute top-2 right-2 text-[11px] bg-white/10 hover:bg-white/20 text-gray-100 px-2 py-1 rounded-md cursor-pointer transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

function CodeTabs({ tabs, idPrefix }) {
  const [active, setActive] = useState(0);
  if (!tabs || tabs.length === 0) return null;

  function handleKey(e) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i + 1) % tabs.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i - 1 + tabs.length) % tabs.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(tabs.length - 1);
    }
  }

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKey}
        className="flex flex-wrap gap-1 border-b border-gray-200"
      >
        {tabs.map((t, i) => {
          const tabId = `${idPrefix}-tab-${i}`;
          const panelId = `${idPrefix}-panel-${i}`;
          const selected = active === i;
          return (
            <button
              key={tabId}
              id={tabId}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors cursor-pointer ${
                selected
                  ? "bg-[#0f172a] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => {
        const tabId = `${idPrefix}-tab-${i}`;
        const panelId = `${idPrefix}-panel-${i}`;
        const selected = active === i;
        return (
          <div
            key={panelId}
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!selected}
          >
            {selected && (
              <CodeBlock code={t.code} ariaLabel={`Copy ${t.label} snippet`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCard({ number, title, complete, children, footer }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 pb-4 flex items-start gap-4">
        <div
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
            complete
              ? "bg-emerald-100 text-emerald-700"
              : "bg-[#111827] text-white"
          }`}
          aria-hidden="true"
        >
          {complete ? <CheckIcon className="w-4 h-4" /> : number}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-gray-900 leading-tight">
            {title}
            {complete && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 align-middle">
                Done
              </span>
            )}
          </h2>
        </div>
      </div>
      <div className="px-6 pb-6 pl-[4.25rem] space-y-4 text-sm text-gray-700 leading-relaxed">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl text-xs text-gray-600">
          {footer}
        </div>
      )}
    </section>
  );
}

function FlowDiagram() {
  const rows = [
    { from: "Your client app", action: "POST /api/auth/initiate", to: "Identity Engine" },
    { from: "Identity Engine", action: "Returns { sessionId, authUrl }", to: "Your client app" },
    { from: "Your client app", action: "Redirects browser to authUrl", to: "Hosted OTP page" },
    { from: "End user", action: "Submits phone & OTP", to: "Identity Engine" },
    { from: "Identity Engine", action: "Redirects to your redirectUri?code=…&state=…", to: "Your callback page" },
  ];
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li
          key={i}
          className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
        >
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-semibold shrink-0">
            {i + 1}
          </span>
          <span className="font-medium text-gray-900 sm:w-44 shrink-0">
            {r.from}
          </span>
          <span className="text-gray-500 sm:w-6 text-center hidden sm:inline">
            →
          </span>
          <span className="flex-1 text-gray-700">{r.action}</span>
          <span className="text-gray-500 sm:w-6 text-center hidden sm:inline">
            →
          </span>
          <span className="font-medium text-gray-900 sm:w-44 shrink-0">
            {r.to}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function GetStarted() {
  const engine = useMemo(() => trimTrailingSlash(apiBaseUrl), []);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasApp, setHasApp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadProgress() {
      try {
        const [keysRes, clientsRes] = await Promise.allSettled([
          api.get("/api/portal/api-keys"),
          api.get("/api/portal/clients"),
        ]);
        if (cancelled) return;
        if (keysRes.status === "fulfilled") {
          const keys = keysRes.value?.data?.data;
          setHasApiKey(Array.isArray(keys) && keys.length > 0);
        }
        if (clientsRes.status === "fulfilled") {
          const clients = clientsRes.value?.data?.data;
          setHasApp(Array.isArray(clients) && clients.length > 0);
        }
      } catch {
        /* page renders fine without progress detection */
      }
    }
    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  const initiateTabs = useMemo(
    () => [
      {
        label: "cURL",
        code: `curl -X POST "${engine}/api/auth/initiate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "ie_live_xxxxxxxxxxxxxxxx",
    "redirectUri": "https://example.com/home"
  }'

# Response (HTTP 201)
# {
#   "status": 201,
#   "message": "Auth session initiated",
#   "data": {
#     "sessionId": "…",
#     "authUrl": "/auth/verify?session=…"
#   }
# }`,
      },
      {
        label: "JavaScript",
        code: `// Plain browser JavaScript
const ENGINE = "${engine}";
const API_KEY = "ie_live_xxxxxxxxxxxxxxxx";
const REDIRECT_URI = "https://example.com/home";

async function signInWithPhone() {
  const res = await fetch(ENGINE + "/api/auth/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: API_KEY, redirectUri: REDIRECT_URI }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 403 && body.errorCode === "INSUFFICIENT_SMS_BALANCE") {
      alert("Top up your SMS balance to keep using sign-in.");
      return;
    }
    throw new Error(body.message || "Failed to start sign-in");
  }

  const { data } = await res.json();
  window.location.href = ENGINE + data.authUrl;
}

document.querySelector("#sign-in").addEventListener("click", signInWithPhone);`,
      },
      {
        label: "React",
        code: `// .env (Vite)
// VITE_IE_BASE=${engine}
// VITE_IE_API_KEY=ie_live_xxxxxxxxxxxxxxxx
// VITE_IE_REDIRECT_URI=https://example.com/home

import { useCallback } from "react";

const ENGINE = import.meta.env.VITE_IE_BASE;
const API_KEY = import.meta.env.VITE_IE_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_IE_REDIRECT_URI;

export function useSignIn() {
  return useCallback(async () => {
    const res = await fetch(\`\${ENGINE}/api/auth/initiate\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: API_KEY, redirectUri: REDIRECT_URI }),
    });
    if (!res.ok) throw new Error("Failed to start sign-in");
    const { data } = await res.json();
    window.location.href = \`\${ENGINE}\${data.authUrl}\`;
  }, []);
}

export function SignInButton() {
  const signIn = useSignIn();
  return (
    <button
      type="button"
      onClick={signIn}
      className="px-4 py-2 rounded-md bg-black text-white"
    >
      Sign in with phone
    </button>
  );
}`,
      },
      {
        label: "Node.js (Express)",
        code: `// npm i express
// Node 18+ has global fetch.
import express from "express";

const app = express();
const ENGINE = process.env.IE_BASE;             // e.g. ${engine}
const API_KEY = process.env.IE_API_KEY;         // ie_live_...
const REDIRECT_URI = process.env.IE_REDIRECT_URI; // https://example.com/home

app.get("/auth/start", async (_req, res) => {
  try {
    const r = await fetch(\`\${ENGINE}/api/auth/initiate\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: API_KEY, redirectUri: REDIRECT_URI }),
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      return res.status(r.status).send(body.message || "Auth start failed");
    }
    const { data } = await r.json();
    res.redirect(\`\${ENGINE}\${data.authUrl}\`);
  } catch {
    res.status(500).send("Auth start error");
  }
});

app.listen(3000);`,
      },
      {
        label: "Python (Flask)",
        code: `# pip install flask requests
import os
import requests
from flask import Flask, redirect

app = Flask(__name__)

ENGINE = os.environ["IE_BASE"]                  # e.g. ${engine}
API_KEY = os.environ["IE_API_KEY"]              # ie_live_...
REDIRECT_URI = os.environ["IE_REDIRECT_URI"]    # https://example.com/home

@app.route("/auth/start")
def auth_start():
    r = requests.post(
        f"{ENGINE}/api/auth/initiate",
        json={"apiKey": API_KEY, "redirectUri": REDIRECT_URI},
        timeout=10,
    )
    r.raise_for_status()
    data = r.json()["data"]
    return redirect(f"{ENGINE}{data['authUrl']}")`,
      },
    ],
    [engine]
  );

  const callbackTabs = useMemo(
    () => [
      {
        label: "What to expect",
        code: `# Successful sign-in
https://example.com/home?code=AUTH_CODE_HERE&state=STATE_FROM_INITIATE

# Auth session expired before user finished
https://example.com/home?error=session_expired`,
      },
      {
        label: "JavaScript",
        code: `// Run on your redirect URI page (e.g. https://example.com/home)
const params = new URLSearchParams(window.location.search);
const code = params.get("code");
const state = params.get("state");
const error = params.get("error");

if (error === "session_expired") {
  window.location.href = "/";
} else if (code && state) {
  localStorage.setItem("auth", JSON.stringify({ code, state }));
  window.location.href = "/dashboard";
} else {
  window.location.href = "/";
}`,
      },
      {
        label: "React",
        code: `import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Callback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (error === "session_expired") {
      navigate("/", { replace: true });
      return;
    }
    if (code && state) {
      localStorage.setItem("auth", JSON.stringify({ code, state }));
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  }, [params, navigate]);

  return <p>Verifying…</p>;
}`,
      },
      {
        label: "Node.js (Express)",
        code: `// Mount this on the path you used as redirectUri (e.g. "/home").
app.get("/home", (req, res) => {
  const { code, state, error } = req.query;
  if (error === "session_expired") return res.redirect("/?expired=1");
  if (!code || !state) return res.redirect("/");

  res.cookie("auth", JSON.stringify({ code, state }), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
  });
  res.redirect("/dashboard");
});`,
      },
      {
        label: "Python (Flask)",
        code: `from flask import request, redirect, make_response

@app.route("/home")
def home():
    code = request.args.get("code")
    state = request.args.get("state")
    error = request.args.get("error")

    if error == "session_expired":
        return redirect("/?expired=1")
    if not code or not state:
        return redirect("/")

    resp = make_response(redirect("/dashboard"))
    resp.set_cookie(
        "auth",
        f"{code}:{state}",
        httponly=True,
        samesite="Lax",
        secure=True,
    )
    return resp`,
      },
    ],
    []
  );

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Get Started</h1>
        <p className="text-sm text-gray-600 mt-1">
          Add phone-number sign-in to your app in a few minutes. We host the
          OTP screen so you don&apos;t have to.
        </p>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          How it works
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          When a user clicks <em>Sign in</em>, your app calls our{" "}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            /api/auth/initiate
          </code>{" "}
          endpoint. Identity Engine takes over, sends the OTP, verifies it,
          and redirects the user back to your app with a one-time{" "}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            code
          </code>{" "}
          and{" "}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            state
          </code>
          .
        </p>
        <FlowDiagram />
      </section>

      <div className="space-y-5">
        <StepCard
          number={1}
          title="Create an API key"
          complete={hasApiKey}
        >
          <p>
            API keys identify your account when your client app calls{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
              /api/auth/initiate
            </code>
            . You can have multiple keys (e.g. <em>Production</em>,{" "}
            <em>Staging</em>).
          </p>
          <ol className="list-decimal pl-5 space-y-1 marker:text-gray-400">
            <li>
              Go to{" "}
              <Link to="/api-keys" className="text-[#111827] underline">
                API Keys
              </Link>{" "}
              and click <strong>Create API Key</strong>.
            </li>
            <li>
              Give it a name (e.g. <em>Production</em>) and a purpose.
            </li>
            <li>
              <strong>Copy the raw key (starts with </strong>
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                ie_live_
              </code>
              <strong>) and store it securely.</strong> It is shown only once.
            </li>
          </ol>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Never embed an API key directly in a public mobile or web bundle if
            the key has access to platform endpoints. For{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded">
              /api/auth/initiate
            </code>{" "}
            specifically, embedding is fine because the key only authorises
            phone sign-in initiation against your registered redirect URI.
          </div>
          <div>
            <Link
              to="/api-keys"
              className="inline-flex items-center gap-1 text-sm font-medium text-white bg-[#111827] hover:bg-[#1f2937] px-3 py-1.5 rounded-lg transition-colors"
            >
              Open API Keys
            </Link>
          </div>
        </StepCard>

        <StepCard number={2} title="Create an App" complete={hasApp}>
          <p>
            An <strong>App</strong> ties an API key to a specific{" "}
            <strong>redirect URI</strong> — the URL on your site where users
            land after they finish signing in.
          </p>
          <ol className="list-decimal pl-5 space-y-1 marker:text-gray-400">
            <li>
              Go to{" "}
              <Link to="/apps" className="text-[#111827] underline">
                Apps
              </Link>{" "}
              and click <strong>Create App</strong>.
            </li>
            <li>
              Give it a name (e.g. <em>Checkout Web</em>).
            </li>
            <li>
              Set the <strong>Redirect URI</strong> — usually a page on your
              site like{" "}
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                https://example.com/home
              </code>
              .
            </li>
            <li>Attach the API key you created in step 1.</li>
          </ol>
          <p className="text-xs text-gray-500">
            The redirect URI must match <em>exactly</em> what you pass to{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              /api/auth/initiate
            </code>{" "}
            (scheme, host, and path).
          </p>
          <div>
            <Link
              to="/apps"
              className="inline-flex items-center gap-1 text-sm font-medium text-white bg-[#111827] hover:bg-[#1f2937] px-3 py-1.5 rounded-lg transition-colors"
            >
              Open Apps
            </Link>
          </div>
        </StepCard>

        <StepCard
          number={3}
          title='Add the "Sign in with phone" button'
        >
          <p>
            On your client, when the user clicks <em>Sign in</em>, call{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
              POST /api/auth/initiate
            </code>{" "}
            with your API key and redirect URI, then send the browser to the
            returned <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">authUrl</code>.
          </p>
          <CodeTabs tabs={initiateTabs} idPrefix="initiate" />
          <p className="text-xs text-gray-500">
            Tip: <code className="bg-gray-100 px-1 py-0.5 rounded">authUrl</code>{" "}
            is a path (starts with{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">/auth/verify</code>
            ). Always prefix it with the engine origin{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">{engine}</code>{" "}
            before redirecting the user.
          </p>
        </StepCard>

        <StepCard number={4} title="Handle the redirect on your site">
          <p>
            Once the user finishes OTP, the engine redirects them back to your{" "}
            <strong>redirect URI</strong> with{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">code</code>{" "}
            and{" "}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">state</code>{" "}
            in the query string. That&apos;s your signal to mark the user as
            signed in.
          </p>
          <CodeTabs tabs={callbackTabs} idPrefix="callback" />
          <p className="text-xs text-gray-500">
            If the auth session expired before the user finished, the engine
            sends them back with{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded">
              ?error=session_expired
            </code>{" "}
            instead. Treat that as &quot;ask the user to retry sign-in&quot;.
          </p>
        </StepCard>

        <StepCard number={5} title="Test it end-to-end">
          <ul className="list-disc pl-5 space-y-1 marker:text-gray-400">
            <li>
              New accounts get <strong>50 GHS</strong> of free SMS credit.
              Check or top up at{" "}
              <Link to="/billing" className="text-[#111827] underline">
                Billing
              </Link>
              .
            </li>
            <li>
              Open your client app, click <em>Sign in</em>, enter a real phone
              number, and submit the OTP you receive by SMS.
            </li>
            <li>
              You should land on your redirect URI with{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">?code=…&amp;state=…</code>
              .
            </li>
            <li>
              Watch SMS deliveries and spend in real time on the{" "}
              <Link to="/" className="text-[#111827] underline">
                Dashboard
              </Link>
              .
            </li>
          </ul>
        </StepCard>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Reference
        </h2>

        <div className="space-y-5 text-sm">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Base URL
            </h3>
            <code className="block text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-2 font-mono break-all">
              {engine}
            </code>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              POST /api/auth/initiate
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Public endpoint. The API key goes in the JSON{" "}
              <strong>body</strong>, not as an{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">X-API-Key</code>{" "}
              header.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Request body
                </p>
                <CodeBlock
                  code={`{
  "apiKey": "ie_live_…",
  "redirectUri": "https://example.com/home"
}`}
                  ariaLabel="Copy request body"
                />
              </div>
              <div>
                <p className="text-[11px] font-medium text-gray-500 mb-1">
                  Response (201)
                </p>
                <CodeBlock
                  code={`{
  "status": 201,
  "message": "Auth session initiated",
  "data": {
    "sessionId": "uuid",
    "authUrl": "/auth/verify?session=uuid"
  }
}`}
                  ariaLabel="Copy response body"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Redirect back to your app
            </h3>
            <div className="overflow-x-auto">
              <table className="text-sm w-full min-w-[420px]">
                <thead className="text-gray-500 text-xs">
                  <tr className="border-b border-gray-100">
                    <th className="text-left font-medium py-2 pr-4">Query param</th>
                    <th className="text-left font-medium py-2 pr-4">When</th>
                    <th className="text-left font-medium py-2">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">code</td>
                    <td className="py-2 pr-4 text-xs">Success</td>
                    <td className="py-2 text-xs">One-time auth code; treat the user as signed in.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">state</td>
                    <td className="py-2 pr-4 text-xs">Success</td>
                    <td className="py-2 text-xs">Echoed back from the auth session; useful for CSRF checks.</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-xs">error=session_expired</td>
                    <td className="py-2 pr-4 text-xs">Failure</td>
                    <td className="py-2 text-xs">Session timed out before the user finished. Ask them to retry.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Errors you may see on initiate
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  401 Unauthorized
                </code>{" "}
                — the API key is missing, revoked, or not attached to an App.
              </li>
              <li>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  403 INSUFFICIENT_SMS_BALANCE
                </code>{" "}
                — top up at{" "}
                <Link to="/billing" className="text-[#111827] underline">
                  Billing
                </Link>{" "}
                so the engine can send the OTP SMS.
              </li>
              <li>
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                  400 Bad Request
                </code>{" "}
                — usually a missing field, or a redirect URI that doesn&apos;t
                match what&apos;s configured on your App.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Where the API key goes
            </h3>
            <p className="text-sm text-gray-700">
              <code className="bg-gray-100 px-1 py-0.5 rounded">/api/auth/*</code>{" "}
              endpoints accept the API key in the JSON body (as shown above).
              Other platform endpoints — for example{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">/api/users</code>{" "}
              and{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">/api/clients</code>
              {" "}— require an{" "}
              <code className="bg-gray-100 px-1 py-0.5 rounded">X-API-Key</code>{" "}
              request header instead.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
