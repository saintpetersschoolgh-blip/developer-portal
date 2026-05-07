import { useEffect, useState } from "react";
import api from "../api/axios";

const moneyFormatter = new Intl.NumberFormat("en-GH", {
  style: "currency",
  currency: "GHS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return moneyFormatter.format(n);
}

export default function Billing() {
  const [deposits, setDeposits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchDeposits() {
    try {
      const [depRes, sumRes] = await Promise.all([
        api.get("/api/portal/account/deposits"),
        api.get("/api/portal/billing/summary"),
      ]);
      setDeposits(Array.isArray(depRes.data.data) ? depRes.data.data : []);
      setSummary(sumRes.data?.data ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDeposits(); }, []);

  async function handleDeposit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await api.post("/api/portal/account/deposits", {
        amount: Number.parseFloat(String(amount).trim()),
        reference,
      });
      setSuccess("Deposit recorded");
      setAmount("");
      setReference("");
      fetchDeposits();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to make deposit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Billing</h1>

      {!loading && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 sm:col-span-2 lg:col-span-2 border border-gray-100">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Available balance</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">
              {formatMoney(
                summary.availableBalanceGhs != null ? summary.availableBalanceGhs : summary.balanceGhs
              )}
            </p>
            <p className="text-sm text-gray-500 mt-3">
              Current balance{" "}
              <span className="text-gray-900 font-medium tabular-nums">
                {formatMoney(summary.currentBalanceGhs != null ? summary.currentBalanceGhs : summary.balanceGhs)}
              </span>
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">Total deposits (completed)</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(summary.totalDepositsGhs)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">SMS usage (successful sends)</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(summary.totalSmsSpendGhs)}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-4 max-w-lg">
        Deposits are credited to your developer account. OTP SMS charges apply across all apps you own, at your selected provider rate (Dashboard).
      </p>

      {(error || success) && (
        <div className="max-w-lg mb-4 space-y-2">
          {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</div>}
        </div>
      )}

      <form onSubmit={handleDeposit} className="bg-white rounded-xl shadow-sm p-5 space-y-4 max-w-lg mb-6">
        <h2 className="text-base font-medium">Record deposit</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (GHS)</label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            placeholder="100.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input
            type="text"
            required
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent"
            placeholder="TXN-12345"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1f2937] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Processing…" : "Record deposit"}
        </button>
      </form>

      <h2 className="text-base font-medium mb-3">Transaction History</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : deposits.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Reference</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-right whitespace-nowrap">Balance after (current)</th>
                <th className="px-5 py-3 font-medium text-right whitespace-nowrap">Balance after (available)</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deposits.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">{d.reference}</td>
                  <td className="px-5 py-3 text-gray-600 tabular-nums text-right">{formatMoney(d.amount)}</td>
                  <td className="px-5 py-3 text-gray-600 tabular-nums text-right">{formatMoney(d.currentBalance)}</td>
                  <td className="px-5 py-3 text-gray-600 tabular-nums text-right">{formatMoney(d.availableBalance)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      d.status === "COMPLETED" || d.status === "Completed" ? "bg-green-50 text-green-700" :
                      d.status === "PENDING" || d.status === "Pending" ? "bg-yellow-50 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {d.paidAt ? new Date(d.paidAt).toLocaleDateString() : new Date(d.createdAt).toLocaleDateString()}
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
