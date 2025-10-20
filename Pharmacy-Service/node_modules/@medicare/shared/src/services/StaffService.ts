import { StaffQuery, CreateStaffDTO } from "../index";

/**
 * Centralized Staff Service
 * Provides business logic for both Main Server and Pharmacy-Service
 * Eliminates code duplication and ensures consistency
 */
export class StaffService {
  /**
   * Get all staff with pagination and filtering
   */
  static async getAllStaff(staffModel: any, query: StaffQuery) {
    try {
      // Build filter object
      const filter: any = {};
      if (query.status) filter.status = query.status;
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
        staffModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .select("-password"),
        staffModel.countDocuments(filter),
      ]);

      return {
        staff,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get staff"
      );
    }
  }

  /**
   * Get staff by ID
   */
  static async getStaffById(staffModel: any, id: string) {
    try {
      const staff = await staffModel.findById(id).select("-password");

      if (!staff) {
        throw new Error("Staff not found");
      }

      return staff;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to get staff"
      );
    }
  }

  /**
   * Create new staff (registration)
   */
  static async createStaff(staffModel: any, data: CreateStaffDTO) {
    try {
      const { name, email, password } = data;

      if (!name || !email || !password) {
        throw new Error("Name, email, and password are required");
      }

      // Check if email already exists
      const existingStaff = await staffModel.findOne({ email });
      if (existingStaff) {
        throw new Error("Email already exists");
      }

      const staff = new staffModel({
        name,
        email,
        password,
        role: "staff",
      });

      await staff.save();

      // Remove password from response
      const staffResponse = staff.toObject();
      const { password: _, ...staffWithoutPassword } = staffResponse;

      return staffWithoutPassword;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to create staff"
      );
    }
  }

  /**
   * Login staff
   */
  static async loginStaff(staffModel: any, email: string, password: string) {
    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      // Find staff with password
      const staff = await staffModel.findOne({ email }).select("+password");
      if (!staff) {
        throw new Error("Invalid credentials");
      }

      // Check if staff is approved and active
      if (staff.status !== "approved") {
        throw new Error("Account not approved yet");
      }

      if (!staff.active) {
        throw new Error("Account is inactive");
      }

      // Compare password (assuming staff has comparePassword method)
      const isMatch = await (staff as any).comparePassword(password);
      if (!isMatch) {
        throw new Error("Invalid credentials");
      }

      // Remove password from response
      const staffResponse = staff.toObject();
      const { password: __, ...staffWithoutPassword } = staffResponse;

      return staffWithoutPassword;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to login"
      );
    }
  }

  /**
   * Approve staff
   */
  static async approveStaff(
    staffModel: any,
    id: string,
    adminId: string = "system"
  ) {
    try {
      const staff = await staffModel
        .findByIdAndUpdate(
          id,
          {
            status: "approved",
            approvedBy: adminId,
            approvedAt: new Date(),
            active: true,
          },
          { new: true, runValidators: true }
        )
        .select("-password");

      if (!staff) {
        throw new Error("Staff not found");
      }

      return staff;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to approve staff"
      );
    }
  }

  /**
   * Reject staff
   */
  static async rejectStaff(
    staffModel: any,
    id: string,
    reason: string,
    adminId: string = "system"
  ) {
    try {
      if (!reason) {
        throw new Error("Rejection reason is required");
      }

      const staff = await staffModel
        .findByIdAndUpdate(
          id,
          {
            status: "rejected",
            rejectedReason: reason,
            approvedBy: adminId,
            approvedAt: new Date(),
            active: false,
          },
          { new: true, runValidators: true }
        )
        .select("-password");

      if (!staff) {
        throw new Error("Staff not found");
      }

      return staff;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to reject staff"
      );
    }
  }

  /**
   * Update staff status (active/inactive)
   */
  static async updateStaffStatus(staffModel: any, id: string, active: boolean) {
    try {
      if (typeof active !== "boolean") {
        throw new Error("Active status must be a boolean");
      }

      const staff = await staffModel
        .findByIdAndUpdate(id, { active }, { new: true, runValidators: true })
        .select("-password");

      if (!staff) {
        throw new Error("Staff not found");
      }

      return staff;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update staff status"
      );
    }
  }

  /**
   * Update staff role
   */
  static async updateStaffRole(
    staffModel: any,
    id: string,
    role: "admin" | "staff"
  ) {
    try {
      if (!role || !["admin", "staff"].includes(role)) {
        throw new Error("Valid role (admin or staff) is required");
      }

      const staff = await staffModel
        .findByIdAndUpdate(id, { role }, { new: true, runValidators: true })
        .select("-password");

      if (!staff) {
        throw new Error("Staff not found");
      }

      return staff;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to update staff role"
      );
    }
  }

  /**
   * Delete staff
   */
  static async deleteStaff(staffModel: any, id: string) {
    try {
      const result = await staffModel.findByIdAndDelete(id);

      if (!result) {
        throw new Error("Staff not found");
      }

      return true;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to delete staff"
      );
    }
  }

  /**
   * Get staff statistics
   */
  static async getStaffStats(staffModel: any) {
    try {
      const [totalStats, statusStats, roleStats] = await Promise.all([
        staffModel.countDocuments(),
        staffModel.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        staffModel.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } },
        ]),
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

      return stats;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get staff statistics"
      );
    }
  }
}
