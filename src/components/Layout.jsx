import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PlatformApiKeyBanner from "./PlatformApiKeyBanner";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/apps", label: "Apps" },
  { to: "/api-keys", label: "API Keys" },
  { to: "/users", label: "Users" },
  { to: "/billing", label: "Billing" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-[#111827] text-white flex flex-col shrink-0">
        <div className="px-5 py-6 text-lg font-semibold tracking-tight border-b border-white/10">
          IdentityEngine
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name || user?.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[#f9fafb] p-6">
          <PlatformApiKeyBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
