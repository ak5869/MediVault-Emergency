import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import API from "../api/api";

/* ── Real scannable QR code ───────────────────────────────────────────────── */
function QRDisplay({ code }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!code) return;
    QRCode.toDataURL(code, {
      width: 220,
      margin: 2,
      color: { dark: "#1a1a2e", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setSrc).catch(() => {});
  }, [code]);

  if (!src) return <div style={{ width: 220, height: 220, background: "#f3f4f6", borderRadius: 12 }} />;
  return <img src={src} alt="QR Code" width={220} height={220} style={{ borderRadius: 12 }} />;
}

/* ── Countdown timer ─────────────────────────────────────────────────────────── */
function useCountdown(expiresAt) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setSecs(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return { display: `${m}:${s}`, expired: secs === 0 && !!expiresAt };
}

/* ── Tab button ──────────────────────────────────────────────────────────────── */
function Tab({ label, active, onClick }) {
  return (
    <button
      style={{
        flex: 1, padding: "9px 0",
        background: active ? "#2563eb" : "transparent",
        color: active ? "#fff" : "#6b7280",
        border: "none", borderRadius: 8,
        fontSize: 13, fontWeight: 600,
        cursor: "pointer", fontFamily: "Inter, sans-serif",
        transition: "all 0.2s",
      }}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function EmergencyAccess() {
  const [tab,       setTab]       = useState("qr");       // "qr" | "code"
  const [token,     setToken]     = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [revoked,   setRevoked]   = useState(false);
  const [autoExpired, setAutoExpired] = useState(false);
  const revokedRef = useRef(false);
  const navigate                  = useNavigate();
  const { display, expired }      = useCountdown(token?.expires_at);

  const generate = async () => {
    setError(null); setRevoked(false); setAutoExpired(false);
    revokedRef.current = false;
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) return navigate("/");
      const res = await API.post("/emergency/generate", { userId: user.id });
      setToken(res.data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to generate access.");
    } finally { setLoading(false); }
  };

  // Call server to deactivate the token in the DB
  const revokeOnServer = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.id && token?.id) {
        await API.post("/emergency/revoke", {
          userId: user.id,
          tokenId: token.id,
        });
      }
    } catch { /* best effort */ }
  };

  const revokeAccess = async () => {
    if (revokedRef.current) return;
    revokedRef.current = true;
    await revokeOnServer();
    setToken(null);
    setRevoked(true);
  };

  // Auto-revoke when countdown hits zero
  useEffect(() => {
    if (expired && token && !revokedRef.current) {
      revokedRef.current = true;
      revokeOnServer().then(() => {
        setToken(null);
        setAutoExpired(true);
      });
    }
  }, [expired, token]);

  const formatTime = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Topbar */}
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => navigate("/dashboard")}>&#8592;</button>
          <span className="mv-topbar-title">Emergency Access</span>
        </div>

        <div style={{ padding: "0 20px 32px" }}>

          {/* Info banner */}
          <div style={infoBanner}>
            <p style={infoText}>
              Only share this with registered medical professionals in case of an emergency.
              Access expires in 15 minutes.
            </p>
          </div>

          {/* Tab switcher */}
          <div style={tabBar}>
            <Tab label="QR Code"      active={tab === "qr"}   onClick={() => setTab("qr")} />
            <Tab label="Numeric Code" active={tab === "code"} onClick={() => setTab("code")} />
          </div>

          {error && <div className="mv-error" style={{ marginTop: 12 }}>{error}</div>}

          {/* Content area */}
          <div style={contentBox}>
            {!token ? (
              /* ── No active token ── */
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={inactiveDot} />
                <p style={inactiveTitle}>No active access</p>
                <p style={inactiveSub}>Tap the button below to generate{"\n"}a secure access code</p>
                <button
                  className="mv-btn-primary"
                  style={{ marginTop: 24 }}
                  onClick={generate}
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Access"}
                </button>
              </div>
            ) : tab === "qr" ? (
              /* ── QR Tab ── */
              <div style={{ textAlign: "center" }}>
                <div style={qrBox}>
                  <QRDisplay code={token.code} />
                </div>
                <p style={qrSub}>Scan at hospital reception</p>

                {/* Timer */}
                <div style={timerBox}>
                  <span style={timerLabel}>VALID FOR</span>
                  <span style={{ ...timerValue, color: expired ? "#ef4444" : "#ef4444" }}>
                    {display}
                  </span>
                </div>

                <button className="mv-btn-danger" style={{ marginTop: 16 }} onClick={revokeAccess}>
                  Revoke Access
                </button>
              </div>
            ) : (
              /* ── Numeric Code Tab ── */
              <div style={{ textAlign: "center" }}>
                <div style={codeBox}>
                  <p style={codeLabel}>Your Access Code</p>
                  <p style={codeValue}>{token.code}</p>
                  <p style={codeExpiry}>Expires at {formatTime(token.expires_at)}</p>
                </div>

                {/* Timer */}
                <div style={timerBox}>
                  <span style={timerLabel}>VALID FOR</span>
                  <span style={{ ...timerValue, color: expired ? "#ef4444" : "#ef4444" }}>
                    {display}
                  </span>
                </div>

                <button className="mv-btn-danger" style={{ marginTop: 16 }} onClick={revokeAccess}>
                  Revoke Access
                </button>
              </div>
            )}

            {revoked && (
              <div className="mv-success" style={{ marginTop: 12 }}>
                ✅ Access has been revoked. The code is no longer usable. Generate a new one when needed.
              </div>
            )}

            {autoExpired && (
              <div className="mv-error" style={{ marginTop: 12 }}>
                ⏰ Access code expired automatically after 15 minutes and has been deactivated.
              </div>
            )}
          </div>

          {/* Regenerate when expired or auto-expired */}
          {(autoExpired || revoked) && (
            <button className="mv-btn-outline" style={{ marginTop: 12 }} onClick={generate}>
              Generate New Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const infoBanner = {
  background: "#eff6ff", borderRadius: 10,
  padding: "12px 14px", marginBottom: 18,
  border: "1px solid #bfdbfe",
};
const infoText = { fontSize: 12, color: "#1d4ed8", lineHeight: 1.6 };
const tabBar   = {
  display: "flex", background: "#f3f4f6",
  borderRadius: 10, padding: 3, marginBottom: 18,
};
const contentBox = {
  background: "#f9fafb", borderRadius: 14,
  padding: "20px 16px", border: "1px solid #f3f4f6",
};
const inactiveDot = {
  width: 48, height: 48, borderRadius: "50%",
  background: "#e5e7eb", margin: "0 auto 14px",
};
const inactiveTitle = { fontSize: 16, fontWeight: 700, color: "#374151", marginBottom: 6 };
const inactiveSub   = { fontSize: 13, color: "#9ca3af", lineHeight: 1.6, whiteSpace: "pre-line" };
const qrBox = {
  display: "inline-flex", padding: 16,
  background: "#fff", borderRadius: 14,
  border: "1px solid #e5e7eb", marginBottom: 10,
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};
const qrSub      = { fontSize: 12, color: "#9ca3af", marginBottom: 16 };
const timerBox   = {
  display: "flex", flexDirection: "column",
  alignItems: "center", background: "#fff",
  borderRadius: 10, padding: "10px 20px",
  border: "1px solid #f3f4f6", margin: "0 auto",
  width: "fit-content",
};
const timerLabel = { fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em" };
const timerValue = { fontSize: 32, fontWeight: 800, letterSpacing: "0.04em" };
const codeBox = {
  background: "#fff", borderRadius: 12,
  padding: "20px 16px", marginBottom: 16,
  border: "1px solid #e5e7eb",
};
const codeLabel  = { fontSize: 12, color: "#9ca3af", marginBottom: 10 };
const codeValue  = {
  fontSize: 36, fontWeight: 800, color: "#1a1a2e",
  letterSpacing: "0.25em", marginBottom: 8,
};
const codeExpiry = { fontSize: 12, color: "#9ca3af" };