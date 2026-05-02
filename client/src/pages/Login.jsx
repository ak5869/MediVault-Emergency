import { useState } from "react";
import API from "../api/api";
import { useNavigate } from "react-router-dom";

/* ─── OTP Modal ─────────────────────────────────────────────────────────────── */
function OtpModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setErr(null); setMsg(null); setLoading(true);
    try {
      await API.post("/auth/send-otp", { email });
      setMsg("OTP sent! Check the server console (dev mode).");
      setStep(2);
    } catch (e) { setErr(e.response?.data?.message || "Failed to send OTP."); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    setErr(null); setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      onSuccess();
    } catch (e) { setErr(e.response?.data?.message || "Invalid OTP."); }
    finally { setLoading(false); }
  };

  return (
    <div style={overlay}>
      <div style={mdl}>
        <p style={mdlTitle}>Login with OTP</p>
        {err && <div className="mv-error">{err}</div>}
        {msg && <div className="mv-success">{msg}</div>}
        {step === 1 ? (
          <>
            <div className="mv-input-wrap">
              <label className="mv-input-label">Registered email</label>
              <input className="mv-input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className="mv-btn-primary" onClick={sendOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <div className="mv-input-wrap">
              <label className="mv-input-label">Enter the 6-digit OTP</label>
              <input className="mv-input" placeholder="123456" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value)} />
            </div>
            <button className="mv-btn-primary" onClick={verifyOtp} disabled={loading}
              style={{ marginBottom: 8 }}>
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button className="mv-btn-outline" onClick={() => setStep(1)}>Resend OTP</button>
          </>
        )}
        <p style={cancelLnk} onClick={onClose}>Cancel</p>
      </div>
    </div>
  );
}

/* ─── Forgot Password Modal ──────────────────────────────────────────────────── */
function ForgotModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const reset = async () => {
    setErr(null); setMsg(null);
    if (newPassword !== confirm) return setErr("Passwords do not match.");
    if (newPassword.length < 6) return setErr("Min 6 characters.");
    setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email, newPassword });
      setMsg(res.data.message);
    } catch (e) { setErr(e.response?.data?.message || "Reset failed."); }
    finally { setLoading(false); }
  };

  return (
    <div style={overlay}>
      <div style={mdl}>
        <p style={mdlTitle}>Reset Password</p>
        {err && <div className="mv-error">{err}</div>}
        {msg && <div className="mv-success">{msg}</div>}
        <div className="mv-input-wrap">
          <label className="mv-input-label">Registered email</label>
          <input className="mv-input" type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mv-input-wrap">
          <label className="mv-input-label">New password</label>
          <input className="mv-input" type="password" placeholder="Min 6 characters"
            value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        </div>
        <div className="mv-input-wrap">
          <label className="mv-input-label">Confirm new password</label>
          <input className="mv-input" type="password" placeholder="Repeat password"
            value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        <button className="mv-btn-primary" onClick={reset} disabled={loading}>
          {loading ? "Updating..." : "Reset Password"}
        </button>
        <p style={cancelLnk} onClick={onClose}>Cancel</p>
      </div>
    </div>
  );
}

