"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBankAccount = exports.updateBankAccount = exports.createBankAccount = exports.listBankAccounts = void 0;
const BankAccount_1 = __importDefault(require("../../shared/models/BankAccount"));
const listBankAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const items = yield BankAccount_1.default.find().sort({ createdAt: -1 });
        res.json(items);
    }
    catch (err) {
        res
            .status(500)
            .json({ message: "Lỗi lấy danh sách tài khoản", error: err });
    }
});
exports.listBankAccounts = listBankAccounts;
const createBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const item = yield BankAccount_1.default.create(payload);
        res.json(item);
    }
    catch (err) {
        res.status(500).json({ message: "Lỗi tạo tài khoản", error: err });
    }
});
exports.createBankAccount = createBankAccount;
const updateBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield BankAccount_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!item)
            return res.status(404).json({ message: "Không tìm thấy tài khoản" });
        res.json(item);
    }
    catch (err) {
        res.status(500).json({ message: "Lỗi cập nhật tài khoản", error: err });
    }
});
exports.updateBankAccount = updateBankAccount;
const deleteBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield BankAccount_1.default.findByIdAndDelete(id);
        res.json({ message: "Xóa thành công" });
    }
    catch (err) {
        res.status(500).json({ message: "Lỗi xóa tài khoản", error: err });
    }
});
exports.deleteBankAccount = deleteBankAccount;
