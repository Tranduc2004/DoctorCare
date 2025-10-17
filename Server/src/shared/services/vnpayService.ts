import crypto from "crypto";
import querystring from "qs";
import { Request } from "express";

interface VNPayConfig {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ReturnUrl: string;
}

interface CreatePaymentUrlParams {
  vnp_Amount: number;
  vnp_TxnRef: string;
  vnp_OrderInfo: string;
  vnp_IpAddr: string;
  vnp_Locale?: string;
  vnp_OrderType?: string;
  vnp_ReturnUrl?: string;
}

interface VNPayReturnQuery {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHashType: string;
  vnp_SecureHash: string;
  [key: string]: string;
}

export class VNPayService {
  private config: VNPayConfig;

  constructor() {
    this.config = {
      vnp_TmnCode: (process.env.VNP_TMN_CODE || "").trim(),
      vnp_HashSecret: (process.env.VNP_HASH_SECRET || "").trim(),
      vnp_Url: (process.env.VNP_URL || "").trim(),
      vnp_ReturnUrl: (process.env.VNP_RETURN_URL || "").trim(),
    };

    // Validate required config
    if (
      !this.config.vnp_TmnCode ||
      !this.config.vnp_HashSecret ||
      !this.config.vnp_Url
    ) {
      throw new Error(
        "VNPay configuration is missing. Please check environment variables."
      );
    }
  }

  /**
   * Create VNPay payment URL
   */
  createPaymentUrl(params: CreatePaymentUrlParams): string {
    const vnp_Params: Record<string, string | number> = {
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
    const paymentUrl =
      this.config.vnp_Url +
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
  verifyReturnUrl(query: VNPayReturnQuery): {
    isValid: boolean;
    isSuccess: boolean;
    data: VNPayReturnQuery;
  } {
    // If caller passed a raw query string, delegate to verifyReturnRaw
    if (typeof (query as any) === "string") {
      return this.verifyReturnRaw(query as unknown as string);
    }

    const vnp_SecureHash = (query as VNPayReturnQuery).vnp_SecureHash;

    // Loại bỏ vnp_SecureHash và vnp_SecureHashType khỏi query để ký
    const {
      vnp_SecureHash: _,
      vnp_SecureHashType: __,
      ...queryWithoutHash
    } = query as VNPayReturnQuery;

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
    const isValid =
      computedHash.toLowerCase() === (vnp_SecureHash || "").toLowerCase();
    console.log("VNPay Signature Valid:", isValid);

    // Check if payment was successful
    const isSuccess =
      (query as VNPayReturnQuery).vnp_ResponseCode === "00" &&
      (query as VNPayReturnQuery).vnp_TransactionStatus === "00";

    return {
      isValid,
      isSuccess,
      data: query as VNPayReturnQuery,
    };
  }

  /**
   * Verify VNPay return when caller provides the raw query string (raw, not URL-decoded)
   * This preserves '+' characters and percent-escapes exactly as VNPay sent them.
   */
  verifyReturnRaw(rawQuery: string): {
    isValid: boolean;
    isSuccess: boolean;
    data: any;
  } {
    // rawQuery is like: vnp_Amount=40000000&vnp_OrderInfo=Thanh+toan...&vnp_SecureHash=...
    const pairs = rawQuery.split("&");
    const paramsRaw: Record<string, string> = {};
    let vnp_SecureHash = "";

    pairs.forEach((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return;
      const key = decodeURIComponent(pair.substring(0, idx));
      const value = pair.substring(idx + 1); // keep encoded value (do NOT decode)
      if (key === "vnp_SecureHash") {
        vnp_SecureHash = decodeURIComponent(value);
      } else if (key === "vnp_SecureHashType") {
        // skip
      } else {
        paramsRaw[key] = value;
      }
    });

    // Build signData by sorting keys and using the raw (encoded) values, normalizing %20->+
    const sortedKeys = Object.keys(paramsRaw).sort();
    const queryPairs: string[] = [];
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
  getClientIpAddress(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "127.0.0.1"
    );
  }

  /**
   * Create signature data string with proper encoding
   * Sort A-Z, encodeURIComponent, chuyển %20 → +
   */
  private createSignData(params: Record<string, any>): string {
    const sortedKeys = Object.keys(params).sort();
    const queryPairs: string[] = [];

    sortedKeys.forEach((key) => {
      const value = params[key];
      if (value !== "" && value !== undefined && value !== null) {
        // encodeURIComponent rồi chuyển %20 thành +
        const encodedValue = encodeURIComponent(String(value)).replace(
          /%20/g,
          "+"
        );
        queryPairs.push(`${key}=${encodedValue}`);
      }
    });

    return queryPairs.join("&");
  }

  /**
   * Create secure hash using HMAC SHA256
   */
  private createSecureHash(data: string): string {
    return crypto
      .createHmac("sha512", this.config.vnp_HashSecret)
      .update(Buffer.from(data, "utf-8"))
      .digest("hex");
  }

  /**
   * Sort parameters by key (required by VNPay) - A to Z
   */
  private sortParams(params: Record<string, any>): Record<string, any> {
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: Record<string, any> = {};

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
  private formatDateGMT7(date: Date): string {
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
  generateTxnRef(appointmentId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    // Đảm bảo unique bằng timestamp + random + appointmentId
    return `${timestamp}${random}${appointmentId.slice(-4)}`;
  }

  /**
   * Debug helper - compute signData and secure hash for given params
   * Returns signData, computedHash and the sorted params used for signing.
   */
  computeHashForParams(params: Record<string, any>): {
    signData: string;
    computedHash: string;
    sortedParams: Record<string, any>;
  } {
    const sortedParams = this.sortParams(params);
    const signData = this.createSignData(sortedParams);
    const computedHash = this.createSecureHash(signData).toLowerCase();
    return { signData, computedHash, sortedParams };
  }
}

export const vnpayService = new VNPayService();