/* ─── Welcome Screen ─────────────────────────────────────────────────────────── */
function WelcomeScreen({ onLogin, onSignup, onStaff }) {
  return (
    <div className="mv-shell">
      <div className="mv-page" style={{ alignItems: "center", padding: "52px 28px 40px", background: "#ffffff" }}>
        {/* Logo */}
        <div style={logoCircle}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <path d="M18 6v24M6 18h24" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 style={welcomeTitle}>MediVault Emergency</h1>
        <p style={welcomeSub}>Secure medical data access{"\n"}when it matters most.</p>

        {/* SVG illustration */}
        <div style={illustrationWrap}>
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
            <ellipse cx="90" cy="100" rx="72" ry="60" fill="#f3f4f6" />
            <rect x="58" y="52" width="64" height="80" rx="8" fill="#e5e7eb" />
            <rect x="68" y="64" width="44" height="6" rx="3" fill="#9ca3af" />
            <rect x="68" y="75" width="36" height="6" rx="3" fill="#9ca3af" />
            <rect x="68" y="86" width="40" height="6" rx="3" fill="#9ca3af" />
            <rect x="68" y="97" width="30" height="6" rx="3" fill="#9ca3af" />
            <circle cx="90" cy="122" r="12" fill="#2563eb" />
            <path d="M85 122h10M90 117v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ width: "100%", maxWidth: 320 }}>
          <button className="mv-btn-primary" style={{ marginBottom: 12 }} onClick={onLogin}>
            Login
          </button>
          <button className="mv-btn-outline" style={{ marginBottom: 22 }} onClick={onSignup}>
            Sign Up
          </button>
          <div style={{ textAlign: "center" }}>
            <button style={staffLinkBtn} onClick={onStaff}>Login as Hospital Staff</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Login Component ───────────────────────────────────────────────────── */
export default function Login() {
  const [screen, setScreen] = useState("welcome"); // "welcome" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // "otp" | "forgot"
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) return setError("Please enter your email and password.");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  /* Welcome screen */
  if (screen === "welcome") {
    return (
      <WelcomeScreen
        onLogin={() => setScreen("login")}
        onSignup={() => navigate("/signup")}
        onStaff={() => navigate("/staff")}
      />
    );
  }

  /* Login form */
  return (
    <div className="mv-shell">
      {modal === "otp" && <OtpModal onClose={() => setModal(null)} onSuccess={() => navigate("/dashboard")} />}
      {modal === "forgot" && <ForgotModal onClose={() => setModal(null)} />}

      <div className="mv-page" style={{ background: "#ffffff" }}>
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => setScreen("welcome")}>&#8592;</button>
          <span className="mv-topbar-title">Login</span>
        </div>

        <div style={{ padding: "8px 24px 32px" }}>
          {error && <div className="mv-error">{error}</div>}

          <div className="mv-input-wrap">
            <label className="mv-input-label">Phone Number or Email</label>
            <input
              className="mv-input"
              type="email"
              placeholder="Enter your phone or email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="mv-input-wrap" style={{ marginBottom: 8 }}>
            <label className="mv-input-label">Password</label>
            <input
              className="mv-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div style={lnkRow}>
            <span style={lnkText} onClick={() => setModal("otp")}>Login with OTP</span>
            <span style={lnkText} onClick={() => setModal("forgot")}>Forgot Password?</span>
          </div>

          <button
            className="mv-btn-primary"
            onClick={handleLogin}
            disabled={loading}
            style={{ marginTop: 4, marginBottom: 24 }}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p style={footerTxt}>
            Don't have an account?{" "}
            <span style={lnkText} onClick={() => navigate("/signup")}>Sign Up</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────────────────── */
const logoCircle = {
  width: 72, height: 72, borderRadius: "50%",
  background: "#dbeafe", border: "2px solid #bfdbfe",
  display: "flex", alignItems: "center", justifyContent: "center",
  marginBottom: 18,
};
const welcomeTitle = {
  fontSize: 22, fontWeight: 800, color: "#1a1a2e",
  textAlign: "center", marginBottom: 8,
};
const welcomeSub = {
  fontSize: 14, color: "#6b7280", textAlign: "center",
  lineHeight: 1.65, marginBottom: 20, whiteSpace: "pre-line",
};
const illustrationWrap = {
  marginBottom: 28,
  display: "flex", alignItems: "center", justifyContent: "center",
};
const staffLinkBtn = {
  background: "none", border: "none", cursor: "pointer",
  color: "#6b7280", fontSize: 13, fontFamily: "Inter, sans-serif",
  textDecoration: "underline",
};
const lnkRow = { display: "flex", justifyContent: "space-between", marginBottom: 14, marginTop: 4 };
const lnkText = { color: "#2563eb", fontSize: 13, cursor: "pointer", fontWeight: 500 };
const footerTxt = { fontSize: 14, color: "#6b7280", textAlign: "center" };
const overlay = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 999, padding: "0 20px",
};
const mdl = {
  background: "#fff", borderRadius: 16,
  padding: "28px 24px", width: "100%", maxWidth: 360,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};
const mdlTitle = { fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 };
const cancelLnk = { textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 14, cursor: "pointer" };