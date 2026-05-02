import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import API from "../api/api";

/* ── The patient data display after successful access ───────────────────────── */
function PatientView({ accessData, patient, staffInfo, onEnd }) {
  const conditions = Array.isArray(patient?.conditions)
    ? patient.conditions.map(c => (typeof c === "string" ? c : c.name))
    : [];

  const medications = Array.isArray(patient?.medications)
    ? patient.medications
    : [];

  const allergies = Array.isArray(patient?.allergies) ? patient.allergies : [];

  const updatedAt = patient?.updated_at
    ? new Date(patient.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  // Live countdown timer
  const [remaining, setRemaining] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!accessData?.expires_at) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(accessData.expires_at) - Date.now()) / 1000));
      const m = String(Math.floor(diff / 60)).padStart(2, "0");
      const s = String(diff % 60).padStart(2, "0");
      setRemaining(`${m}:${s}`);
      setIsUrgent(diff <= 120); // under 2 minutes

      if (diff === 0 && !endedRef.current) {
        endedRef.current = true;
        onEnd();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [accessData?.expires_at, onEnd]);

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Expiry banner with live countdown */}
        <div style={{ ...expiryBar, background: isUrgent ? "#fef2f2" : "#fef9ee", borderBottomColor: isUrgent ? "#fecaca" : "#fde68a" }}>
          <span style={{ ...expiryText, color: isUrgent ? "#dc2626" : "#d97706" }}>
            ⏱ Session expires in {remaining || "—"}
          </span>
          <button style={closeSessionBtn} onClick={onEnd}>Close Access</button>
        </div>

        <div style={{ padding: "12px 20px 32px" }}>
          {/* Accessed by info */}
          <div style={accessedByBanner}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={accessedByText}>
              Accessed by {staffInfo?.doctorName || "Staff"}
              {staffInfo?.department ? ` · ${staffInfo.department}` : ""}
              {staffInfo?.hospitalName ? ` — ${staffInfo.hospitalName}` : ""}
            </span>
          </div>

          {/* Patient header */}
          <div style={patientHeader}>
            <div>
              <p style={patientName}>{patient?.name || "Unknown Patient"}</p>
              <p style={patientMeta}>
                {patient?.blood_group || "—"}
                {patient?.emergency_contact ? ` · Emergency: ${
                  typeof patient.emergency_contact === "string" 
                    ? patient.emergency_contact 
                    : (patient.emergency_contact.phone || patient.emergency_contact.name || "On file")
                }` : ""}
              </p>
            </div>
            <div style={patientAvatar}>
              {(patient?.name || "?")[0].toUpperCase()}
            </div>
          </div>

          {/* Critical info row */}
          <div style={vitalsRow}>
            <div style={vitalBox}>
              <p style={vitalLabel}>BLOOD TYPE</p>
              <p style={{ ...vitalValue, color: "#dc2626" }}>{patient?.blood_group || "—"}</p>
            </div>
            <div style={{ ...vitalBox, borderLeftColor: "#fecaca" }}>
              <p style={vitalLabel}>CRITICAL ALLERGIES</p>
              <div>
                {allergies.length > 0 ? allergies.map(a => (
                  <span key={a} className="mv-tag mv-tag-red" style={{ margin: "2px 2px 0 0" }}>{a}</span>
                )) : <span style={{ fontSize: 12, color: "#9ca3af" }}>None reported</span>}
              </div>
            </div>
          </div>

          {/* Call emergency contact */}
          {patient?.emergency_contact && (
            <button className="mv-btn-green" style={{ marginTop: 12, marginBottom: 18 }}>
              📞 Call Emergency Contact
            </button>
          )}

          {/* Medical Conditions */}
          <p style={sectionLabel}>MEDICAL CONDITIONS</p>
          {conditions.length > 0 ? conditions.map((c, i) => (
            <div key={i} style={condCard}>
              <p style={condName}>{typeof c === "string" ? c : c.name}</p>
            </div>
          )) : (
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>No conditions recorded</p>
          )}

          {/* Medications */}
          <p style={{ ...sectionLabel, marginTop: 16 }}>CURRENT MEDICATIONS</p>
          {medications.length > 0 ? medications.map((m, i) => (
            <div key={i} style={medRow}>
              <span style={medName}>{typeof m === "string" ? m : m.name}</span>
              <span style={medDose}>{typeof m === "string" ? "" : (m.dosage || m.dose || "")}</span>
            </div>
          )) : (
            <p style={{ fontSize: 13, color: "#9ca3af" }}>No medications recorded</p>
          )}

          {updatedAt && (
            <p style={lastUpdated}>
              Profile last updated on {updatedAt}
            </p>
          )}

          {/* ── Doctor Notes & Prescriptions ─────────────────────────────── */}
          <DoctorNotesForm
            userId={accessData?.user_id}
            staffInfo={staffInfo}
            onSaved={(updated) => {
              // Refresh displayed data after save
              if (updated.medications) patient.medications = updated.medications;
              if (updated.conditions) patient.conditions = updated.conditions;
            }}
          />

          {/* End session */}
          <button className="mv-btn-danger" style={{ marginTop: 24 }} onClick={onEnd}>
            End Session
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Doctor Notes & Prescriptions Form ────────────────────────────────────── */
function DoctorNotesForm({ userId, staffInfo, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [meds, setMeds] = useState([]);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [conditions, setConditions] = useState([]);
  const [condInput, setCondInput] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const addMed = () => {
    if (!medName.trim()) return;
    setMeds([...meds, { name: medName.trim(), dosage: medDosage.trim() }]);
    setMedName(""); setMedDosage("");
  };

  const addCond = (e) => {
    if ((e.key === "Enter" || e.key === ",") && condInput.trim()) {
      e.preventDefault();
      setConditions([...conditions, condInput.trim()]);
      setCondInput("");
    }
  };

  const hasData = meds.length > 0 || conditions.length > 0 || notes.trim();

  const submit = async () => {
    if (!hasData) return;
    setSaving(true); setError(null); setSaved(false);
    try {
      const res = await API.post("/emergency/add-notes", {
        user_id: userId,
        new_medications: meds,
        new_conditions: conditions,
        notes: notes.trim(),
        doctor_name: staffInfo?.doctorName || "Staff",
        hospital_name: staffInfo?.hospitalName || "Unknown Hospital",
        department: staffInfo?.department || null,
      });
      setSaved(true);
      onSaved?.(res.data);
      // Reset form
      setMeds([]); setConditions([]); setNotes("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save notes.");
    } finally { setSaving(false); }
  };

  return (
    <div style={notesSection}>
      {/* Toggle header */}
      <button style={notesToggle} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={notesIcon}>📝</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginBottom: 2 }}>
              Add Prescriptions & Notes
            </p>
            <p style={{ fontSize: 11, color: "#9ca3af" }}>
              Tap to add medications, diagnoses, or clinical notes
            </p>
          </div>
        </div>
        <span style={{ fontSize: 18, color: "#9ca3af", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          ▾
        </span>
      </button>

      {expanded && (
        <div style={notesBody}>
          {/* Success / error */}
          {saved && <div className="mv-success" style={{ marginBottom: 12 }}>✅ Medical details saved to patient record and logged.</div>}
          {error && <div className="mv-error" style={{ marginBottom: 12 }}>{error}</div>}

          {/* Prescriptions */}
          <p style={notesSectionLabel}>NEW PRESCRIPTIONS</p>
          {meds.map((m, i) => (
            <div key={i} style={notesMedChip}>
              <span style={{ flex: 1, fontSize: 13 }}>
                <strong>{m.name}</strong>{m.dosage ? ` — ${m.dosage}` : ""}
              </span>
              <span style={{ color: "#ef4444", cursor: "pointer", fontWeight: 700, padding: "0 4px" }}
                onClick={() => setMeds(meds.filter((_, idx) => idx !== i))}>×</span>
            </div>
          ))}
          <div style={notesMedRow}>
            <input
              className="mv-input"
              style={{ flex: 2, marginBottom: 0 }}
              placeholder="Medication name"
              value={medName}
              onChange={e => setMedName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addMed()}
            />
            <input
              className="mv-input"
              style={{ flex: 1, marginBottom: 0 }}
              placeholder="Dosage"
              value={medDosage}
              onChange={e => setMedDosage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addMed()}
            />
            <button style={notesAddBtn} onClick={addMed} disabled={!medName.trim()}>+</button>
          </div>

          {/* Diagnoses */}
          <p style={{ ...notesSectionLabel, marginTop: 16 }}>NEW DIAGNOSES / CONDITIONS</p>
          <div style={notesTagWrap}>
            {conditions.map((c, i) => (
              <span key={i} className="mv-tag mv-tag-amber" style={{ cursor: "pointer" }}
                onClick={() => setConditions(conditions.filter((_, idx) => idx !== i))}>
                {c} ×
              </span>
            ))}
            <input
              style={notesTagInput}
              placeholder="Type & press Enter"
              value={condInput}
              onChange={e => setCondInput(e.target.value)}
              onKeyDown={addCond}
            />
          </div>

          {/* Clinical notes */}
          <p style={{ ...notesSectionLabel, marginTop: 16 }}>CLINICAL NOTES</p>
          <textarea
            className="mv-input"
            style={{ minHeight: 80, resize: "vertical", fontFamily: "Inter, sans-serif" }}
            placeholder="Observations, treatment plan, follow-up instructions..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Submit */}
          <button
            className="mv-btn-primary"
            style={{ marginTop: 14 }}
            onClick={submit}
            disabled={saving || !hasData}
          >
            {saving ? "Saving to Patient Record..." : "💾 Save to Patient Record"}
          </button>

          <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8, lineHeight: 1.5 }}>
            These additions will be permanently saved to the patient's medical record
            and logged in their access history.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── QR Scanner Component ─────────────────────────────────────────────────────── */
function QRScanner({ onScanned, onCancel }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [camError, setCamError] = useState(null);
  const scannedRef = useRef(false);
  const isRunningRef = useRef(false);

  useEffect(() => {
    const scannerId = "qr-reader-" + Date.now();
    if (scannerRef.current) {
      scannerRef.current.id = scannerId;
    }

    const html5Qr = new Html5Qrcode(scannerId);
    html5QrRef.current = html5Qr;

    html5Qr.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        if (scannedRef.current) return;
        scannedRef.current = true;
        const codeMatch = decodedText.match(/\d{6}/);
        const extractedCode = codeMatch ? codeMatch[0] : decodedText.trim();
        isRunningRef.current = false;
        html5Qr.stop().then(() => {
          onScanned(extractedCode);
        }).catch(() => {
          onScanned(extractedCode);
        });
      },
      () => {}
    ).then(() => {
      isRunningRef.current = true;
    }).catch((err) => {
      console.error("[QRScanner] Camera error:", err);
      setCamError("Camera access denied or unavailable. Please allow camera permissions and try again.");
    });

    return () => {
      if (html5QrRef.current && isRunningRef.current) {
        isRunningRef.current = false;
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, [onScanned]);

  return (
    <div className="mv-shell">
      <div className="mv-page">
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={onCancel}>&#8592;</button>
          <span className="mv-topbar-title">Scan QR Code</span>
        </div>

        <div style={{ padding: "12px 20px 32px" }}>
          {/* Info */}
          <div style={scanInfoBanner}>
            <p style={scanInfoText}>
              Point your camera at the patient's QR code to automatically read their access code.
            </p>
          </div>

          {camError ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
                Camera Error
              </p>
              <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 20 }}>
                {camError}
              </p>
              <button className="mv-btn-outline" onClick={onCancel}>
                Enter Code Manually
              </button>
            </div>
          ) : (
            <>
              {/* Camera viewfinder */}
              <div style={cameraContainer}>
                <div ref={scannerRef} id="qr-reader" style={{ width: "100%" }} />
              </div>

              <p style={scanHint}>
                Align the QR code within the frame
              </p>
            </>
          )}

          <button
            className="mv-btn-outline"
            style={{ marginTop: 16 }}
            onClick={onCancel}
          >
            Enter Code Manually
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Staff Entry ─────────────────────────────────────────────────────────── */
export default function Staff() {
  const [code, setCode] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalId, setHospitalId] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [department, setDepartment] = useState("");
  const [staffId, setStaffId] = useState("");
  const [accessData, setAccessData] = useState(null);
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const navigate = useNavigate();

  const staffInfo = { hospitalName, hospitalId, doctorName, department, staffId };

  const accessSystem = useCallback(async (accessCode) => {
    const codeToUse = (typeof accessCode === "string" && accessCode) ? accessCode : code;
    setError(null);

    // Validate required fields
    if (!hospitalName.trim()) return setError("Please enter the hospital name.");
    if (!doctorName.trim()) return setError("Please enter the doctor/staff name.");
    if (!codeToUse || !codeToUse.trim()) return setError("Please enter the patient's access code.");

    setLoading(true);
    try {
      const res = await API.post("/emergency/access", {
        code: codeToUse,
        hospital_name: hospitalName.trim(),
        hospital_id: hospitalId.trim(),
        doctor_name: doctorName.trim(),
        department: department.trim(),
        staff_id: staffId.trim(),
      });
      setAccessData(res.data);
      if (res.data.user_id) {
        const pRes = await API.get(`/patients?user_id=${res.data.user_id}`).catch(() => null);
        if (pRes?.data?.length > 0) setPatient(pRes.data[0]);
      }
    } catch (e) {
      setError(e.response?.data?.message || "Invalid or expired access code.");
    } finally { setLoading(false); }
  }, [code, hospitalName, hospitalId, doctorName, department, staffId]);

  const endSession = () => {
    setAccessData(null); setPatient(null);
    setCode("");
    setError(null);
  };

  const handleQrScanned = useCallback((scannedCode) => {
    setScanMode(false);
    setCode(scannedCode);
    setTimeout(() => {
      accessSystem(scannedCode);
    }, 300);
  }, [accessSystem]);

  /* ── Patient is accessed ── */
  if (accessData) {
    return <PatientView accessData={accessData} patient={patient} staffInfo={staffInfo} onEnd={endSession} />;
  }

  /* ── Camera scan mode ── */
  if (scanMode) {
    return (
      <QRScanner
        onScanned={handleQrScanned}
        onCancel={() => setScanMode(false)}
      />
    );
  }

  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Topbar */}
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => navigate("/")}>&#8592;</button>
          <span className="mv-topbar-title">Hospital Staff Portal</span>
        </div>

        <div style={{ padding: "8px 24px 32px" }}>
          {/* Auth badge */}
          <div style={authBadge}>
            <div style={lockIcon}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <p style={authTitle}>Authorized Access Only</p>
              <p style={authSub}>Provide your credentials to securely access patient emergency data. All access is logged.</p>
            </div>
          </div>

          {error && <div className="mv-error">{error}</div>}

          {/* Section: Hospital Details */}
          <p style={formSection}>HOSPITAL INFORMATION</p>

          <div className="mv-input-wrap">
            <label className="mv-input-label">Hospital Name *</label>
            <input
              className="mv-input"
              placeholder="e.g. Apollo Hospital, Chennai"
              value={hospitalName}
              onChange={e => setHospitalName(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div className="mv-input-wrap" style={{ flex: 1 }}>
              <label className="mv-input-label">Hospital ID</label>
              <input
                className="mv-input"
                placeholder="HOSP-XXXX"
                value={hospitalId}
                onChange={e => setHospitalId(e.target.value)}
              />
            </div>
            <div className="mv-input-wrap" style={{ flex: 1 }}>
              <label className="mv-input-label">Department</label>
              <select
                className="mv-input"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="">Select</option>
                <option value="Emergency">Emergency</option>
                <option value="ICU">ICU</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Surgery">Surgery</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Section: Staff Details */}
          <p style={formSection}>STAFF DETAILS</p>

          <div className="mv-input-wrap">
            <label className="mv-input-label">Doctor / Staff Name *</label>
            <input
              className="mv-input"
              placeholder="e.g. Dr. Priya Sharma"
              value={doctorName}
              onChange={e => setDoctorName(e.target.value)}
            />
          </div>

          <div className="mv-input-wrap">
            <label className="mv-input-label">Staff ID</label>
            <input
              className="mv-input"
              placeholder="e.g. DOC-12345"
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
            />
          </div>

          {/* Section: Patient Access */}
          <p style={formSection}>PATIENT ACCESS</p>

          <div className="mv-input-wrap">
            <label className="mv-input-label">Patient Access Code *</label>
            <input
              className="mv-input"
              placeholder="6-digit code"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && accessSystem()}
              style={{ letterSpacing: "0.2em", textAlign: "center", fontSize: 18 }}
            />
          </div>

          <button
            className="mv-btn-primary"
            onClick={accessSystem}
            disabled={loading}
          >
            {loading ? "Verifying Access..." : "Access Patient Records"}
          </button>

          <div className="mv-divider" />

          <button className="mv-btn-outline" onClick={() => setScanMode(true)}>
            📷 Scan QR Code Instead
          </button>

          {/* Disclaimer */}
          <p style={disclaimer}>
            By accessing this system, you confirm you are authorized medical personnel acting in the patient's interest. All access is logged and auditable.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const authBadge = {
  display: "flex", gap: 12, background: "#eff6ff",
  border: "1px solid #bfdbfe", borderRadius: 12,
  padding: "14px 14px", marginBottom: 20,
};
const lockIcon = {
  width: 36, height: 36, background: "#dbeafe", borderRadius: 8,
  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};
const authTitle = { fontSize: 13, fontWeight: 700, color: "#1d4ed8", marginBottom: 2 };
const authSub = { fontSize: 12, color: "#3b82f6", lineHeight: 1.5 };
const formSection = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", marginBottom: 8, marginTop: 18,
};
const disclaimer = {
  fontSize: 11, color: "#9ca3af", lineHeight: 1.6,
  textAlign: "center", marginTop: 20, padding: "0 8px",
};

