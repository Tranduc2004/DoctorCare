import { Router } from "express";
import {
  getProfile,
  upsertProfile,
  upsertInsurance,
  syncFromMedicalRecord,
} from "../controllers/profileController";

const router = Router();

router.get("/profile", getProfile);
router.put("/profile", upsertProfile);
router.put("/insurance", upsertInsurance);
router.post("/sync-from-medical-record", syncFromMedicalRecord);

export default router;
