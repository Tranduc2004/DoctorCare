"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const MC = __importStar(require("../controllers/medicineController"));
const auth_1 = require("../middleware/auth");
const MC_RUNTIME = require("../controllers/medicineController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get("/", MC.getAllMedicines);
router.get("/my-medicines", MC.getMyMedicines);
router.get("/:id", MC.getMedicineById);
router.post("/", MC.createMedicine);
router.put("/:id", MC.updateMedicine);
router.delete("/:id", MC_RUNTIME.deleteMedicine);
router.post("/import", MC.importStock);
router.get("/statistics/stock", MC.getStockStatistics);
router.get("/:medicineId/stock", MC.getMedicineStock);
router.get("/:medicineId/batches", MC.getMedicineBatches);
router.get("/:medicineId/transactions", MC.getTransactionHistory);
router.get("/alerts/expiring", MC.getExpiringMedicines);
router.get("/alerts/low-stock", MC.getLowStockMedicines);
router.post("/convert-units", MC.convertUnits);
exports.default = router;
//# sourceMappingURL=medicineRoutes.js.map