import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Signup() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSignup = async () => {
    setError(null);
    if (!form.name || !form.email || !form.password)
      return setError("Name, email and password are required.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");
    setLoading(true);
    try {
      const res = await API.post("/auth/register", form);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Signup failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Topbar */}
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => navigate("/")}>&#8592;</button>
          <span className="mv-topbar-title">Create Account</span>
        </div>

        <div style={{ padding: "8px 24px 32px" }}>
          {error && <div className="mv-error">{error}</div>}

          <div className="mv-input-wrap">
            <label className="mv-input-label">Full Name</label>
            <input
              className="mv-input"
              placeholder="John Doe"
              value={form.name}
              onChange={set("name")}
            />
          </div>

          <div className="mv-input-wrap">
            <label className="mv-input-label">Phone Number (for OTP)</label>
            <input
              className="mv-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={set("phone")}
            />
          </div>

          <div className="mv-input-wrap">
            <label className="mv-input-label">Email Address (Optional)</label>
            <input
              className="mv-input"
              type="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={set("email")}
            />
          </div>

          <div className="mv-input-wrap" style={{ marginBottom: 6 }}>
            <label className="mv-input-label">Password</label>
            <input
              className="mv-input"
              type="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={set("password")}
            />
          </div>

          <p style={termsText}>
            I agree to the{" "}
            <span style={linkText}>Terms of Service</span> and{" "}
            <span style={linkText}>Privacy Policy</span>
          </p>

          <button
            className="mv-btn-primary"
            onClick={handleSignup}
            disabled={loading}
            style={{ marginTop: 16, marginBottom: 20 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p style={footerText}>
            Already have an account?{" "}
            <span style={linkText} onClick={() => navigate("/")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}

const termsText = { fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginTop: 6 };
const linkText = { color: "#2563eb", cursor: "pointer", fontWeight: 500 };
const footerText = { fontSize: 14, color: "#6b7280", textAlign: "center" };