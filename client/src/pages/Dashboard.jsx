import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateMediVaultId } from "./Settings";

function ActionCard({ icon, title, subtitle, color, onClick }) {
  return (
    <div style={{ ...card, borderLeft: `4px solid ${color}` }} onClick={onClick}>
      <div style={{ ...iconBox, background: color + "18" }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <p style={cardTitle}>{title}</p>
        <p style={cardSub}>{subtitle}</p>
      </div>
      <span style={chevron}>&#8250;</span>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
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

  const actions = [
    {
      icon: "👤",
      title: "My Emergency Profile",
      subtitle: "View and edit your critical data",
      color: "#2563eb",
      route: "/profile",
    },
    {
      icon: "🚨",
      title: "Emergency Access",
      subtitle: "Generate QR or Pin for doctors",
      color: "#16a34a",
      route: "/emergency",
    },
    {
      icon: "💊",
      title: "Medical Details",
      subtitle: "Update allergies, meds, etc.",
      color: "#f59e0b",
      route: "/medical",
    },
    {
      icon: "📋",
      title: "Access History",
      subtitle: "See who accessed your data",
      color: "#7c3aed",
      route: "/history",
    },
  ];

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Header */}
        <div style={header}>
          <div>
            <p style={headerName}>{user.name}</p>
            <p style={headerSub}>MediVault ID • {generateMediVaultId(user.name, user.id)}</p>
          </div>
          <button style={settingsBtn} onClick={() => navigate("/settings")}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "8px 20px 32px" }}>
          <p style={actionsLabel}>ACTIONS</p>
          {actions.map((a) => (
            <ActionCard key={a.route} {...a} onClick={() => navigate(a.route)} />
          ))}
        </div>

        {/* Sign out */}
        <div style={{ padding: "0 20px 28px", marginTop: "auto" }}>
          <button
            style={signOutBtn}
            onClick={() => { localStorage.clear(); navigate("/"); }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const header = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "22px 20px 14px", borderBottom: "1px solid #f3f4f6",
};
const headerName = { fontSize: 19, fontWeight: 700, color: "#1a1a2e" };
const headerSub = { fontSize: 12, color: "#9ca3af", marginTop: 2 };
const settingsBtn = {
  background: "none", border: "none", cursor: "pointer",
  padding: 6, borderRadius: 8,
};
const actionsLabel = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", marginBottom: 12,
};
const card = {
  display: "flex", alignItems: "center", gap: 14,
  background: "#fff", borderRadius: 12,
  padding: "16px 14px", marginBottom: 10,
  cursor: "pointer", border: "1px solid #f3f4f6",
  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  transition: "box-shadow 0.15s",
};
const iconBox = {
  width: 44, height: 44, borderRadius: 10,
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
};
const cardTitle = { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 2 };
const cardSub = { fontSize: 12, color: "#9ca3af" };
const chevron = { fontSize: 20, color: "#d1d5db", fontWeight: 300 };
const signOutBtn = {
  background: "none", border: "1px solid #e5e7eb",
  borderRadius: 10, padding: "12px 0", width: "100%",
  color: "#ef4444", fontSize: 14, fontWeight: 600,
  cursor: "pointer", fontFamily: "Inter, sans-serif",
};