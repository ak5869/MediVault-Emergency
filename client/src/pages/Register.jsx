import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

/* ── Stepper indicator ─────────────────────────────────────────────────────── */
function StepIndicator({ current, total }) {
  const labels = ["Account", "Medical Profile", "Medical History"];
  return (
    <div style={stepperWrap}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} style={stepItem}>
            <div
              style={{
                ...stepCircle,
                background: done ? "#2563eb" : active ? "#2563eb" : "#e5e7eb",
                color: done || active ? "#fff" : "#9ca3af",
                boxShadow: active ? "0 0 0 4px #bfdbfe" : "none",
              }}
            >
              {done ? "✓" : i + 1}
            </div>
            <span
              style={{
                ...stepLabel,
                color: done || active ? "#2563eb" : "#9ca3af",
                fontWeight: active ? 700 : 500,
              }}
            >
              {labels[i]}
            </span>
            {i < total - 1 && (
              <div
                style={{
                  ...stepLine,
                  background: done ? "#2563eb" : "#e5e7eb",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Tag input component (reusable) ────────────────────────────────────────── */
function TagInput({ label, color, items, onAdd, onRemove, placeholder }) {
  const [input, setInput] = useState("");
  const colorMap = {
    red: "mv-tag mv-tag-red",
    amber: "mv-tag mv-tag-amber",
    blue: "mv-tag mv-tag-blue",
    green: "mv-tag mv-tag-green",
  };
  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };
  return (
    <div style={{ marginBottom: 16 }}>
      <label className="mv-input-label" style={{ marginBottom: 6 }}>
        {label}
      </label>
      <div style={tagContainer}>
        {items.map((item, i) => (
          <span
            key={i}
            className={colorMap[color]}
            style={{ cursor: "pointer", userSelect: "none" }}
            onClick={() => onRemove(i)}
          >
            {item} ×
          </span>
        ))}
        <input
          style={tagInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "Type & press Enter"}
        />
      </div>
    </div>
  );
}

/* ── Medication row input ──────────────────────────────────────────────────── */
function MedicationInput({ medications, onAdd, onRemove }) {
  const [med, setMed] = useState({ name: "", dosage: "" });

  const add = () => {
    if (med.name.trim()) {
      onAdd({ name: med.name.trim(), dosage: med.dosage.trim() });
      setMed({ name: "", dosage: "" });
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label className="mv-input-label" style={{ marginBottom: 6 }}>
        Current Medications
      </label>
      {medications.map((m, i) => (
        <div key={i} style={medChip}>
          <span style={{ flex: 1, fontSize: 13, color: "#1a1a2e" }}>
            <strong>{m.name}</strong>
            {m.dosage ? ` — ${m.dosage}` : ""}
          </span>
          <span
            style={{
              color: "#ef4444",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
              padding: "0 4px",
            }}
            onClick={() => onRemove(i)}
          >
            ×
          </span>
        </div>
      ))}
      <div style={medInputRow}>
        <input
          className="mv-input"
          style={{ flex: 2, marginBottom: 0 }}
          placeholder="Medication name"
          value={med.name}
          onChange={(e) => setMed({ ...med, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <input
          className="mv-input"
          style={{ flex: 1, marginBottom: 0 }}
          placeholder="Dosage"
          value={med.dosage}
          onChange={(e) => setMed({ ...med, dosage: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          type="button"
          onClick={add}
          style={addBtn}
          disabled={!med.name.trim()}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN REGISTER COMPONENT                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0, 1, 2
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* Step 0 – Account */
  const [account, setAccount] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* Step 1 – Medical Profile */
  const [profile, setProfile] = useState({
    blood_group: "",
    date_of_birth: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
  });

  /* Step 2 – Medical History */
  const [history, setHistory] = useState({
    allergies: [],
    conditions: [],
    medications: [],
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  /* ── Validation helpers ──────────────────────────────────────────────────── */
  const validateStep = () => {
    setError(null);
    if (step === 0) {
      if (!account.name.trim()) return setError("Full name is required.");
      if (!account.email.trim()) return setError("Email address is required.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email))
        return setError("Please enter a valid email address.");
      if (!account.password) return setError("Password is required.");
      if (account.password.length < 6)
        return setError("Password must be at least 6 characters.");
      if (account.password !== account.confirmPassword)
        return setError("Passwords do not match.");
    }
    if (step === 1) {
      if (!profile.blood_group) return setError("Please select your blood group.");
      if (!profile.date_of_birth) return setError("Date of birth is required.");
      if (!profile.gender) return setError("Please select your gender.");
    }
    return true;
  };

  /* ── Step navigation ─────────────────────────────────────────────────────── */
  const next = async () => {
    if (validateStep() !== true) return;
    
    // Check if email already exists before moving past step 1
    if (step === 0) {
      setLoading(true);
      setError(null);
      try {
        const res = await API.post("/auth/check-email", { email: account.email });
        if (res.data.exists) {
          setError("An account with this email already exists.");
          setLoading(false);
          return;
        }
      } catch (e) {
        setError("Failed to verify email. Please try again.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    
    setStep((s) => Math.min(s + 1, 2));
  };

  const prev = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  /* ── Final submit ────────────────────────────────────────────────────────── */
  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    try {
      /* 1. Create user account */
      const res = await API.post("/auth/register", {
        name: account.name,
        email: account.email,
        password: account.password,
        phone: account.phone,
      });

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      /* 2. Save medical profile & history as patient record */
      await API.post("/patients/add", {
        user_id: res.data.user.id,
        name: account.name,
        blood_group: profile.blood_group,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        height_cm: profile.height_cm ? Number(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? Number(profile.weight_kg) : null,
        allergies: history.allergies,
        conditions: history.conditions,
        medications: history.medications,
        emergency_contact: {
          name: history.emergency_contact_name,
          phone: history.emergency_contact_phone,
        },
      });

      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Setters ─────────────────────────────────────────────────────────────── */
  const setAcc = (field) => (e) =>
    setAccount({ ...account, [field]: e.target.value });
  const setProf = (field) => (e) =>
    setProfile({ ...profile, [field]: e.target.value });
  const addTag = (field) => (val) =>
    setHistory((h) => ({ ...h, [field]: [...h[field], val] }));
  const removeTag = (field) => (i) =>
    setHistory((h) => ({
      ...h,
      [field]: h[field].filter((_, idx) => idx !== i),
    }));
  const addMed = (med) =>
    setHistory((h) => ({ ...h, medications: [...h.medications, med] }));
  const removeMed = (i) =>
    setHistory((h) => ({
      ...h,
      medications: h.medications.filter((_, idx) => idx !== i),
    }));

  /* ═══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                */
  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="mv-shell">
      <div className="mv-page">
        {/* Topbar */}
        <div className="mv-topbar">
          <button
            className="mv-topbar-back"
            onClick={() => (step > 0 ? prev() : navigate("/"))}
          >
            &#8592;
          </button>
          <span className="mv-topbar-title">
            {step === 0 && "Create Account"}
            {step === 1 && "Medical Profile"}
            {step === 2 && "Medical History"}
          </span>
        </div>

        {/* Stepper */}
        <StepIndicator current={step} total={3} />

        {/* Form area */}
        <div style={{ padding: "4px 24px 32px" }}>
          {error && <div className="mv-error">{error}</div>}

          {/* ═══ Step 0: Account ═══ */}
          {step === 0 && (
            <div style={fadeIn}>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Full Name *</label>
                <input
                  id="reg-name"
                  className="mv-input"
                  placeholder="John Doe"
                  value={account.name}
                  onChange={setAcc("name")}
                />
              </div>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Phone Number</label>
                <input
                  id="reg-phone"
                  className="mv-input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={account.phone}
                  onChange={setAcc("phone")}
                />
              </div>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Email Address *</label>
                <input
                  id="reg-email"
                  className="mv-input"
                  type="email"
                  placeholder="john@example.com"
                  value={account.email}
                  onChange={setAcc("email")}
                />
              </div>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Password *</label>
                <input
                  id="reg-password"
                  className="mv-input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={account.password}
                  onChange={setAcc("password")}
                />
              </div>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Confirm Password *</label>
                <input
                  id="reg-confirm-password"
                  className="mv-input"
                  type="password"
                  placeholder="Repeat your password"
                  value={account.confirmPassword}
                  onChange={setAcc("confirmPassword")}
                />
              </div>

              <button
                className="mv-btn-primary"
                onClick={next}
                style={{ marginTop: 12 }}
              >
                Continue to Medical Profile →
              </button>
              <p style={footerText}>
                Already have an account?{" "}
                <span style={linkText} onClick={() => navigate("/")}>
                  Login
                </span>
              </p>
            </div>
          )}

          {/* ═══ Step 1: Medical Profile ═══ */}
          {step === 1 && (
            <div style={fadeIn}>
              <p style={sectionDesc}>
                This information helps emergency responders provide faster,
                life-saving care.
              </p>

              <div className="mv-input-wrap">
                <label className="mv-input-label">Blood Group *</label>
                <div style={bloodGroupGrid}>
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      style={{
                        ...bloodChip,
                        background:
                          profile.blood_group === bg ? "#dc2626" : "#fef2f2",
                        color:
                          profile.blood_group === bg ? "#fff" : "#dc2626",
                        border:
                          profile.blood_group === bg
                            ? "2px solid #dc2626"
                            : "1.5px solid #fecaca",
                        fontWeight:
                          profile.blood_group === bg ? 700 : 600,
                        transform:
                          profile.blood_group === bg
                            ? "scale(1.08)"
                            : "scale(1)",
                      }}
                      onClick={() =>
                        setProfile({ ...profile, blood_group: bg })
                      }
                    >
                      {bg}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mv-input-wrap">
                <label className="mv-input-label">Date of Birth *</label>
                <input
                  id="reg-dob"
                  className="mv-input"
                  type="date"
                  value={profile.date_of_birth}
                  onChange={setProf("date_of_birth")}
                />
              </div>

              <div className="mv-input-wrap">
                <label className="mv-input-label">Gender *</label>
                <div style={genderRow}>
                  {["Male", "Female", "Other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      style={{
                        ...genderChip,
                        background:
                          profile.gender === g ? "#2563eb" : "#eff6ff",
                        color:
                          profile.gender === g ? "#fff" : "#2563eb",
                        border:
                          profile.gender === g
                            ? "2px solid #2563eb"
                            : "1.5px solid #bfdbfe",
                        fontWeight:
                          profile.gender === g ? 700 : 500,
                      }}
                      onClick={() =>
                        setProfile({ ...profile, gender: g })
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div style={twoCol}>
                <div className="mv-input-wrap" style={{ flex: 1 }}>
                  <label className="mv-input-label">Height (cm)</label>
                  <input
                    id="reg-height"
                    className="mv-input"
                    type="number"
                    placeholder="170"
                    value={profile.height_cm}
                    onChange={setProf("height_cm")}
                  />
                </div>
                <div className="mv-input-wrap" style={{ flex: 1 }}>
                  <label className="mv-input-label">Weight (kg)</label>
                  <input
                    id="reg-weight"
                    className="mv-input"
                    type="number"
                    placeholder="70"
                    value={profile.weight_kg}
                    onChange={setProf("weight_kg")}
                  />
                </div>
              </div>

              <div style={btnRow}>
                <button
                  className="mv-btn-outline"
                  onClick={prev}
                  style={{ flex: 1 }}
                >
                  ← Back
                </button>
                <button
                  className="mv-btn-primary"
                  onClick={next}
                  style={{ flex: 2 }}
                >
                  Continue to Medical History →
                </button>
              </div>
            </div>
          )}

          {/* ═══ Step 2: Medical History ═══ */}
          {step === 2 && (
            <div style={fadeIn}>
              <p style={sectionDesc}>
                Add your allergies, existing conditions, current medications, and
                emergency contact details.
              </p>

              <TagInput
                label="Allergies (press Enter after each)"
                color="red"
                items={history.allergies}
                onAdd={addTag("allergies")}
                onRemove={removeTag("allergies")}
                placeholder="e.g. Penicillin, Peanuts"
              />

              <TagInput
                label="Medical Conditions"
                color="amber"
                items={history.conditions}
                onAdd={addTag("conditions")}
                onRemove={removeTag("conditions")}
                placeholder="e.g. Diabetes, Asthma"
              />

              <MedicationInput
                medications={history.medications}
                onAdd={addMed}
                onRemove={removeMed}
              />

              <div className="mv-divider" />

              <p style={emerContactLabel}>Emergency Contact</p>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Contact Name</label>
                <input
                  id="reg-ec-name"
                  className="mv-input"
                  placeholder="Jane Doe (Wife)"
                  value={history.emergency_contact_name}
                  onChange={(e) =>
                    setHistory({
                      ...history,
                      emergency_contact_name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="mv-input-wrap">
                <label className="mv-input-label">Contact Phone</label>
                <input
                  id="reg-ec-phone"
                  className="mv-input"
                  type="tel"
                  placeholder="+91 98765 12345"
                  value={history.emergency_contact_phone}
                  onChange={(e) =>
                    setHistory({
                      ...history,
                      emergency_contact_phone: e.target.value,
                    })
                  }
                />
              </div>

              <div style={btnRow}>
                <button
                  className="mv-btn-outline"
                  onClick={prev}
                  style={{ flex: 1 }}
                >
                  ← Back
                </button>
                <button
                  className="mv-btn-primary"
                  onClick={handleRegister}
                  disabled={loading}
                  style={{ flex: 2 }}
                >
                  {loading ? "Creating your account..." : "Complete Registration ✓"}
                </button>
              </div>

              <p style={termsText}>
                By registering, you agree to the{" "}
                <span style={linkText}>Terms of Service</span> and{" "}
                <span style={linkText}>Privacy Policy</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STYLES                                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const fadeIn = {
  animation: "mvFadeIn 0.35s ease",
};

const stepperWrap = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "6px 24px 18px",
  gap: 0,
};

const stepItem = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
  flex: 1,
};

const stepCircle = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  transition: "all 0.3s ease",
  zIndex: 2,
};

const stepLabel = {
  fontSize: 10,
  marginTop: 5,
  textAlign: "center",
  transition: "all 0.3s ease",
};

const stepLine = {
  position: "absolute",
  top: 15,
  left: "55%",
  width: "90%",
  height: 2,
  transition: "background 0.3s ease",
  zIndex: 1,
};

const sectionDesc = {
  fontSize: 13,
  color: "#6b7280",
  lineHeight: 1.6,
  marginBottom: 18,
  background: "#f9fafb",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #f3f4f6",
};

const bloodGroupGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 8,
  marginTop: 6,
};

const bloodChip = {
  padding: "10px 0",
  borderRadius: 10,
  fontSize: 15,
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontFamily: "Inter, sans-serif",
};

const genderRow = {
  display: "flex",
  gap: 8,
  marginTop: 6,
};

const genderChip = {
  flex: 1,
  padding: "11px 0",
  borderRadius: 10,
  fontSize: 14,
  textAlign: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontFamily: "Inter, sans-serif",
};

const twoCol = {
  display: "flex",
  gap: 12,
};

const btnRow = {
  display: "flex",
  gap: 10,
  marginTop: 18,
};

const tagContainer = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 6,
  padding: "10px 12px",
  border: "1.5px solid #e5e7eb",
  borderRadius: 10,
  minHeight: 48,
  background: "#fff",
};

const tagInput = {
  border: "none",
  outline: "none",
  fontSize: 13,
  fontFamily: "Inter, sans-serif",
  background: "transparent",
  color: "#1a1a2e",
  minWidth: 100,
  flexGrow: 1,
};

const medChip = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 8,
  padding: "8px 12px",
  marginBottom: 6,
};

const medInputRow = {
  display: "flex",
  gap: 8,
  alignItems: "center",
};

const addBtn = {
  width: 40,
  height: 44,
  borderRadius: 10,
  border: "1.5px solid #2563eb",
  background: "#2563eb",
  color: "#fff",
  fontSize: 20,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontFamily: "Inter, sans-serif",
  transition: "opacity 0.2s",
};

const emerContactLabel = {
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const footerText = {
  fontSize: 14,
  color: "#6b7280",
  textAlign: "center",
  marginTop: 18,
};

const termsText = {
  fontSize: 12,
  color: "#6b7280",
  lineHeight: 1.6,
  marginTop: 16,
  textAlign: "center",
};

const linkText = {
  color: "#2563eb",
  cursor: "pointer",
  fontWeight: 500,
};
