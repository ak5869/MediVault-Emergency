import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("account");
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return navigate("/");
    try {
      const parsed = JSON.parse(stored);
      if (!parsed?.id) return navigate("/");
      setUser(parsed);
    } catch { navigate("/"); }
  }, [navigate]);

  if (!user) return <div style={{ padding: 24, color: "#6b7280" }}>Loading...</div>;

  /* Generate the MediVault ID for display */
  const mvId = generateMediVaultId(user.name, user.id);

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pwForm.newPw || pwForm.newPw.length < 6)
      return setPwMsg({ type: "error", text: "New password must be at least 6 characters." });
    if (pwForm.newPw !== pwForm.confirm)
      return setPwMsg({ type: "error", text: "Passwords do not match." });

    setPwLoading(true);
    try {
      await API.post("/auth/forgot-password", {
        email: user.email,
        newPassword: pwForm.newPw,
      });
      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setPwForm({ current: "", newPw: "", confirm: "" });
    } catch (e) {
      setPwMsg({ type: "error", text: e.response?.data?.message || "Failed to update password." });
    } finally { setPwLoading(false); }
  };

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Topbar */}
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => navigate("/dashboard")}>&#8592;</button>
          <span className="mv-topbar-title">Settings</span>
        </div>

        <div style={{ padding: "0 20px 32px" }}>
          {/* User profile card */}
          <div style={profileCard}>
            <div style={avatarCircle}>
              {(user.name || "?")[0].toUpperCase()}
            </div>
            <div>
              <p style={profileName}>{user.name}</p>
              <p style={profileEmail}>{user.email}</p>
              <p style={profileId}>MediVault ID: <strong>{mvId}</strong></p>
            </div>
          </div>

          {/* Tabs */}
          <div style={tabRow}>
            {["account", "security", "about"].map(tab => (
              <button
                key={tab}
                style={{
                  ...tabBtn,
                  borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent",
                  color: activeTab === tab ? "#2563eb" : "#9ca3af",
                  fontWeight: activeTab === tab ? 700 : 500,
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "account" ? "Account" : tab === "security" ? "Security" : "About"}
              </button>
            ))}
          </div>

          {/* ── Account Tab ── */}
          {activeTab === "account" && (
            <div style={fadeIn}>
              <div style={settingItem}>
                <div style={settingIcon}>👤</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Full Name</p>
                  <p style={settingValue}>{user.name}</p>
                </div>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>📧</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Email Address</p>
                  <p style={settingValue}>{user.email}</p>
                </div>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>📱</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Phone Number</p>
                  <p style={settingValue}>{user.phone || "Not provided"}</p>
                </div>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>🆔</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>MediVault ID</p>
                  <p style={{ ...settingValue, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.05em" }}>{mvId}</p>
                </div>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>📅</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Member Since</p>
                  <p style={settingValue}>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === "security" && (
            <div style={fadeIn}>
              <p style={sectionTitle}>Change Password</p>

              {pwMsg && (
                <div
                  className={pwMsg.type === "error" ? "mv-error" : "mv-success"}
                  style={pwMsg.type === "success" ? successBanner : undefined}
                >
                  {pwMsg.text}
                </div>
              )}

              <div className="mv-input-wrap">
                <label className="mv-input-label">New Password</label>
                <input
                  className="mv-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={pwForm.newPw}
                  onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                />
              </div>

              <div className="mv-input-wrap">
                <label className="mv-input-label">Confirm New Password</label>
                <input
                  className="mv-input"
                  type="password"
                  placeholder="Repeat new password"
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                />
              </div>

              <button
                className="mv-btn-primary"
                onClick={handleChangePassword}
                disabled={pwLoading}
              >
                {pwLoading ? "Updating..." : "Update Password"}
              </button>

              <div className="mv-divider" />

              <p style={sectionTitle}>Session</p>
              <button
                className="mv-btn-danger"
                onClick={handleSignOut}
              >
                Sign Out of All Devices
              </button>
            </div>
          )}

          {/* ── About Tab ── */}
          {activeTab === "about" && (
            <div style={fadeIn}>
              <div style={aboutCard}>
                <p style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 }}>
                  MediVault
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                  Emergency Medical System v1.0
                </p>
                <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                  MediVault provides instant, secure access to your critical medical
                  information during emergencies. Share your data with authorized hospital
                  staff through QR codes or numeric access codes.
                </p>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>🔒</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Security</p>
                  <p style={settingValue}>All data encrypted, access logged</p>
                </div>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>⏱️</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Access Codes</p>
                  <p style={settingValue}>Expire after 15 minutes</p>
                </div>
              </div>

              <div style={settingItem}>
                <div style={settingIcon}>📋</div>
                <div style={{ flex: 1 }}>
                  <p style={settingLabel}>Audit Trail</p>
                  <p style={settingValue}>All access is logged with hospital details</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Generate a readable MediVault ID ─────────────────────────────────────── */
function generateMediVaultId(name, uuid) {
  // Format: MV-ABHI-7F3E (first 4 letters of name + 4 hex chars from UUID)
  const prefix = (name || "USER")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, "X");
  const suffix = (uuid || "00000000")
    .replace(/-/g, "")
    .slice(0, 4)
    .toUpperCase();
  return `MV-${prefix}-${suffix}`;
}

// Export the ID generator so Dashboard can use it too
export { generateMediVaultId };

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const fadeIn = { animation: "mvFadeIn 0.35s ease" };
const profileCard = {
  display: "flex", alignItems: "center", gap: 16,
  background: "#fff", borderRadius: 14,
  padding: "18px 16px", margin: "12px 0 16px",
  border: "1px solid #f3f4f6",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};
const avatarCircle = {
  width: 56, height: 56, borderRadius: "50%",
  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 24, fontWeight: 700, flexShrink: 0,
};
const profileName = { fontSize: 17, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 };
const profileEmail = { fontSize: 12, color: "#6b7280", marginBottom: 2 };
const profileId = { fontSize: 11, color: "#9ca3af" };
const tabRow = {
  display: "flex", gap: 0, borderBottom: "1px solid #f3f4f6",
  marginBottom: 16,
};
const tabBtn = {
  flex: 1, background: "none", border: "none",
  padding: "10px 0", fontSize: 13, cursor: "pointer",
  fontFamily: "Inter, sans-serif", transition: "all 0.2s",
};
const settingItem = {
  display: "flex", alignItems: "center", gap: 14,
  padding: "14px 0", borderBottom: "1px solid #f3f4f6",
};
const settingIcon = {
  width: 40, height: 40, borderRadius: 10,
  background: "#f3f4f6", display: "flex",
  alignItems: "center", justifyContent: "center",
  fontSize: 18, flexShrink: 0,
};
const settingLabel = { fontSize: 12, color: "#9ca3af", marginBottom: 2 };
const settingValue = { fontSize: 14, color: "#1a1a2e", fontWeight: 500 };
const sectionTitle = {
  fontSize: 14, fontWeight: 700, color: "#374151",
  marginBottom: 12, marginTop: 4,
};
const successBanner = {
  background: "#f0fdf4", color: "#16a34a",
  border: "1px solid #bbf7d0", borderRadius: 10,
  padding: "10px 14px", marginBottom: 12,
  fontSize: 13, fontWeight: 500,
};
const aboutCard = {
  background: "#eff6ff", borderRadius: 14,
  padding: "20px 18px", marginBottom: 16,
  border: "1px solid #bfdbfe",
};
