"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDatabase = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not found in environment variables");
        }
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log(`Connected to MongoDB: ${process.env.MONGODB_URI}`);
    }
    catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=database.js.map