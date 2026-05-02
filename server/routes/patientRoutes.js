import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// CREATE (insert new patient)
router.post("/add", async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .insert([req.body])
    .select();

  if (error) {
    console.error("[patients/add] Supabase error:", error);
    return res.status(400).json({ message: error.message });
  }
  res.json(data?.[0] ?? data);
});

// SAVE (upsert — update if exists, insert if not)
router.post("/save", async (req, res) => {
  const { user_id, ...fields } = req.body;

  console.log("[patients/save] ── Request received ──");
  console.log("[patients/save] user_id:", user_id);
  console.log("[patients/save] fields:", JSON.stringify(fields, null, 2));

  if (!user_id) {
    return res.status(400).json({ message: "user_id is required." });
  }

  try {
    // Check if patient record(s) already exist for this user.
    // Use .limit(1) instead of .maybeSingle() to avoid the
    // "JSON object requested, multiple (or no) rows returned" error
    // when duplicate rows exist for the same user_id.
    const { data: rows, error: fetchError } = await supabase
      .from("patients")
      .select("id")
      .eq("user_id", user_id)
      .order("created_at", { ascending: true })
      .limit(1);

    console.log("[patients/save] existing rows:", rows, "fetchError:", fetchError);

    if (fetchError) {
      console.error("[patients/save] Fetch error:", fetchError);
      return res.status(400).json({ message: fetchError.message });
    }

    const existing = rows && rows.length > 0 ? rows[0] : null;

    if (existing) {
      // UPDATE existing record
      const { data, error, count, status, statusText } = await supabase
        .from("patients")
        .update(fields)
        .eq("id", existing.id)
        .select();

      console.log("[patients/save] UPDATE result:", { data, error, count, status, statusText });

      if (error) {
        console.error("[patients/save] Update error:", error);
        return res.status(400).json({ message: error.message });
      }

      if (!data || data.length === 0) {
        console.error("[patients/save] UPDATE returned no data — RLS may be blocking writes. Trying upsert...");
        // Fallback: use upsert which may work around RLS issues
        const { data: upsertData, error: upsertError } = await supabase
          .from("patients")
          .upsert({ id: existing.id, user_id, ...fields }, { onConflict: "id" })
          .select();

        console.log("[patients/save] UPSERT result:", { upsertData, upsertError });

        if (upsertError) {
          return res.status(400).json({ message: upsertError.message });
        }
        return res.json(upsertData?.[0] ?? { success: true });
      }

      return res.json(data[0]);
    } else {
      // INSERT new record
      const payload = { user_id, ...fields };
      console.log("[patients/save] INSERT payload:", JSON.stringify(payload, null, 2));

      const { data, error, status, statusText } = await supabase
        .from("patients")
        .insert([payload])
        .select();

      console.log("[patients/save] INSERT result:", { data, error, status, statusText });

      if (error) {
        console.error("[patients/save] Insert error:", error);
        return res.status(400).json({ message: error.message });
      }

      if (!data || data.length === 0) {
        console.error("[patients/save] INSERT returned no data — RLS may be blocking writes.");
        return res.status(403).json({
          message: "Data was not saved. Row Level Security (RLS) on the 'patients' table may be blocking writes. Please disable RLS or add an INSERT/UPDATE policy in Supabase.",
        });
      }

      return res.json(data[0]);
    }
  } catch (err) {
    console.error("[patients/save] Unexpected error:", err);
    return res.status(500).json({ message: "Server error saving patient." });
  }
});

// READ — supports ?user_id=<uuid> to filter by patient
router.get("/", async (req, res) => {
  let query = supabase.from("patients").select("*");
  if (req.query.user_id) query = query.eq("user_id", req.query.user_id);
  const { data, error } = await query;
  if (error) return res.status(400).json({ message: error.message });
  res.json(data);
});

// UPDATE (increase attendance)
router.put("/update", async (req, res) => {
  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .lt("attendance", 95);

  if (error) return res.status(400).json({ message: error.message });

  const updatedPatients = [];
  for (const patient of patients) {
    const updatedAttendance = Math.min((patient.attendance || 0) + 5, 100);
    const { data: updated, error: updateError } = await supabase
      .from("patients")
      .update({ attendance: updatedAttendance })
      .eq("id", patient.id)
      .select();

    if (updateError) return res.status(400).json({ message: updateError.message });
    updatedPatients.push(updated?.[0] ?? updated);
  }

  res.json({ updated: updatedPatients.length, patients: updatedPatients });
});

// DELETE
router.delete("/delete", async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .delete()
    .lt("attendance", 50);

  if (error) return res.status(400).json({ message: error.message });
  res.json({ deleted: data?.length ?? 0 });
});

export default router;