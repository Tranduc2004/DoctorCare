// DEPRECATED: This controller is replaced by pharmacy module StaffController
// TODO: Remove this file after migration is complete

import { Request, Response } from "express";

// Temporary empty exports to prevent routing errors
export const getAllPharmacyStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff instead.",
    });
};

export const getPharmacyStaffById = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id instead.",
    });
};

export const createPharmacyStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({ success: false, error: "This endpoint is deprecated." });
};

export const approvePharmacyStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id/approve instead.",
    });
};

export const rejectPharmacyStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id/reject instead.",
    });
};

export const updatePharmacyStaffPermissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({ success: false, error: "This endpoint is deprecated." });
};

export const togglePharmacyStaffStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id/status instead.",
    });
};

export const deletePharmacyStaff = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff/:id instead.",
    });
};

export const getPharmacyStaffStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  res
    .status(501)
    .json({
      success: false,
      error:
        "This endpoint is deprecated. Use /api/admin/pharmacy/staff/stats instead.",
    });
};
