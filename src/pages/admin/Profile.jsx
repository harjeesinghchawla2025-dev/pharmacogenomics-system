
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api.js";
import { useAuth } from "../AuthContext.jsx";
import "../auth.css";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    email: "",
    studentId: "",
    role: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await apiRequest("/profile");
        setProfile((previous) => ({
          ...previous,
          ...data.profile,
        }));
      } catch (err) {
        setError(err.message || "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const data = await apiRequest("/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });

      if (data.profile) {
        setProfile((previous) => ({
          ...previous,
          ...data.profile,
        }));
      }

      setMessage(data.message || "Profile updated successfully!");
    } catch (err) {
      setError(err.message || "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (loading) {
    return <div className="auth-page">Loading your profile...</div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>My Profile</h1>
        <p>View and update your account information.</p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input id="email" value={profile.email || user?.email || ""} disabled />

          <label htmlFor="studentId">Student ID</label>
          <input
            id="studentId"
            value={profile.studentId || profile.student_id || ""}
            disabled
          />

          <label htmlFor="role">Role</label>
          <input
            id="role"
            value={profile.role || user?.role || "Patient"}
            disabled
          />

          <label htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            value={profile.firstName || ""}
            onChange={handleChange}
            required
          />

          <label htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            value={profile.lastName || ""}
            onChange={handleChange}
          />

          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={profile.phone || ""}
            onChange={handleChange}
          />

          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={profile.dateOfBirth || ""}
            onChange={handleChange}
          />

          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={profile.gender || ""}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>

          <label htmlFor="address">Address</label>
          <textarea
            id="address"
            name="address"
            value={profile.address || ""}
            onChange={handleChange}
            rows={3}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>

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

