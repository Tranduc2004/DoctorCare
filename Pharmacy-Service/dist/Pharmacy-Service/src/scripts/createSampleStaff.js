"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const Staff_1 = __importDefault(require("../models/Staff"));
const database_1 = require("../config/database");
const createSampleStaff = async () => {
    try {
        await (0, database_1.connectDatabase)();
        console.log("Connected to database");
        await Staff_1.default.deleteMany({});
        console.log("Cleared existing staff");
        const sampleStaff = [
            {
                name: "Nguyễn Văn A",
                email: "admin@pharmacy.com",
                password: "123456",
                role: "admin",
                active: true,
                status: "approved",
            },
            {
                name: "Trần Thị B",
                email: "staff1@pharmacy.com",
                password: "123456",
                role: "staff",
                active: true,
                status: "approved",
            },
            {
                name: "Lê Văn C",
                email: "staff2@pharmacy.com",
                password: "123456",
                role: "staff",
                active: false,
                status: "rejected",
                rejectedReason: "Không đủ kinh nghiệm",
            },
            {
                name: "Phạm Thị D",
                email: "staff3@pharmacy.com",
                password: "123456",
                role: "staff",
                active: true,
                status: "pending",
            },
            {
                name: "Hoàng Văn E",
                email: "staff4@pharmacy.com",
                password: "123456",
                role: "staff",
                active: true,
                status: "pending",
            },
        ];
        for (const staffData of sampleStaff) {
            const staff = new Staff_1.default(staffData);
            await staff.save();
            console.log(`Created staff: ${staffData.name} (${staffData.email})`);
        }
        console.log("Sample staff created successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("Error creating sample staff:", error);
        process.exit(1);
    }
};
createSampleStaff();
//# sourceMappingURL=createSampleStaff.js.map