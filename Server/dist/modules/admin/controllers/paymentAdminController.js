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
exports.createPayosOrderForInvoice = void 0;
const Invoice_1 = __importDefault(require("../../patient/models/Invoice"));
const BankAccount_1 = __importDefault(require("../../shared/models/BankAccount"));
// Create a PayOS order for an invoice (admin action)
const createPayosOrderForInvoice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoiceId } = req.params;
        const invoice = yield Invoice_1.default.findById(invoiceId);
        if (!invoice)
            return res.status(404).json({ message: "Invoice not found" });
        // Choose active bank account if any
        let account = yield BankAccount_1.default.findOne({ active: true }).sort({
            createdAt: 1,
        });
        const amount = Math.round(Number(invoice.patientAmount || 0));
        const note = `Thanh toan hoa don - ${invoice._id}`;
        const payosClientId = process.env.PAYOS_CLIENT_ID;
        const payosApiKey = process.env.PAYOS_API_KEY;
        if (!payosClientId || !payosApiKey) {
            return res
                .status(400)
                .json({ message: "PayOS credentials not configured" });
        }
        // Instantiate SDK properly: some SDKs export a class that must be instantiated
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const PayOSLib = require("@payos/node");
        const PayOS = PayOSLib && (PayOSLib.default || PayOSLib);
        const orderCode = Date.now();
        const orderPayload = {
            orderCode,
            amount,
            description: String((note || "Thanh toan").toString().slice(0, 25)),
            returnUrl: process.env.FRONTEND_URL
                ? `${process.env.FRONTEND_URL}/payment/success`
                : undefined,
            cancelUrl: process.env.FRONTEND_URL
                ? `${process.env.FRONTEND_URL}/payment/cancel`
                : undefined,
        };
        let respData = null;
        if (typeof PayOS === "function") {
            const payosClient = new PayOS(payosClientId, payosApiKey, process.env.PAYOS_CHECKSUM_KEY);
            const resp = yield payosClient.paymentRequests.create(orderPayload);
            respData = resp && (resp.data || resp);
        }
        if (!respData) {
            return res
                .status(500)
                .json({ message: "PayOS SDK did not return checkout data" });
        }
        try {
            const persisted = respData.orderCode || orderCode;
            invoice.payosOrderId = String(persisted);
            yield invoice.save();
        }
        catch (e) {
            console.warn("Failed to persist payosOrderId on invoice (admin)", e);
        }
        return res.json({ success: true, payosCheckout: respData });
    }
    catch (err) {
        const e = err;
        console.error("Error creating PayOS order (admin):", e);
        return res
            .status(500)
            .json({ message: "Internal error", error: e.message });
    }
});
exports.createPayosOrderForInvoice = createPayosOrderForInvoice;
