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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const appointment_1 = require("../../../shared/types/appointment");
const PaymentItemSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(appointment_1.PaymentType),
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    insuranceCoverage: {
        type: String,
        enum: Object.values(appointment_1.InsuranceCoverage),
    },
    insuranceAmount: {
        type: Number,
        min: 0,
    },
    patientAmount: {
        type: Number,
        required: true,
        min: 0,
    },
}, { _id: false });
const InvoiceSchema = new mongoose_1.Schema({
    appointmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
    },
    invoiceNumber: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ["consultation", "final_settlement"],
        required: true,
    },
    items: [PaymentItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    insuranceCoverage: {
        type: Number,
        required: true,
        min: 0,
    },
    patientAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: Object.values(appointment_1.PaymentStatus),
        default: appointment_1.PaymentStatus.PENDING,
    },
    dueDate: Date,
    paidAt: Date,
    // VNPay fields
    vnpayTxnRef: {
        type: String,
        index: true,
    },
    vnpayTransactionNo: {
        type: String,
    },
    // PayOS order id (if an order was created with PayOS)
    payosOrderId: {
        type: String,
        index: true,
    },
    paymentLinkId: {
        type: String,
        index: true,
    },
    // Raw provider data (useful for debugging and rehydration)
    raw: {
        type: mongoose_1.Schema.Types.Mixed,
    },
}, { timestamps: true });
// Generate invoice number before validation so required check passes
InvoiceSchema.pre("validate", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isNew && !this.invoiceNumber) {
            try {
                const count = yield mongoose_1.default.model("Invoice").countDocuments();
                this.invoiceNumber = `INV-${Date.now()}-${String(count + 1).padStart(4, "0")}`;
            }
            catch (err) {
                return next(err);
            }
        }
        next();
    });
});
exports.default = mongoose_1.default.model("Invoice", InvoiceSchema);
