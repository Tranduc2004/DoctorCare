import { Request, Response } from "express";
import Invoice from "../../patient/models/Invoice";
import BankAccount from "../../shared/models/BankAccount";
import Payment, { IPayment } from "../../../shared/models/Payment";
import { PaymentStatus } from "../../../shared/types/appointment";
import { IPatient } from "../../../shared/interfaces/patient.interface";
import mongoose from "mongoose";

// Get all payments with filters
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (req.query.status && req.query.status !== "all") {
      filter.status = req.query.status;
    }

    if (req.query.paymentMethod && req.query.paymentMethod !== "all") {
      filter.paymentMethod = req.query.paymentMethod;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string),
      };
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, "i");
      filter.$or = [
        { transactionId: searchRegex },
        { description: searchRegex },
        { "paymentDetails.accountHolder": searchRegex },
      ];
    }

    // Get payments with pagination
    const payments = await Payment.find(filter)
      .populate("patientId", "fullName phone email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: total,
      },
    });
  } catch (error) {
    console.error("Error getting payments:", error);
    res.status(500).json({ message: "Error fetching payments" });
  }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("patientId", "fullName phone email")
      .populate("appointmentId")
      .populate("prescriptionId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error getting payment:", error);
    res.status(500).json({ message: "Error fetching payment details" });
  }
};

// Process refund
export const refundPayment = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;
    const payment = await Payment.findById(req.params.id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== PaymentStatus.CAPTURED) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Payment cannot be refunded" });
    }

    // Update payment status
    payment.status = PaymentStatus.REFUNDED;
    payment.refundReason = reason;
    await payment.save({ session });

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

    await session.commitTransaction();
    res.json({ message: "Payment refunded successfully", payment });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error refunding payment:", error);
    res.status(500).json({ message: "Error processing refund" });
  } finally {
    session.endSession();
  }
};

// Update payment status
export const updatePaymentStatus = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, reason } = req.body;
    const payment = await Payment.findById(req.params.id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Payment not found" });
    }

    // Validate status transition
    const validTransitions: { [key: string]: PaymentStatus[] } = {
      [PaymentStatus.PENDING]: [PaymentStatus.CAPTURED, PaymentStatus.FAILED],
      [PaymentStatus.CAPTURED]: [PaymentStatus.REFUNDED],
      [PaymentStatus.FAILED]: [PaymentStatus.PENDING],
      [PaymentStatus.REFUNDED]: [],
      [PaymentStatus.AUTHORIZED]: [
        PaymentStatus.CAPTURED,
        PaymentStatus.FAILED,
      ],
    };

    if (!validTransitions[payment.status].includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Cannot transition payment from ${payment.status} to ${status}`,
      });
    }

    // Update payment
    payment.status = status;
    if (status === "refunded") {
      payment.refundReason = reason;
    }
    await payment.save({ session });

    await session.commitTransaction();
    res.json({ message: "Payment status updated successfully", payment });
  } catch (error) {
    await session.abortTransaction();
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Error updating payment status" });
  } finally {
    session.endSession();
  }
};

// Get payment statistics
export const getPaymentStatistics = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    // Total amount statistics
    const totalStats = await Payment.aggregate([
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
    const methodStats = await Payment.aggregate([
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
    const statusStats = await Payment.aggregate([
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
    const dailyStats = await Payment.aggregate([
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
  } catch (error) {
    console.error("Error getting payment statistics:", error);
    res.status(500).json({ message: "Error fetching payment statistics" });
  }
};

// Export payments data
export const exportPayments = async (req: Request, res: Response) => {
  try {
    const { format = "csv", startDate, endDate } = req.query;

    const filter: any = {};
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const payments = await Payment.find(filter)
      .populate("patientId", "fullName phone email")
      .sort({ createdAt: -1 });

    // Convert payments to CSV/Excel format
    const data = payments.map((payment) => {
      const p = payment.toObject<IPayment & { patientId: IPatient }>();
      return {
        "Transaction ID": p.transactionId || p._id,
        "Patient Name": p.patientId?.fullName || "N/A",
        "Patient Phone": p.patientId?.phone || "N/A",
        "Patient Email": p.patientId?.email || "N/A",
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
    } else if (format === "excel") {
      // TODO: Implement Excel export
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=payments.xlsx"
      );
      // Convert data to Excel and send
    }

    res.json(data);
  } catch (error) {
    console.error("Error exporting payments:", error);
    res.status(500).json({ message: "Error exporting payment data" });
  }
};

// Create a PayOS order for an invoice (admin action)
export const createPayosOrderForInvoice = async (
  req: Request,
  res: Response
) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Choose active bank account if any
    let account = await BankAccount.findOne({ active: true }).sort({
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

    let respData: any = null;
    if (typeof PayOS === "function") {
      const payosClient = new PayOS(
        payosClientId,
        payosApiKey,
        process.env.PAYOS_CHECKSUM_KEY
      );
      const resp = await payosClient.paymentRequests.create(orderPayload);
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
      await invoice.save();
    } catch (e) {
      console.warn("Failed to persist payosOrderId on invoice (admin)", e);
    }

    return res.json({ success: true, payosCheckout: respData });
  } catch (err: unknown) {
    const e = err as Error;
    console.error("Error creating PayOS order (admin):", e);
    return res
      .status(500)
      .json({ message: "Internal error", error: e.message });
  }
};
