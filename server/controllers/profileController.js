import supabase from "../config/supabase.js";

// ─── GET /api/profile/:id ─────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[getProfile] Supabase error:", error);
      return res.status(500).json({ message: "Database error." });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("[getProfile] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── PUT /api/profile/:id ─────────────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Restrict which fields can be updated (never expose password mutation here)
    const { name, phone } = req.body;
    const updates = {};
    if (name  !== undefined) updates.name  = name;
    if (phone !== undefined) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, phone, created_at")
      .single();

    if (error) {
      console.error("[updateProfile] Supabase error:", error);
      return res.status(400).json({ message: error.message });
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error("[updateProfile] Unexpected error:", err);
    return res.status(500).json({ message: "Update failed." });
  }
};