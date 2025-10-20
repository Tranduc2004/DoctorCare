"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongo = connectMongo;
exports.isConnected = isConnected;
exports.getConnection = getConnection;
const mongoose_1 = __importDefault(require("mongoose"));
async function connectMongo() {
    mongoose_1.default.set("bufferCommands", false);
    await mongoose_1.default.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
    });
    console.log("✅ Pharmacy MongoDB connected successfully");
    return mongoose_1.default.connection;
}
function isConnected() {
    return mongoose_1.default.connection.readyState === 1;
}
function getConnection() {
    return mongoose_1.default.connection;
}
//# sourceMappingURL=mongo.js.map