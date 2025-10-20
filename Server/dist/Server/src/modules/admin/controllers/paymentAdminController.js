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
exports.createPayosOrderForInvoice = exports.exportPayments = exports.getPaymentStatistics = exports.updatePaymentStatus = exports.refundPayment = exports.getPaymentById = exports.getAllPayments = void 0;
const Invoice_1 = __importDefault(require("../../patient/models/Invoice"));
const BankAccount_1 = __importDefault(require("../../shared/models/BankAccount"));
const Payment_1 = __importDefault(require("../../../shared/models/Payment"));
const appointment_1 = require("../../../shared/types/appointment");
const mongoose_1 = __importDefault(require("mongoose"));
// Get all payments with filters
const getAllPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        // Build filter object
        const filter = {};
        if (req.query.status && req.query.status !== "all") {
            filter.status = req.query.status;
        }
        if (req.query.paymentMethod && req.query.paymentMethod !== "all") {
            filter.paymentMethod = req.query.paymentMethod;
        }
        if (req.query.startDate && req.query.endDate) {
            filter.createdAt = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate),
            };
        }
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, "i");
            filter.$or = [
                { transactionId: searchRegex },
                { description: searchRegex },
                { "paymentDetails.accountHolder": searchRegex },
            ];
        }
        // Get payments with pagination
        const payments = yield Payment_1.default.find(filter)
            .populate("patientId", "fullName phone email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // Get total count
        const total = yield Payment_1.default.countDocuments(filter);
        res.json({
            payments,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total,
            },
        });
    }
    catch (error) {
        console.error("Error getting payments:", error);
        res.status(500).json({ message: "Error fetching payments" });
    }
});
exports.getAllPayments = getAllPayments;
// Get payment by ID
const getPaymentById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield Payment_1.default.findById(req.params.id)
            .populate("patientId", "fullName phone email")
            .populate("appointmentId")
            .populate("prescriptionId");
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        res.json(payment);
    }
    catch (error) {
        console.error("Error getting payment:", error);
        res.status(500).json({ message: "Error fetching payment details" });
    }
});
exports.getPaymentById = getPaymentById;
// Process refund
const refundPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { reason } = req.body;
        const payment = yield Payment_1.default.findById(req.params.id).session(session);
        if (!payment) {
            yield session.abortTransaction();
            return res.status(404).json({ message: "Payment not found" });
        }
        if (payment.status !== appointment_1.PaymentStatus.CAPTURED) {
            yield session.abortTransaction();
            return res.status(400).json({ message: "Payment cannot be refunded" });
        }
        // Update payment status
        payment.status = appointment_1.PaymentStatus.REFUNDED;
        payment.refundReason = reason;
        yield payment.save({ session });
        // TODO: Implement refund logic based on payment method
        switch (payment.paymentMethod) {
            case "payos":
                // Implement PayOS refund API call
                break;
            case "banking":
                // Record bank refund details
                break;
            case "wallet":
                // Refund to user's wallet
                break;
        }
        yield session.commitTransaction();
        res.json({ message: "Payment refunded successfully", payment });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Error refunding payment:", error);
        res.status(500).json({ message: "Error processing refund" });
    }
    finally {
        session.endSession();
    }
});
exports.refundPayment = refundPayment;
// Update payment status
const updatePaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { status, reason } = req.body;
        const payment = yield Payment_1.default.findById(req.params.id).session(session);
        if (!payment) {
            yield session.abortTransaction();
            return res.status(404).json({ message: "Payment not found" });
        }
        // Validate status transition
        const validTransitions = {
            [appointment_1.PaymentStatus.PENDING]: [appointment_1.PaymentStatus.CAPTURED, appointment_1.PaymentStatus.FAILED],
            [appointment_1.PaymentStatus.CAPTURED]: [appointment_1.PaymentStatus.REFUNDED],
            [appointment_1.PaymentStatus.FAILED]: [appointment_1.PaymentStatus.PENDING],
            [appointment_1.PaymentStatus.REFUNDED]: [],
            [appointment_1.PaymentStatus.AUTHORIZED]: [
                appointment_1.PaymentStatus.CAPTURED,
                appointment_1.PaymentStatus.FAILED,
            ],
        };
        if (!validTransitions[payment.status].includes(status)) {
            yield session.abortTransaction();
            return res.status(400).json({
                message: `Cannot transition payment from ${payment.status} to ${status}`,
            });
        }
        // Update payment
        payment.status = status;
        if (status === "refunded") {
            payment.refundReason = reason;
        }
        yield payment.save({ session });
        yield session.commitTransaction();
        res.json({ message: "Payment status updated successfully", payment });
    }
    catch (error) {
        yield session.abortTransaction();
        console.error("Error updating payment status:", error);
        res.status(500).json({ message: "Error updating payment status" });
    }
    finally {
        session.endSession();
    }
});
exports.updatePaymentStatus = updatePaymentStatus;
// Get payment statistics
const getPaymentStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const startDate = req.query.startDate
            ? new Date(req.query.startDate)
            : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = req.query.endDate
            ? new Date(req.query.endDate)
            : new Date();
        // Total amount statistics
        const totalStats = yield Payment_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    totalCount: { $sum: 1 },
                    completedAmount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
                        },
                    },
                    refundedAmount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "refunded"] }, "$amount", 0],
                        },
                    },
                },
            },
        ]);
        // Payment method distribution
        const methodStats = yield Payment_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$paymentMethod",
                    count: { $sum: 1 },
                    amount: { $sum: "$amount" },
                },
            },
        ]);
        // Status distribution
        const statusStats = yield Payment_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    amount: { $sum: "$amount" },
                },
            },
        ]);
        // Daily statistics
        const dailyStats = yield Payment_1.default.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                    },
                    count: { $sum: 1 },
                    amount: { $sum: "$amount" },
                },
            },
            {
                $sort: { _id: 1 },
            },
        ]);
        res.json({
            overview: totalStats[0] || {
                totalAmount: 0,
                totalCount: 0,
                completedAmount: 0,
                refundedAmount: 0,
            },
            byMethod: methodStats,
            byStatus: statusStats,
            daily: dailyStats,
        });
    }
    catch (error) {
        console.error("Error getting payment statistics:", error);
        res.status(500).json({ message: "Error fetching payment statistics" });
    }
});
exports.getPaymentStatistics = getPaymentStatistics;
// Export payments data
const exportPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { format = "csv", startDate, endDate } = req.query;
        const filter = {};
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const payments = yield Payment_1.default.find(filter)
            .populate("patientId", "fullName phone email")
            .sort({ createdAt: -1 });
        // Convert payments to CSV/Excel format
        const data = payments.map((payment) => {
            var _a, _b, _c;
            const p = payment.toObject();
            return {
                "Transaction ID": p.transactionId || p._id,
                "Patient Name": ((_a = p.patientId) === null || _a === void 0 ? void 0 : _a.fullName) || "N/A",
                "Patient Phone": ((_b = p.patientId) === null || _b === void 0 ? void 0 : _b.phone) || "N/A",
                "Patient Email": ((_c = p.patientId) === null || _c === void 0 ? void 0 : _c.email) || "N/A",
                Amount: p.amount,
                Status: p.status,
                "Payment Method": p.paymentMethod,
                Description: p.description || "N/A",
                "Created At": p.createdAt,
                "Updated At": p.updatedAt,
            };
        });
        if (format === "csv") {
            // TODO: Implement CSV export
            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=payments.csv");
            // Convert data to CSV and send
        }
        else if (format === "excel") {
            // TODO: Implement Excel export
            res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            res.setHeader("Content-Disposition", "attachment; filename=payments.xlsx");
            // Convert data to Excel and send
        }
        res.json(data);
    }
    catch (error) {
        console.error("Error exporting payments:", error);
        res.status(500).json({ message: "Error exporting payment data" });
    }
});
exports.exportPayments = exportPayments;
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
