import supabase from "../config/supabase.js";

// ─── POST /api/emergency/generate ────────────────────────────────────────────
export const generateAccess = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("emergency_tokens")
      .insert([{ user_id: userId, code, expires_at: expiresAt, is_active: true }])
      .select()
      .single();

    if (error) {
      console.error("[generateAccess] Supabase error:", error);
      return res.status(400).json({ message: error.message });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("[generateAccess] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── POST /api/emergency/access ──────────────────────────────────────────────
export const accessProfile = async (req, res) => {
  try {
    const { code, hospital_name, hospital_id, doctor_name, department, staff_id } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Access code is required." });
    }

    const { data: access, error } = await supabase
      .from("emergency_tokens")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[accessProfile] Supabase error:", error);
      return res.status(500).json({ message: "Database error." });
    }

    if (!access) {
      return res.status(404).json({ message: "Invalid or inactive access code." });
    }

    if (new Date(access.expires_at) < new Date()) {
      // Auto-deactivate the expired token in DB
      await supabase
        .from("emergency_tokens")
        .update({ is_active: false })
        .eq("id", access.id);
      return res.status(400).json({ message: "Access code has expired." });
    }

    // Log this access attempt to access_logs
    const logEntry = {
      user_id: access.user_id,
      hospital_name: hospital_name || "Unknown Hospital",
      hospital_id: hospital_id || null,
      doctor_name: doctor_name || null,
      department: department || null,
      staff_id: staff_id || null,
      method: "Access Code",
      status: "Active",
      accessed_at: new Date().toISOString(),
    };

    const { error: logError } = await supabase
      .from("access_logs")
      .insert([logEntry]);

    if (logError) {
      console.error("[accessProfile] Failed to log access:", logError.message);
      // Don't fail the request — logging is best-effort
    }

    return res.status(200).json(access);
  } catch (err) {
    console.error("[accessProfile] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── GET /api/emergency/history ──────────────────────────────────────────────
export const getHistory = async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "user_id query parameter is required." });
    }

    // Fetch from access_logs table
    const { data: logs, error: logsError } = await supabase
      .from("access_logs")
      .select("*")
      .eq("user_id", user_id)
      .order("accessed_at", { ascending: false });

    if (!logsError && logs && logs.length > 0) {
      return res.status(200).json(logs);
    }

    // Fall back to emergency_tokens for access history
    const { data: tokens, error: tokensError } = await supabase
      .from("emergency_tokens")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (tokensError) {
      console.error("[getHistory] Supabase error:", tokensError);
      return res.status(200).json([]);
    }

    const history = (tokens || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      hospital_name: "Emergency Access",
      doctor_name: null,
      department: null,
      method: "Access Code",
      status: new Date(t.expires_at) > new Date() && t.is_active ? "Active" : "Expired",
      accessed_at: t.created_at,
    }));

    return res.status(200).json(history);
  } catch (err) {
    console.error("[getHistory] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── POST /api/emergency/revoke ──────────────────────────────────────────────
export const revokeAccess = async (req, res) => {
  try {
    const { userId, tokenId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required." });
    }

    let result;
    if (tokenId) {
      // Revoke a specific token
      result = await supabase
        .from("emergency_tokens")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("id", tokenId)
        .eq("is_active", true);
    } else {
      // Revoke all active tokens for this user
      result = await supabase
        .from("emergency_tokens")
        .update({ is_active: false })
        .eq("user_id", userId)
        .eq("is_active", true);
    }

    if (result.error) {
      console.error("[revokeAccess] Supabase error:", result.error);
      return res.status(400).json({ message: result.error.message });
    }

    console.log(`[revokeAccess] Revoked tokens for user ${userId}`);
    return res.status(200).json({ message: "Access revoked successfully." });
  } catch (err) {
    console.error("[revokeAccess] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── POST /api/emergency/add-notes ───────────────────────────────────────────
export const addDoctorNotes = async (req, res) => {
  try {
    const {
      user_id,
      new_medications,  // [{ name, dosage }]
      new_conditions,   // ["Condition 1", ...]
      notes,            // "Doctor's clinical notes text"
      doctor_name,
      hospital_name,
      department,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required." });
    }

    // 1. Fetch the current patient record
    const { data: rows, error: fetchErr } = await supabase
      .from("patients")
      .select("id, medications, conditions")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true })
      .limit(1);

    if (fetchErr || !rows || rows.length === 0) {
      return res.status(404).json({ message: "Patient record not found." });
    }

    const patient = rows[0];
    const existingMeds = Array.isArray(patient.medications) ? patient.medications : [];
    const existingConds = Array.isArray(patient.conditions) ? patient.conditions : [];

    // 2. Merge new data into existing
    const mergedMeds = [...existingMeds, ...(Array.isArray(new_medications) ? new_medications : [])];
    const mergedConds = [...existingConds, ...(Array.isArray(new_conditions) ? new_conditions : [])];

    // 3. Update patient record
    const { error: updateErr } = await supabase
      .from("patients")
      .update({
        medications: mergedMeds,
        conditions: mergedConds,
        updated_at: new Date().toISOString(),
      })
      .eq("id", patient.id);

    if (updateErr) {
      console.error("[addDoctorNotes] Update error:", updateErr);
      return res.status(400).json({ message: updateErr.message });
    }

    // 4. Log the additions in access_logs
    const logEntry = {
      user_id,
      hospital_name: hospital_name || "Unknown Hospital",
      doctor_name: doctor_name || "Staff",
      department: department || null,
      method: "Prescription Update",
      status: "Completed",
      accessed_at: new Date().toISOString(),
      notes: JSON.stringify({
        medications_added: new_medications || [],
        conditions_added: new_conditions || [],
        clinical_notes: notes || "",
      }),
    };

    await supabase.from("access_logs").insert([logEntry]);

    console.log(`[addDoctorNotes] Doctor ${doctor_name} added notes for patient ${user_id}`);
    return res.status(200).json({
      message: "Medical details updated successfully.",
      medications: mergedMeds,
      conditions: mergedConds,
    });
  } catch (err) {
    console.error("[addDoctorNotes] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

export const cleanupExpiredTokens = async () => {
  try {
    const { error, count } = await supabase
      .from("emergency_tokens")
      .update({ is_active: false })
      .eq("is_active", true)
      .lt("expires_at", new Date().toISOString());

    if (error) {
      console.error("[Cleanup] Failed to deactivate expired tokens:", error.message);
    } else if (count > 0) {
      console.log(`[Cleanup] Deactivated ${count} expired token(s).`);
    }
  } catch (err) {
    console.error("[Cleanup] Unexpected error:", err);
  }
};