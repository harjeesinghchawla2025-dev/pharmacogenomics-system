
import { useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import "../auth.css";

export default function Settings() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState("");

  function handleLogout() {
    logout();
    window.location.href = "/login";
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Account Settings</h1>
        <p>Manage your Pharmacogenomics account.</p>

        <div className="settings-section">
          <h3>Account Information</h3>
          <p>
            <strong>Email:</strong> {user?.email || "Not available"}
          </p>
          <p>
            <strong>Role:</strong> {user?.role || "Patient"}
          </p>
        </div>

        <div className="settings-section">
          <h3>Security</h3>
          <p>
            Your account uses password-based login and an authentication
            token to protect access to your profile.
          </p>
          <p>
            To change your password, use your administrator's approved
            password-reset process. A password-change feature has not
            been connected yet.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setMessage(
              "For password changes, contact your system administrator."
            )
          }
        >
          Password Help
        </button>

        {message && <p className="auth-success">{message}</p>}

        <button
          type="button"
          className="secondary-button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}

