import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function MedicalProfilePage() {
  const [user, setUser]       = useState(null);
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate              = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return navigate("/");
    try {
      const u = JSON.parse(stored);
      if (!u?.id) return navigate("/");
      setUser(u);
      // Fetch real patient data
      API.get(`/patients?user_id=${u.id}`)
        .then(res => {
          if (res.data?.length > 0) {
            setData(res.data[0]);
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } catch { navigate("/"); }
  }, [navigate]);

  if (!user || loading) return <div style={{ padding: 24, color: "#6b7280" }}>Loading...</div>;

  // If no patient record exists yet, show empty state
  if (!data) {
    return (
      <div className="mv-shell">
        <div className="mv-page">
          <div className="mv-topbar">
            <button className="mv-topbar-back" onClick={() => navigate("/dashboard")}>&#8592;</button>
            <span className="mv-topbar-title">Medical Profile</span>
          </div>
          <div style={{ padding: "40px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
              No medical profile yet
            </p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 24, lineHeight: 1.6 }}>
              Add your medical details so emergency responders can access your critical information.
            </p>
            <button className="mv-btn-primary" onClick={() => navigate("/medical")}>
              Add Medical Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  const bloodGroup = data.blood_group || "—";
  const allergies = data.allergies || [];
  const conditions = Array.isArray(data.conditions) ? data.conditions : [];
  const medications = Array.isArray(data.medications) ? data.medications : [];
  const emergencyContact = data.emergency_contact || {};

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Topbar */}
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => navigate("/dashboard")}>&#8592;</button>
          <span className="mv-topbar-title">Medical Profile</span>
        </div>

        <div style={{ padding: "0 20px 32px" }}>

          {/* ── Blood Group ── */}
          <div style={section}>
            <div style={sectionHeader}>
              <span className="mv-dot-blue" />
              <span style={sectionTitle}>Blood Group</span>
              <button style={editBtn} onClick={() => navigate("/medical")}>Edit</button>
            </div>
            <div style={bloodGroupBox}>
              <span style={bloodValue}>{bloodGroup}</span>
            </div>
          </div>

          <div className="mv-divider" />

          {/* ── Allergies ── */}
          <div style={section}>
            <div style={sectionHeader}>
              <span className="mv-dot-blue" />
              <span style={sectionTitle}>Allergies</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {allergies.length > 0 ? (
                allergies.map((a, i) => (
                  <span key={i} className="mv-tag mv-tag-red">{a}</span>
                ))
              ) : (
                <span style={emptyText}>No allergies recorded</span>
              )}
            </div>
          </div>

          <div className="mv-divider" />

          {/* ── Medical Conditions ── */}
          <div style={section}>
            <p style={condLabel}>Medical Conditions</p>
            {conditions.length > 0 ? (
              conditions.map((c, i) => (
                <div key={i} style={condCard}>
                  <p style={condName}>{typeof c === "string" ? c : c.name}</p>
                  {typeof c !== "string" && (c.since || c.diagnosed_on) && (
                    <p style={condSince}>{c.since || c.diagnosed_on}</p>
                  )}
                </div>
              ))
            ) : (
              <p style={emptyText}>No conditions recorded</p>
            )}
          </div>

          <div className="mv-divider" />

          {/* ── Current Medications ── */}
          <div style={section}>
            <div style={sectionHeader}>
              <span className="mv-dot-green" />
              <span style={sectionTitle}>Current Medications</span>
            </div>
            {medications.length > 0 ? (
              medications.map((m, i) => (
                <div key={i} style={medRow}>
                  <span style={medName}>{typeof m === "string" ? m : m.name}</span>
                  <span style={medDose}>{typeof m === "string" ? "" : (m.dosage || m.dose || "")}</span>
                </div>
              ))
            ) : (
              <p style={emptyText}>No medications recorded</p>
            )}
          </div>

          <div className="mv-divider" />

          {/* ── Emergency Contact ── */}
          <div style={section}>
            <div style={sectionHeader}>
              <span className="mv-dot-blue" />
              <span style={sectionTitle}>Emergency Contact</span>
            </div>
            {emergencyContact.name || emergencyContact.phone ? (
              <div style={contactRow}>
                <div>
                  <p style={contactName}>{emergencyContact.name || "—"}</p>
                  <p style={contactPhone}>{emergencyContact.phone || "—"}</p>
                </div>
                <div style={contactAvatar}>
                  {(emergencyContact.name || "?")[0].toUpperCase()}
                </div>
              </div>
            ) : (
              <p style={emptyText}>No emergency contact added</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const section    = { paddingTop: 4 };
const sectionHeader = { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 };
const sectionTitle  = { fontSize: 13, fontWeight: 700, color: "#374151", flex: 1 };
const editBtn = {
  background: "none", border: "none", color: "#2563eb",
  fontSize: 13, fontWeight: 500, cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};
const bloodGroupBox = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 72, height: 72, borderRadius: 12,
  background: "#fef2f2", border: "1.5px solid #fecaca",
};
const bloodValue = { fontSize: 28, fontWeight: 800, color: "#dc2626" };
const condLabel  = { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 };
const condCard   = {
  background: "#f9fafb", borderRadius: 10, padding: "12px 14px",
  marginBottom: 8, border: "1px solid #f3f4f6",
};
const condName   = { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 2 };
const condSince  = { fontSize: 12, color: "#9ca3af" };
const medRow     = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "10px 0", borderBottom: "1px solid #f3f4f6",
};
const medName    = { fontSize: 14, color: "#1a1a2e", fontWeight: 500 };
const medDose    = { fontSize: 13, color: "#6b7280" };
const contactRow = { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 };
const contactName  = { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 2 };
const contactPhone = { fontSize: 13, color: "#6b7280" };
const contactAvatar = {
  width: 40, height: 40, borderRadius: "50%",
  background: "#d1fae5", color: "#065f46",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 16, fontWeight: 700, flexShrink: 0,
};
const emptyText = { fontSize: 13, color: "#9ca3af", fontStyle: "italic" };