import express from "express";
import * as MC from "../controllers/medicineController";
import { authMiddleware } from "../middleware/auth";
// Use require to access runtime exports defensively
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MC_RUNTIME: any = require("../controllers/medicineController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Medicine CRUD
router.get("/", MC.getAllMedicines);
router.get("/my-medicines", MC.getMyMedicines);
router.get("/:id", MC.getMedicineById);
router.post("/", MC.createMedicine);
router.put("/:id", MC.updateMedicine); // Only pending allowed
router.delete("/:id", MC_RUNTIME.deleteMedicine); // Only pending allowed

// Stock management
router.post("/import", MC.importStock);
// Place statistics route BEFORE dynamic :medicineId routes to avoid collisions
router.get("/statistics/stock", MC.getStockStatistics);
router.get("/:medicineId/stock", MC.getMedicineStock);
router.get("/:medicineId/batches", MC.getMedicineBatches);
router.get("/:medicineId/transactions", MC.getTransactionHistory);

// Alerts
router.get("/alerts/expiring", MC.getExpiringMedicines);
router.get("/alerts/low-stock", MC.getLowStockMedicines);

// Utilities
router.post("/convert-units", MC.convertUnits);

export default router;
