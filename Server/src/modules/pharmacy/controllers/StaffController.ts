import { Request, Response } from "express";
import {
  ApiResponse,
  StaffQuery,
  StaffStatus,
  CreateStaffDTO,
  UpdateStaffDTO,
} from "@medicare/shared";
import { Staff, IStaff } from "../../../models/Staff";

export class StaffController {
  // Get all staff with pagination and filtering
  static async getAllStaff(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status
        ? (req.query.status as unknown as StaffStatus)
        : undefined;

      const query: StaffQuery = {
        status,
        role: req.query.role as "admin" | "staff",
        active: req.query.active ? req.query.active === "true" : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      // Build filter object
      const filter: any = {};
      if (status) filter.status = status;
      if (query.role) filter.role = query.role;
      if (query.active !== undefined) filter.active = query.active;
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: "i" } },
          { email: { $regex: query.search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[query.sortBy || "createdAt"] = query.sortOrder === "asc" ? 1 : -1;

      // Calculate pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // Execute queries
      const [staff, total] = await Promise.all([
        Staff.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-password"),
        Staff.countDocuments(filter),
      ]);

      const result = {
        staff,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };

      const response: ApiResponse = {
        success: true,
        data: result,
        message: "Staff retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error getting staff:", error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get staff",
      };
      res.status(500).json(response);
    }
  }

  // Get staff by ID
  static async getStaffById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const staff = await Staff.findById(id).select("-password");

      if (!staff) {
        const response: ApiResponse = {
          success: false,
          error: "Staff not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: staff,
        message: "Staff retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error getting staff by ID:", error);
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get staff",
      };
      res.status(500).json(response);
    }
  }

  // Approve staff
  static async approveStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = (req as any).admin?.id || "system";

      const staff = await Staff.findByIdAndUpdate(
        id,
        {
          status: "approved",
          approvedBy: adminId,
          approvedAt: new Date(),
          active: true,
        },
        { new: true, runValidators: true }
      ).select("-password");

      if (!staff) {
        const response: ApiResponse = {
          success: false,
          error: "Staff not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: staff,
        message: "Staff approved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error approving staff:", error);
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to approve staff",
      };
      res.status(500).json(response);
    }
  }

  // Reject staff
  static async rejectStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = (req as any).admin?.id || "system";

      if (!reason) {
        const response: ApiResponse = {
          success: false,
          error: "Rejection reason is required",
        };
        res.status(400).json(response);
        return;
      }

      const staff = await Staff.findByIdAndUpdate(
        id,
        {
          status: "rejected",
          rejectedReason: reason,
          approvedBy: adminId,
          approvedAt: new Date(),
          active: false,
        },
        { new: true, runValidators: true }
      ).select("-password");

      if (!staff) {
        const response: ApiResponse = {
          success: false,
          error: "Staff not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: staff,
        message: "Staff rejected successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error rejecting staff:", error);
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to reject staff",
      };
      res.status(500).json(response);
    }
  }

  // Update staff status (active/inactive)
  static async updateStaffStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { active } = req.body;

      if (typeof active !== "boolean") {
        const response: ApiResponse = {
          success: false,
          error: "Active status must be a boolean",
        };
        res.status(400).json(response);
        return;
      }

      const staff = await Staff.findByIdAndUpdate(
        id,
        { active },
        { new: true, runValidators: true }
      ).select("-password");

      if (!staff) {
        const response: ApiResponse = {
          success: false,
          error: "Staff not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: staff,
        message: `Staff ${active ? "activated" : "deactivated"} successfully`,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error updating staff status:", error);
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update staff status",
      };
      res.status(500).json(response);
    }
  }

  // Update staff role
  static async updateStaffRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !["admin", "staff"].includes(role)) {
        const response: ApiResponse = {
          success: false,
          error: "Valid role (admin or staff) is required",
        };
        res.status(400).json(response);
        return;
      }

      const staff = await Staff.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
      ).select("-password");

      if (!staff) {
        const response: ApiResponse = {
          success: false,
          error: "Staff not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: staff,
        message: "Staff role updated successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error updating staff role:", error);
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update staff role",
      };
      res.status(500).json(response);
    }
  }

  // Delete staff
  static async deleteStaff(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await Staff.findByIdAndDelete(id);
      const success = result !== null;

      if (!success) {
        const response: ApiResponse = {
          success: false,
          error: "Staff not found",
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: "Staff deleted successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error deleting staff:", error);
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete staff",
      };
      res.status(500).json(response);
    }
  }

  // Get staff statistics
  static async getStaffStats(req: Request, res: Response): Promise<void> {
    try {
      const [totalStats, statusStats, roleStats] = await Promise.all([
        Staff.countDocuments(),
        Staff.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Staff.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      ]);

      const stats = {
        total: totalStats,
        byStatus: statusStats.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        byRole: roleStats.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
      };

      const response: ApiResponse = {
        success: true,
        data: stats,
        message: "Staff statistics retrieved successfully",
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error getting staff stats:", error);
      const response: ApiResponse = {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get staff statistics",
      };
      res.status(500).json(response);
    }
  }
}
