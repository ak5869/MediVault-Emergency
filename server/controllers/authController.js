import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const JWT_SECRET = process.env.JWT_SECRET || "medivault_secret_key";

// ─── Helper: Sign JWT ────────────────────────────────────────────────────────
const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

// ─── POST /api/auth/check-email ──────────────────────────────────────────────
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    return res.status(200).json({ exists: !!existing });
  } catch (err) {
    console.error("[CheckEmail] Error:", err);
    return res.status(500).json({ message: "Server error checking email." });
  }
};

// ─── POST /api/auth/register ─────────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, phone: phone || null }])
      .select("id, name, email, phone, created_at")
      .single();

    if (error) {
      console.error("[Signup] Supabase error:", error);
      return res.status(400).json({ message: error.message });
    }

    const token = signToken(data);
    return res.status(201).json({ user: data, token });
  } catch (err) {
    console.error("[Signup] Unexpected error:", err);
    return res.status(500).json({ message: "Server error during signup." });
  }
};

// ─── POST /api/auth/login ────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("[Login] Supabase error:", error);
      return res.status(500).json({ message: "Database error." });
    }

    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    const storedPassword = user.password;
    const isBcryptHash = storedPassword?.startsWith("$2b$") || storedPassword?.startsWith("$2a$");
    let passwordValid = false;

    if (isBcryptHash) {
      passwordValid = await bcrypt.compare(password, storedPassword);
    } else {
      passwordValid = (password === storedPassword);
      if (passwordValid) {
        const newHash = await bcrypt.hash(password, 12);
        await supabase.from("users").update({ password: newHash }).eq("id", user.id);
        console.log(`[Login] Auto-upgraded plaintext password for: ${user.email}`);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const { password: _pwd, ...safeUser } = user;
    const token = signToken(safeUser);
    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error("[Login] Unexpected error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
};

// ─── POST /api/auth/send-otp ─────────────────────────────────────────────────
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const { data: user } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (!user) return res.status(404).json({ message: "No account found with this email." });

    await supabase.from("otps").delete().eq("user_id", user.id);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("otps")
      .insert([{ user_id: user.id, otp, expires_at: expiresAt }]);

    if (error) {
      console.error("[SendOTP] Supabase error:", error);
      return res.status(500).json({ message: "Failed to generate OTP." });
    }

    console.log(`\n📱 OTP for ${email}: ${otp} (expires in 10 min)\n`);
    return res.status(200).json({ message: "OTP sent. Check server console (dev mode)." });
  } catch (err) {
    console.error("[SendOTP] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── POST /api/auth/verify-otp ───────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required." });

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!user) return res.status(404).json({ message: "No account found with this email." });

    const { data: otpRecord } = await supabase
      .from("otps")
      .select("*")
      .eq("user_id", user.id)
      .eq("otp", otp)
      .maybeSingle();

    if (!otpRecord) return res.status(400).json({ message: "Invalid OTP." });

    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from("otps").delete().eq("id", otpRecord.id);
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    await supabase.from("otps").delete().eq("id", otpRecord.id);

    const { password: _pwd, ...safeUser } = user;
    const token = signToken(safeUser);
    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error("[VerifyOTP] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!user) return res.status(404).json({ message: "No account found with this email." });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const { error } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", user.id);

    if (error) {
      console.error("[ForgotPassword] Supabase error:", error);
      return res.status(500).json({ message: "Failed to update password." });
    }

    return res.status(200).json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    console.error("[ForgotPassword] Unexpected error:", err);
    return res.status(500).json({ message: "Server error." });
  }
};