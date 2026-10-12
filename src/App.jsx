
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: "30px", fontFamily: "Arial, sans-serif" }}>
      <h1>Pharmacogenomics Database Management System</h1>
      <h2>Admin Dashboard</h2>

      <p>Welcome, {user?.email || "Administrator"}!</p>

      <nav style={{ display: "flex", gap: "15px", marginBottom: "25px" }}>
        <Link to="/profile">My Profile</Link>
        <Link to="/settings">Settings</Link>
        <button onClick={logout}>Log Out</button>
      </nav>

      <div>
        <h3>System Statistics</h3>
        <p>Total Users: 250</p>
        <p>Total Patients: 180</p>
        <p>Total Doctors: 25</p>
        <p>Total Drugs: 120</p>
        <p>Total Genes: 35</p>
        <p>Total Prescriptions: 640</p>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "Admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/profile" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
