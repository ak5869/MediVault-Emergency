import express from "express";
import { generateAccess, accessProfile, getHistory, revokeAccess, addDoctorNotes } from "../controllers/emergencyController.js";

const router = express.Router();

router.post("/generate", generateAccess);
router.post("/access", accessProfile);
router.post("/revoke", revokeAccess);
router.post("/add-notes", addDoctorNotes);
router.get("/history", getHistory);

export default router;