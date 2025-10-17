import express from "express";
import {
  listBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
} from "../controllers/bankAccountController";
import { verifyAdminToken } from "../middlewares/adminAuth";

const router = express.Router();

router.get("/", verifyAdminToken, listBankAccounts);
router.post("/", verifyAdminToken, createBankAccount);
router.put("/:id", verifyAdminToken, updateBankAccount);
router.delete("/:id", verifyAdminToken, deleteBankAccount);

export default router;
