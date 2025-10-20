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
exports.connectMongo = connectMongo;
exports.isConnected = isConnected;
exports.getConnection = getConnection;
const mongoose_1 = __importDefault(require("mongoose"));
function connectMongo() {
    return __awaiter(this, void 0, void 0, function* () {
        // Fail-fast nếu quên connect
        mongoose_1.default.set("bufferCommands", false);
        yield mongoose_1.default.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10,
        });
        console.log("✅ MongoDB connected successfully");
        return mongoose_1.default.connection;
    });
}
function isConnected() {
    return mongoose_1.default.connection.readyState === 1;
}
function getConnection() {
    return mongoose_1.default.connection;
}
