import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const moneyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const statCards = [
  { key: "totalApps", label: "Total apps" },
  { key: "totalUsers", label: "Total users" },
  { key: "amountSpent", label: "SMS spend" },
];

export default function Dashboard() {
  const { user, patchUser } = useAuth();
  const [stats, setStats] = useState({
    totalApps: 0,
    totalUsers: 0,
    amountSpent: 0,
  });
  const [billingSummary, setBillingSummary] = useState({
    availableBalanceGhs: 0,
    currentBalanceGhs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [smsOfferings, setSmsOfferings] = useState([]);
  const [smsSaving, setSmsSaving] = useState(false);
  const [smsError, setSmsError] = useState("");
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsLogsError, setSmsLogsError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      setSmsLogsError("");
      const logsReq = api
        .get("/api/portal/sms-logs", { params: { limit: 100 } })
        .then((r) => r)
        .catch(() => null);

      try {
        const [appsRes, usersRes, billingRes, offeringsRes, logsRes] = await Promise.all([
          api.get("/api/clients"),
          api.get("/api/users"),
          api.get("/api/portal/billing/summary"),
          api.get("/api/portal/sms-provider-offerings"),
          logsReq,
        ]);

        const apps = appsRes.data.data;
        const users = usersRes.data.data;
        const billing = billingRes.data?.data;

        setStats({
          totalApps: Array.isArray(apps) ? apps.length : 0,
          totalUsers: Array.isArray(users) ? users.length : 0,
          amountSpent: billing != null ? Number(billing.totalSmsSpendGhs) : 0,
        });
        const avail =
          billing?.availableBalanceGhs != null ? Number(billing.availableBalanceGhs) : Number(billing?.balanceGhs ?? 0);
        const cur =
          billing?.currentBalanceGhs != null ? Number(billing.currentBalanceGhs) : Number(billing?.balanceGhs ?? 0);
        setBillingSummary({ availableBalanceGhs: avail, currentBalanceGhs: cur });
        setSmsOfferings(Array.isArray(offeringsRes.data.data) ? offeringsRes.data.data : []);

        if (logsRes && Array.isArray(logsRes.data?.data)) {
          setSmsLogs(logsRes.data.data);
        } else if (!logsRes) {
          setSmsLogs([]);
          setSmsLogsError("Could not load SMS activity.");
        } else {
          setSmsLogs([]);
        }
      } catch {
        /* stats fail silently */
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  async function handleSmsChange(rawValue) {
    const preferredSmsOfferingId = rawValue === "" ? null : rawValue;
    setSmsError("");
    setSmsSaving(true);
    try {
      const res = await api.put("/api/portal/account/sms-preference", { preferredSmsOfferingId });
      const updated = res.data?.data;
      if (updated) {
        patchUser({
          preferredSmsOfferingId: updated.preferredSmsOfferingId ?? null,
        });
      }
    } catch (err) {
      setSmsError(err.response?.data?.message || "Could not update SMS provider");
    } finally {
      setSmsSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((card) => (
              <div key={card.key} className="bg-white rounded-xl shadow-sm p-5">
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {card.key === "amountSpent"
                    ? moneyFormatter.format(stats[card.key])
                    : stats[card.key]}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Available balance</p>
                <p className="text-3xl font-semibold text-gray-900 mt-1 tabular-nums">
                  {moneyFormatter.format(billingSummary.availableBalanceGhs)}
                </p>
                <p className="text-sm text-gray-500 mt-3">
                  Current balance{" "}
                  <span className="text-gray-900 font-medium tabular-nums">
                    {moneyFormatter.format(billingSummary.currentBalanceGhs)}
                  </span>
                </p>
              </div>
              <p className="text-xs text-gray-500 max-w-md lg:text-right leading-relaxed">
                Available balance is the amount you can spend on OTP SMS now. Current balance is your ledger balance;
                when holds or pending charges exist, these may differ (common pattern on banking dashboards).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 max-w-lg">
            <h2 className="text-sm font-medium text-gray-900 mb-1">SMS provider</h2>
            <p className="text-xs text-gray-500 mb-3">
              Applies to every app on your account. If you don&apos;t choose an offering, OTP SMS uses the
              platform&apos;s enabled Hubtel catalog entry and billing uses that offering&apos;s price per SMS.
              Otherwise billing follows your selected offering.
            </p>
            {smsError && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{smsError}</div>
            )}
            <select
              value={user?.preferredSmsOfferingId ?? ""}
              onChange={(e) => handleSmsChange(e.target.value)}
              disabled={smsSaving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent bg-white disabled:opacity-60"
            >
              <option value="">Platform default (Hubtel)</option>
              {smsOfferings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.displayName} ({o.provider}) — GHS {Number(o.pricePerSms ?? 0).toFixed(2)} / SMS
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 overflow-x-auto">
            <h2 className="text-sm font-medium text-gray-900 mb-1">SMS activity</h2>
            <p className="text-xs text-gray-500 mb-4">
              Recent OTP SMS sends across your apps (provider, charge when billed, status, app, phone).
            </p>
            {smsLogsError && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{smsLogsError}</div>
            )}
            {!smsLogsError && smsLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No SMS sends recorded yet.</p>
            ) : (
              <table className="w-full text-sm text-left min-w-[640px]">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="pb-3 pr-3 font-medium whitespace-nowrap">Time</th>
                    <th className="pb-3 pr-3 font-medium">App</th>
                    <th className="pb-3 pr-3 font-medium whitespace-nowrap">Phone</th>
                    <th className="pb-3 pr-3 font-medium">Provider</th>
                    <th className="pb-3 pr-3 font-medium whitespace-nowrap">Status</th>
                    <th className="pb-3 font-medium text-right whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {smsLogs.map((row) => (
                    <tr key={row.id} className="text-gray-800">
                      <td className="py-3 pr-3 whitespace-nowrap text-gray-600">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 pr-3">{row.clientName ?? "—"}</td>
                      <td className="py-3 pr-3 font-mono text-xs">{row.phone ?? "—"}</td>
                      <td className="py-3 pr-3">
                        <span className="text-gray-900">{row.providerLabel || row.provider || "—"}</span>
                        {row.offeringDisplayName ? (
                          <span className="block text-xs text-gray-500 mt-0.5">{row.offeringDisplayName}</span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-3">
                        <span
                          className={
                            String(row.status).toUpperCase() === "SENT"
                              ? "inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800"
                              : "inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800"
                          }
                        >
                          {row.status ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 text-right whitespace-nowrap">
                        {row.chargeAmountGhs != null && row.chargeAmountGhs !== ""
                          ? `GHS ${Number(row.chargeAmountGhs).toFixed(2)}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