/* patient view styles */
const expiryBar = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  background: "#fef2f2", padding: "10px 20px",
  border: "none", borderBottom: "1px solid #fecaca",
};
const expiryText = { fontSize: 12, color: "#dc2626", fontWeight: 600 };
const closeSessionBtn = {
  background: "none", border: "none", color: "#dc2626",
  fontSize: 12, fontWeight: 600, cursor: "pointer",
  fontFamily: "Inter, sans-serif",
};
const accessedByBanner = {
  display: "flex", alignItems: "center", gap: 8,
  background: "#f0fdf4", border: "1px solid #bbf7d0",
  borderRadius: 10, padding: "10px 14px", marginBottom: 14,
};
const accessedByText = { fontSize: 12, color: "#16a34a", fontWeight: 500 };
const patientHeader = {
  display: "flex", justifyContent: "space-between",
  alignItems: "center", marginBottom: 14,
};
const patientName = { fontSize: 20, fontWeight: 800, color: "#1a1a2e", marginBottom: 4 };
const patientMeta = { fontSize: 12, color: "#6b7280" };
const patientAvatar = {
  width: 48, height: 48, borderRadius: "50%",
  background: "#dbeafe", color: "#1d4ed8",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 20, fontWeight: 700,
};
const vitalsRow = { display: "flex", gap: 10, marginBottom: 4 };
const vitalBox = {
  flex: 1, background: "#fff", borderRadius: 10,
  padding: "12px 12px", border: "1px solid #f3f4f6",
  borderLeft: "3px solid #fecaca",
};
const vitalLabel = { fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.06em", marginBottom: 6 };
const vitalValue = { fontSize: 22, fontWeight: 800 };
const sectionLabel = { fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 8 };
const condCard = { background: "#f9fafb", borderRadius: 10, padding: "12px 14px", marginBottom: 8, border: "1px solid #f3f4f6" };
const condName = { fontSize: 14, fontWeight: 600, color: "#1a1a2e", marginBottom: 2 };
const medRow = { display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" };
const medName = { fontSize: 14, color: "#1a1a2e", fontWeight: 500 };
const medDose = { fontSize: 13, color: "#6b7280" };
const lastUpdated = { fontSize: 12, color: "#9ca3af", marginTop: 10 };

/* QR scanner styles */
const cameraContainer = {
  borderRadius: 16, overflow: "hidden",
  border: "2px solid #e5e7eb", background: "#000",
  marginBottom: 12,
};
const scanInfoBanner = {
  background: "#eff6ff", borderRadius: 10,
  padding: "12px 14px", marginBottom: 16,
  border: "1px solid #bfdbfe",
};
const scanInfoText = { fontSize: 12, color: "#1d4ed8", lineHeight: 1.6 };
const scanHint = {
  fontSize: 13, color: "#6b7280", textAlign: "center",
  marginTop: 4, marginBottom: 8,
};

/* Doctor notes styles */
const notesSection = {
  marginTop: 20, borderRadius: 14, overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#fff",
};
const notesToggle = {
  width: "100%", display: "flex", justifyContent: "space-between",
  alignItems: "center", padding: "14px 16px",
  background: "none", border: "none", cursor: "pointer",
  fontFamily: "Inter, sans-serif", textAlign: "left",
};
const notesIcon = {
  width: 36, height: 36, borderRadius: 10,
  background: "#fef9ee", display: "flex",
  alignItems: "center", justifyContent: "center",
  fontSize: 18, flexShrink: 0,
};
const notesBody = {
  padding: "0 16px 16px", borderTop: "1px solid #f3f4f6",
  paddingTop: 14,
};
const notesSectionLabel = {
  fontSize: 10, fontWeight: 700, color: "#9ca3af",
  letterSpacing: "0.08em", marginBottom: 8,
};
const notesMedChip = {
  display: "flex", alignItems: "center", gap: 8,
  background: "#eff6ff", border: "1px solid #bfdbfe",
  borderRadius: 8, padding: "8px 12px", marginBottom: 6,
};
const notesMedRow = {
  display: "flex", gap: 8, alignItems: "center",
};
const notesAddBtn = {
  width: 40, height: 44, borderRadius: 10,
  border: "1.5px solid #2563eb", background: "#2563eb",
  color: "#fff", fontSize: 20, fontWeight: 700,
  cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
  flexShrink: 0, fontFamily: "Inter, sans-serif",
};
const notesTagWrap = {
  display: "flex", flexWrap: "wrap", alignItems: "center",
  gap: 6, padding: "10px 12px",
  border: "1.5px solid #e5e7eb", borderRadius: 10,
  minHeight: 44, background: "#fff",
};
const notesTagInput = {
  border: "none", outline: "none", fontSize: 13,
  fontFamily: "Inter, sans-serif", background: "transparent",
  color: "#1a1a2e", minWidth: 100, flexGrow: 1,
};