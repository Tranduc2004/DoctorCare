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
exports.Staff = exports.createStaffModel = exports.staffSchema = void 0;
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Staff schema
const staffSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid email",
        ],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"],
        select: false, // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ["admin", "staff"],
        default: "staff",
    },
    active: {
        type: Boolean,
        default: true,
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    approvedBy: {
        type: String,
        ref: "Admin",
    },
    approvedAt: {
        type: Date,
    },
    rejectedReason: {
        type: String,
    },
}, {
    timestamps: true,
    collection: "staffs",
});
exports.staffSchema = staffSchema;
// Index for better performance
staffSchema.index({ status: 1 });
staffSchema.index({ active: 1 });
// Hash password before saving
staffSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified("password"))
            return next();
        try {
            const salt = yield bcryptjs_1.default.genSalt(12);
            this.password = yield bcryptjs_1.default.hash(this.password, salt);
            next();
        }
        catch (error) {
            next(error);
        }
    });
});
// Compare password method
staffSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(candidatePassword, this.password);
    });
};
// Factory function to create model with specific connection
const createStaffModel = (connection) => {
    if (connection) {
        return connection.model("Staff", staffSchema);
    }
    return (0, mongoose_1.model)("Staff", staffSchema);
};
exports.createStaffModel = createStaffModel;
// Default export for backward compatibility
exports.Staff = (0, mongoose_1.model)("Staff", staffSchema);
