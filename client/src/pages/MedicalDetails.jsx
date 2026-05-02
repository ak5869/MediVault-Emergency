import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

/* ── Tag with remove button ─────────────────────────────────────────────────── */
function TagInput({ label, color, items, onAdd, onRemove }) {
  const [input, setInput] = useState("");
  const colorMap = {
    red:   "mv-tag mv-tag-red",
    amber: "mv-tag mv-tag-amber",
    blue:  "mv-tag mv-tag-blue",
  };
  const handleKey = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      onAdd(input.trim());
      setInput("");
    }
  };
  return (
    <div style={{ marginBottom: 18 }}>
      <label className="mv-input-label" style={{ marginBottom: 8 }}>{label}</label>
      <div style={tagContainer}>
        {items.map((item, i) => (
          <span key={i} className={colorMap[color]} style={{ cursor: "pointer" }}
            onClick={() => onRemove(i)}>
            {item} ×
          </span>
        ))}
        <input
          style={tagInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type & press Enter"
        />
      </div>
    </div>
  );
}

export default function MedicalDetails() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    blood_group: "",
    allergies: [],
    conditions: [],
    medications: [],
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return navigate("/");
    try {
      const u = JSON.parse(stored);
      API.get(`/patients?user_id=${u.id}`)
        .then(res => {
          if (res.data?.length > 0) {
            const p = res.data[0];
            setForm({
              blood_group:  p.blood_group  || "",
              allergies:    p.allergies    || [],
              conditions:   Array.isArray(p.conditions)
                ? p.conditions.map(c => (typeof c === "string" ? c : c.name))
                : [],
              medications:  Array.isArray(p.medications)
                ? p.medications.map(m => (typeof m === "string" ? m : `${m.name} ${m.dosage || ""}`))
                : [],
            });
          }
        })
        .catch(() => {});
    } catch { navigate("/"); }
  }, [navigate]);

  const addItem    = (field) => (val) => setForm(f => ({ ...f, [field]: [...f[field], val] }));
  const removeItem = (field) => (i)   => setForm(f => ({ ...f, [field]: f[field].filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setError(null); setSaved(false);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await API.post("/patients/save", { ...form, name: user.name, user_id: user.id });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Save failed.");
    }
  };

  const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

  return (
    <div className="mv-shell">
      <div className="mv-page">
        <div className="mv-topbar">
          <button className="mv-topbar-back" onClick={() => navigate("/profile")}>&#8592;</button>
          <span className="mv-topbar-title">Medical Details</span>
        </div>

        <div style={{ padding: "8px 24px 32px" }}>
          {error  && <div className="mv-error">{error}</div>}
          {saved  && <div className="mv-success">Profile saved successfully.</div>}

          {/* Blood Group */}
          <div style={{ marginBottom: 18 }}>
            <label className="mv-input-label">Blood Group</label>
            <select
              className="mv-input"
              value={form.blood_group}
              onChange={e => setForm({ ...form, blood_group: e.target.value })}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          <TagInput
            label="Allergies (press Enter after each)"
            color="red"
            items={form.allergies}
            onAdd={addItem("allergies")}
            onRemove={removeItem("allergies")}
          />
          <TagInput
            label="Medical Conditions"
            color="amber"
            items={form.conditions}
            onAdd={addItem("conditions")}
            onRemove={removeItem("conditions")}
          />
          <TagInput
            label="Medications (e.g. Metformin 500mg)"
            color="blue"
            items={form.medications}
            onAdd={addItem("medications")}
            onRemove={removeItem("medications")}
          />

          <button className="mv-btn-primary" onClick={handleSave}>
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const tagContainer = {
  display: "flex", flexWrap: "wrap", alignItems: "center",
  gap: 6, padding: "10px 12px",
  border: "1.5px solid #e5e7eb", borderRadius: 10,
  minHeight: 48, background: "#fff",
};
const tagInput = {
  border: "none", outline: "none", fontSize: 13,
  fontFamily: "Inter, sans-serif", background: "transparent",
  color: "#1a1a2e", minWidth: 100, flexGrow: 1,
};
