import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Apps from "./pages/Apps";
import ApiKeys from "./pages/ApiKeys";
import Users from "./pages/Users";
import Billing from "./pages/Billing";
import GetStarted from "./pages/GetStarted";

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/get-started" element={<GetStarted />} />
              <Route path="/apps" element={<Apps />} />
              <Route path="/api-keys" element={<ApiKeys />} />
              <Route path="/users" element={<Users />} />
              <Route path="/billing" element={<Billing />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
