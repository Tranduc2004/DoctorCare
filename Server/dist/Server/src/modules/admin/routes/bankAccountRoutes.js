"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bankAccountController_1 = require("../controllers/bankAccountController");
const adminAuth_1 = require("../middlewares/adminAuth");
const router = express_1.default.Router();
router.get("/", adminAuth_1.verifyAdminToken, bankAccountController_1.listBankAccounts);
router.post("/", adminAuth_1.verifyAdminToken, bankAccountController_1.createBankAccount);
router.put("/:id", adminAuth_1.verifyAdminToken, bankAccountController_1.updateBankAccount);
router.delete("/:id", adminAuth_1.verifyAdminToken, bankAccountController_1.deleteBankAccount);
exports.default = router;
