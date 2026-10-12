
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import "../auth.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        studentId: form.studentId.trim(),
        phone: form.phone,
        password: form.password,
      });

      alert("Registration successful! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p>Join the Pharmacogenomics Database System.</p>

        {error && <div className="auth-error">{error}</div>}

        <label htmlFor="firstName">First Name</label>
        <input
          id="firstName"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          placeholder="Enter first name"
          required
        />

        <label htmlFor="lastName">Last Name</label>
        <input
          id="lastName"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          placeholder="Enter last name"
          required
        />

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Enter email"
          required
        />

        <label htmlFor="studentId">Student ID</label>
        <input
          id="studentId"
          name="studentId"
          value={form.studentId}
          onChange={handleChange}
          placeholder="Enter student ID"
          required
        />

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={form.phone}
          onChange={handleChange}
          placeholder="10-digit phone number"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          value={form.password}
          onChange={handleChange}
          placeholder="At least 8 characters"
          required
        />

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="Re-enter password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}

