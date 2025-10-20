import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiResponse, StaffService, CreateStaffDTO } from "@medicare/shared";
import Staff from "../models/Staff";

/**
 * Pharmacy-Service Staff Controller using Shared StaffService
 * Focuses on: Registration, Authentication, Profile Management
 * Admin operations are handled by Main Server
 */

// Register new staff (for pharmacy staff self-registration)
export const registerStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const data: CreateStaffDTO = { name, email, password };

    const staffWithoutPassword = await StaffService.createStaff(Staff, data);

    const response: ApiResponse = {
      success: true,
      data: staffWithoutPassword,
      message: "Staff registration submitted for approval",
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error registering staff:", error);
    const status =
      error instanceof Error && error.message === "Email already exists"
        ? 400
        : 500;
    const response: ApiResponse = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to register staff",
    };
    res.status(status).json(response);
  }
};

// Login staff
export const loginStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const staffWithoutPassword = await StaffService.loginStaff(
      Staff,
      email,
      password
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: (staffWithoutPassword as any)._id,
        email: staffWithoutPassword.email,
        role: staffWithoutPassword.role,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "24h" }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        staff: staffWithoutPassword,
        token,
      },
      message: "Login successful",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error logging in staff:", error);
    const status =
      error instanceof Error &&
      [
        "Invalid credentials",
        "Account not approved yet",
        "Account is inactive",
      ].includes(error.message)
        ? 401
        : 500;
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to login",
    };
    res.status(status).json(response);
  }
};

// Get own profile (staff can only see their own profile)
export const getMyProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staffId = (req as any).staff?.id;

    if (!staffId) {
      const response: ApiResponse = {
        success: false,
        error: "Authentication required",
      };
      res.status(401).json(response);
      return;
    }

    const staff = await StaffService.getStaffById(Staff, staffId);

    const response: ApiResponse = {
      success: true,
      data: staff,
      message: "Profile retrieved successfully",
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting profile:", error);
    const status =
      error instanceof Error && error.message === "Staff not found" ? 404 : 500;
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get profile",
    };
    res.status(status).json(response);
  }
};

// Note: Admin functions (getAllStaff, approveStaff, etc.) are handled by Main Server
// This service only handles staff-specific operations: registration, login, profile
