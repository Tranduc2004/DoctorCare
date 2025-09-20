import { Router } from "express";
import {
  getProfile,
  upsertProfile,
  upsertInsurance,
} from "../controllers/profileController";

const router = Router();

router.get("/profile", getProfile);
router.put("/profile", upsertProfile);
router.put("/insurance", upsertInsurance);

export default router;
