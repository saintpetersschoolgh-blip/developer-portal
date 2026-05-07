import { useEffect, useState } from "react";
import api from "../api/axios";

/** Auth flow stores full E.164 in `phone` and also stores `countryCode`; avoid double prefix in UI. */
function formatUserPhone(user) {
  const phone = user.phone?.trim() ?? "";
  if (!phone || phone === "pending") return "—";
  const cc = user.countryCode?.trim() ?? "";
  if (!cc || cc === "pending") {
    return phone;
  }
  if (phone.startsWith(cc)) {
    return phone;
  }
  if (phone.startsWith("+")) {
    return phone;
  }
  return `${cc}${phone}`;
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get("/api/users");
        setUsers(Array.isArray(res.data.data) ? res.data.data : []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Users</h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-gray-500">No users yet.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Country</th>
                <th className="px-5 py-3 font-medium">Verified</th>
                <th className="px-5 py-3 font-medium">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {formatUserPhone(user)}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {user.country === "pending" ? "—" : user.country || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {user.verifiedAt ? (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">Yes</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "—"}
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
