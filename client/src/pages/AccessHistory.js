import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

function HistoryCard({ hospital_name, doctor_name, department, status, accessed_at, method, notes }) {
    const isActive = status?.toLowerCase() === "active";
    const isPrescription = method === "Prescription Update";
    const [expanded, setExpanded] = useState(false);

    // Parse the notes JSON if present
    let parsedNotes = null;
    if (notes) {
        try { parsedNotes = typeof notes === "string" ? JSON.parse(notes) : notes; } catch {}
    }
    const hasNotes = parsedNotes && (
        (parsedNotes.medications_added?.length > 0) ||
        (parsedNotes.conditions_added?.length > 0) ||
        parsedNotes.clinical_notes
    );

    const formatDate = (iso) => {
        if (!iso) return "—";
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (isToday) return `Today, ${time}`;
        return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
    };

    return (
        <div style={{ ...card, borderLeft: isPrescription ? "3px solid #2563eb" : "none" }}>
            <div style={cardTop}>
                <span style={hospitalLabel}>{hospital_name || "Unknown Hospital"}</span>
                <span
                    className={
                        isPrescription ? "mv-badge-prescription" :
                        isActive ? "mv-badge-active" : "mv-badge-signed"
                    }
                    style={isPrescription ? { background: "#eff6ff", color: "#2563eb", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 6 } : undefined}
                >
                    {isPrescription ? "📝 Updated" : isActive ? "Active" : (status || "Signed")}
                </span>
            </div>
            {doctor_name && (
                <p style={doctorInfo}>
                    {doctor_name}{department ? ` · ${department}` : ""}
                </p>
            )}
            <div style={cardMeta}>
                <span style={metaItem}>
                    <span style={metaIcon}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </span>
                    {formatDate(accessed_at)}
                </span>
                <span style={metaDot}>·</span>
                <span style={metaItem}>
                    <span style={metaIcon}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </span>
                    {method || "—"}
                </span>
            </div>

            {/* Expandable notes section */}
            {hasNotes && (
                <>
                    <button style={notesToggleBtn} onClick={() => setExpanded(!expanded)}>
                        {expanded ? "Hide Details ▴" : "View Changes ▾"}
                    </button>
                    {expanded && (
                        <div style={notesDetail}>
                            {parsedNotes.medications_added?.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                    <p style={notesSubLabel}>Medications Prescribed</p>
                                    {parsedNotes.medications_added.map((m, i) => (
                                        <div key={i} style={notesMedItem}>
                                            <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a2e" }}>
                                                {typeof m === "string" ? m : m.name}
                                            </span>
                                            {m.dosage && <span style={{ fontSize: 12, color: "#6b7280" }}>{m.dosage}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {parsedNotes.conditions_added?.length > 0 && (
                                <div style={{ marginBottom: 10 }}>
                                    <p style={notesSubLabel}>Diagnoses Added</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                        {parsedNotes.conditions_added.map((c, i) => (
                                            <span key={i} style={notesCondTag}>{c}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {parsedNotes.clinical_notes && (
                                <div>
                                    <p style={notesSubLabel}>Clinical Notes</p>
                                    <p style={notesClinical}>{parsedNotes.clinical_notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function AccessHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem("user");
        if (!stored) return navigate("/");
        try {
            const user = JSON.parse(stored);
            if (!user?.id) return navigate("/");

            // Fetch real access logs from the API
            API.get(`/emergency/history?user_id=${user.id}`)
                .then(res => {
                    setHistory(res.data || []);
                })
                .catch(() => {
                    setHistory([]);
                })
                .finally(() => setLoading(false));
        } catch {
            navigate("/");
        }
    }, [navigate]);

    return (
        <div className="mv-shell">
            <div className="mv-page">
                {/* Topbar */}
                <div className="mv-topbar">
                    <button className="mv-topbar-back" onClick={() => navigate("/dashboard")}>&#8592;</button>
                    <span className="mv-topbar-title">Access History</span>
                </div>

                <div style={{ padding: "4px 20px 32px" }}>
                    {loading && <p style={emptyText}>Loading...</p>}

                    {!loading && history.length === 0 && (
                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 8 }}>
                                No access history
                            </p>
                            <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6 }}>
                                When someone accesses your emergency profile, it will appear here.
                            </p>
                        </div>
                    )}

                    {history.map(h => (
                        <HistoryCard key={h.id} {...h} />
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const card = {
    background: "#fff", borderRadius: 12,
    padding: "16px 14px", marginBottom: 10,
    border: "1px solid #f3f4f6",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
};
const cardTop = {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
};
const hospitalLabel = { fontSize: 14, fontWeight: 600, color: "#1a1a2e" };
const doctorInfo = { fontSize: 12, color: "#6b7280", marginBottom: 6 };
const cardMeta = { display: "flex", alignItems: "center", gap: 6 };
const metaItem = { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9ca3af" };
const metaIcon = { display: "flex", alignItems: "center" };
const metaDot = { color: "#d1d5db", fontSize: 14 };
const emptyText = { fontSize: 14, color: "#9ca3af", textAlign: "center", paddingTop: 40 };

/* Notes display styles */
const notesToggleBtn = {
    background: "none", border: "none", color: "#2563eb",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "Inter, sans-serif", padding: "6px 0 0",
    textAlign: "left",
};
const notesDetail = {
    background: "#f9fafb", borderRadius: 10,
    padding: "12px 14px", marginTop: 10,
    border: "1px solid #f3f4f6",
};
const notesSubLabel = {
    fontSize: 10, fontWeight: 700, color: "#9ca3af",
    letterSpacing: "0.06em", marginBottom: 6,
};
const notesMedItem = {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid #f3f4f6",
};
const notesCondTag = {
    background: "#fef3c7", color: "#92400e",
    fontSize: 11, fontWeight: 600, padding: "3px 8px",
    borderRadius: 6, border: "1px solid #fde68a",
};
const notesClinical = {
    fontSize: 13, color: "#374151", lineHeight: 1.6,
    fontStyle: "italic", background: "#fff",
    padding: "8px 10px", borderRadius: 8,
    border: "1px solid #f3f4f6",
};