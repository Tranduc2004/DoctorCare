"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vnpayService = exports.VNPayService = void 0;
const crypto_1 = __importDefault(require("crypto"));
class VNPayService {
    constructor() {
        this.config = {
            vnp_TmnCode: (process.env.VNP_TMN_CODE || "").trim(),
            vnp_HashSecret: (process.env.VNP_HASH_SECRET || "").trim(),
            vnp_Url: (process.env.VNP_URL || "").trim(),
            vnp_ReturnUrl: (process.env.VNP_RETURN_URL || "").trim(),
        };
        // Validate required config
        if (!this.config.vnp_TmnCode ||
            !this.config.vnp_HashSecret ||
            !this.config.vnp_Url) {
            throw new Error("VNPay configuration is missing. Please check environment variables.");
        }
    }
    /**
     * Create VNPay payment URL
     */
    createPaymentUrl(params) {
        const vnp_Params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode: this.config.vnp_TmnCode,
            vnp_Locale: params.vnp_Locale || "vn",
            vnp_CurrCode: "VND",
            vnp_TxnRef: params.vnp_TxnRef,
            vnp_OrderInfo: params.vnp_OrderInfo,
            vnp_OrderType: params.vnp_OrderType || "other",
            vnp_Amount: params.vnp_Amount * 100, // VNPay requires amount in VND * 100
            vnp_ReturnUrl: this.config.vnp_ReturnUrl,
            vnp_IpAddr: params.vnp_IpAddr,
            vnp_CreateDate: this.formatDateGMT7(new Date()),
        };
        // Sort parameters by key (A-Z)
        const sortedParams = this.sortParams(vnp_Params);
        // Create query string for signing - KHÔNG bao gồm vnp_SecureHash và vnp_SecureHashType
        const signData = this.createSignData(sortedParams);
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Raw Params (Create):", vnp_Params);
            console.log("VNPay Sorted Params (Create):", sortedParams);
            console.log("VNPay Sign Data (Create):", signData);
        }
        // Create secure hash (lowercase hex)
        const secureHash = this.createSecureHash(signData).toLowerCase();
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Secure Hash (Create):", secureHash);
        }
        // Build final URL: baseQuery (already encoded) + append secure hash and type
        // Do NOT re-encode the whole query (that would change + into %2B)
        const baseQuery = signData; // already encoded via createSignData
        const paymentUrl = this.config.vnp_Url +
            "?" +
            baseQuery +
            "&vnp_SecureHash=" +
            secureHash +
            "&vnp_SecureHashType=SHA512";
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Payment URL:", paymentUrl);
        }
        return paymentUrl;
    }
    /**
     * Verify VNPay return data
     */
    verifyReturnUrl(query) {
        // If caller passed a raw query string, delegate to verifyReturnRaw
        if (typeof query === "string") {
            return this.verifyReturnRaw(query);
        }
        const vnp_SecureHash = query.vnp_SecureHash;
        // Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi query để ký
        const _a = query, { vnp_SecureHash: _, vnp_SecureHashType: __ } = _a, queryWithoutHash = __rest(_a, ["vnp_SecureHash", "vnp_SecureHashType"]);
        // Sort parameters A-Z
        const sortedParams = this.sortParams(queryWithoutHash);
        // Create signature string - same as creation
        const signData = this.createSignData(sortedParams);
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Query Without Hash (Verify):", queryWithoutHash);
            console.log("VNPay Sorted Params (Verify):", sortedParams);
            console.log("VNPay Sign Data (Verify):", signData);
        }
        // Verify signature
        const computedHash = this.createSecureHash(signData);
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Computed Hash (Verify):", computedHash);
            console.log("VNPay Received Hash:", vnp_SecureHash);
        }
        // Normalize both to lowercase when comparing - VNPay may send uppercase hex
        const isValid = computedHash.toLowerCase() === (vnp_SecureHash || "").toLowerCase();
        console.log("VNPay Signature Valid:", isValid);
        // Check if payment was successful
        const isSuccess = query.vnp_ResponseCode === "00" &&
            query.vnp_TransactionStatus === "00";
        return {
            isValid,
            isSuccess,
            data: query,
        };
    }
    /**
     * Verify VNPay return when caller provides the raw query string (raw, not URL-decoded)
     * This preserves '+' characters and percent-escapes exactly as VNPay sent them.
     */
    verifyReturnRaw(rawQuery) {
        // rawQuery is like: vnp_Amount=40000000&vnp_OrderInfo=Thanh+toan...&vnp_SecureHash=...
        const pairs = rawQuery.split("&");
        const paramsRaw = {};
        let vnp_SecureHash = "";
        pairs.forEach((pair) => {
            const idx = pair.indexOf("=");
            if (idx === -1)
                return;
            const key = decodeURIComponent(pair.substring(0, idx));
            const value = pair.substring(idx + 1); // keep encoded value (do NOT decode)
            if (key === "vnp_SecureHash") {
                vnp_SecureHash = decodeURIComponent(value);
            }
            else if (key === "vnp_SecureHashType") {
                // skip
            }
            else {
                paramsRaw[key] = value;
            }
        });
        // Build signData by sorting keys and using the raw (encoded) values, normalizing %20->+
        const sortedKeys = Object.keys(paramsRaw).sort();
        const queryPairs = [];
        sortedKeys.forEach((k) => {
            const rawVal = paramsRaw[k] || "";
            // normalize %20 to + so spaces use + as VNPay expects
            const normalizedVal = rawVal.replace(/%20/g, "+");
            const encodedKey = encodeURIComponent(k);
            queryPairs.push(`${encodedKey}=${normalizedVal}`);
        });
        const signData = queryPairs.join("&");
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Raw Query (VerifyRaw):", rawQuery);
            console.log("VNPay Sign Data (VerifyRaw):", signData);
            console.log("VNPay Received Hash (VerifyRaw):", vnp_SecureHash);
        }
        const computedHash = this.createSecureHash(signData).toLowerCase();
        const isValid = computedHash === (vnp_SecureHash || "").toLowerCase();
        if (process.env.NODE_ENV !== "production") {
            console.log("VNPay Computed Hash (VerifyRaw):", computedHash);
            console.log("VNPay Signature Valid (VerifyRaw):", isValid);
        }
        // Determine success from the raw query (try to parse responseCode and txn status)
        const responseCode = (paramsRaw["vnp_ResponseCode"] || "").toString();
        const txnStatus = (paramsRaw["vnp_TransactionStatus"] || "").toString();
        const isSuccess = responseCode === "00" && txnStatus === "00";
        return { isValid, isSuccess, data: paramsRaw };
    }
    /**
     * Get client IP address from request
     */
    getClientIpAddress(req) {
        var _a;
        return (((_a = req.headers["x-forwarded-for"]) === null || _a === void 0 ? void 0 : _a.split(",")[0]) ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            "127.0.0.1");
    }
    /**
     * Create signature data string with proper encoding
     * Sort A-Z, encodeURIComponent, chuyển %20 → +
     */
    createSignData(params) {
        const sortedKeys = Object.keys(params).sort();
        const queryPairs = [];
        sortedKeys.forEach((key) => {
            const value = params[key];
            if (value !== "" && value !== undefined && value !== null) {
                // encodeURIComponent rồi chuyển %20 thành +
                const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, "+");
                queryPairs.push(`${key}=${encodedValue}`);
            }
        });
        return queryPairs.join("&");
    }
    /**
     * Create secure hash using HMAC SHA256
     */
    createSecureHash(data) {
        return crypto_1.default
            .createHmac("sha512", this.config.vnp_HashSecret)
            .update(Buffer.from(data, "utf-8"))
            .digest("hex");
    }
    /**
     * Sort parameters by key (required by VNPay) - A to Z
     */
    sortParams(params) {
        const sortedKeys = Object.keys(params).sort();
        const sortedParams = {};
        sortedKeys.forEach((key) => {
            const value = params[key];
            if (value !== "" && value !== undefined && value !== null) {
                sortedParams[key] = value;
            }
        });
        return sortedParams;
    }
    /**
     * Format date for VNPay (yyyyMMddHHmmss) với GMT+7
     */
    formatDateGMT7(date) {
        // Chuyển sang GMT+7 (Vietnam timezone)
        const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
        const year = vietnamTime.getUTCFullYear();
        const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, "0");
        const day = String(vietnamTime.getUTCDate()).padStart(2, "0");
        const hours = String(vietnamTime.getUTCHours()).padStart(2, "0");
        const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, "0");
        const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, "0");
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    /**
     * Generate unique transaction reference - phải unique cho mỗi giao dịch
     */
    generateTxnRef(appointmentId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Đảm bảo unique bằng timestamp + random + appointmentId
        return `${timestamp}${random}${appointmentId.slice(-4)}`;
    }
    /**
     * Debug helper - compute signData and secure hash for given params
     * Returns signData, computedHash and the sorted params used for signing.
     */
    computeHashForParams(params) {
        const sortedParams = this.sortParams(params);
        const signData = this.createSignData(sortedParams);
        const computedHash = this.createSecureHash(signData).toLowerCase();
        return { signData, computedHash, sortedParams };
    }
}
exports.VNPayService = VNPayService;
exports.vnpayService = new VNPayService();
