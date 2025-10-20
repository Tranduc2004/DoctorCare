import {
  Staff,
  IStaff,
  CreateStaffDTO,
  UpdateStaffDTO,
  StaffQuery,
} from "./StaffModel";

export class StaffService {
  // Create new staff
  static async createStaff(staffData: CreateStaffDTO): Promise<IStaff> {
    try {
      const existingStaff = await Staff.findOne({ email: staffData.email });
      if (existingStaff) {
        throw new Error("Email already exists");
      }

      const staff = new Staff(staffData);
      return await staff.save();
    } catch (error) {
      throw error;
    }
  }

  // Get all staff with filtering and pagination
  static async getAllStaff(query: StaffQuery = {}) {
    try {
      const {
        status,
        role,
        active,
        search,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      // Build filter object
      const filter: any = {};
      if (status) filter.status = status;
      if (role) filter.role = role;
      if (active !== undefined) filter.active = active;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Calculate pagination
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
      throw error;
    }
  }

  // Get staff by ID
  static async getStaffById(id: string): Promise<IStaff | null> {
    try {
      return await Staff.findById(id).select("-password");
    } catch (error) {
      throw error;
    }
  }

  // Get staff by email (for authentication)
  static async getStaffByEmail(email: string): Promise<IStaff | null> {
    try {
      return await Staff.findOne({ email }).select("+password");
    } catch (error) {
      throw error;
    }
  }

  // Update staff
  static async updateStaff(
    id: string,
    updateData: UpdateStaffDTO
  ): Promise<IStaff | null> {
    try {
      return await Staff.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    } catch (error) {
      throw error;
    }
  }

  // Approve staff
  static async approveStaff(
    id: string,
    approvedBy: string
  ): Promise<IStaff | null> {
    try {
      return await Staff.findByIdAndUpdate(
        id,
        {
          status: "approved",
          approvedBy,
          approvedAt: new Date(),
          active: true,
        },
        { new: true, runValidators: true }
      ).select("-password");
    } catch (error) {
      throw error;
    }
  }

  // Reject staff
  static async rejectStaff(
    id: string,
    rejectedReason: string,
    rejectedBy: string
  ): Promise<IStaff | null> {
    try {
      return await Staff.findByIdAndUpdate(
        id,
        {
          status: "rejected",
          rejectedReason,
          approvedBy: rejectedBy,
          approvedAt: new Date(),
          active: false,
        },
        { new: true, runValidators: true }
      ).select("-password");
    } catch (error) {
      throw error;
    }
  }

  // Toggle staff active status
  static async toggleStaffStatus(
    id: string,
    active: boolean
  ): Promise<IStaff | null> {
    try {
      return await Staff.findByIdAndUpdate(
        id,
        { active },
        { new: true, runValidators: true }
      ).select("-password");
    } catch (error) {
      throw error;
    }
  }

  // Update staff role
  static async updateStaffRole(
    id: string,
    role: "admin" | "staff"
  ): Promise<IStaff | null> {
    try {
      return await Staff.findByIdAndUpdate(
        id,
        { role },
        { new: true, runValidators: true }
      ).select("-password");
    } catch (error) {
      throw error;
    }
  }

  // Delete staff
  static async deleteStaff(id: string): Promise<boolean> {
    try {
      const result = await Staff.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      throw error;
    }
  }

  // Get staff statistics
  static async getStaffStats() {
    try {
      const [totalStats, statusStats, roleStats] = await Promise.all([
        Staff.countDocuments(),
        Staff.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Staff.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      ]);

      return {
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
    } catch (error) {
      throw error;
    }
  }
}
