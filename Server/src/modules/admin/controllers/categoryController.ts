import { Request, Response } from "express";
import mongoose from "mongoose";
import {
  CategoryService,
  ApiResponse,
  ValidationError,
  NotFoundError,
  DuplicateError,
} from "@medicare/shared";
import { CategoryModel } from "../../../models/category";

function getRequestId(req: Request) {
  return (req.headers["x-request-id"] as string) || undefined;
}

function adminOnly(req: Request) {
  const user = (req as any).user || (req as any).admin;
  return (
    user && (user.role === "admin" || user.isAdmin === true || user.adminId)
  );
}

export class CategoryController {
  static async list(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      let limit = parseInt((req.query.limit as string) || "10", 10);
      if (Number.isNaN(limit)) limit = 10;
      limit = Math.min(Math.max(1, limit), 100);

      const query: any = {};
      if (req.query.status) query.status = String(req.query.status);
      if (req.query.search) query.search = String(req.query.search);
      if (req.query.createdByRole)
        query.createdByRole = String(req.query.createdByRole);
      query.page = page;
      query.limit = limit;

      const result = await CategoryService.getAllCategories(
        CategoryModel,
        query
      );

      const response: ApiResponse = {
        success: true,
        data: {
          categories: result.categories,
          pagination: result.pagination,
        },
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.list]",
        requestId,
        error?.message || error
      );

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to list categories",
      };

      return res.status(500).json(response);
    }
  }

  static async getById(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const category = await CategoryService.getCategoryById(CategoryModel, id);

      const response: ApiResponse = {
        success: true,
        data: category,
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.getById]",
        requestId,
        error?.message || error
      );

      if (error.message === "Category not found") {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to get category",
      };

      return res.status(500).json(response);
    }
  }

  static async create(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      if (!adminOnly(req)) {
        const response: ApiResponse = {
          success: false,
          error: "FORBIDDEN",
          message: "Access denied",
        };
        return res.status(403).json(response);
      }

      const user = (req as any).admin ||
        (req as any).user || { id: "admin", username: "admin" };

      const created = await CategoryService.createCategory(
        CategoryModel,
        req.body,
        user.id || user.adminId,
        user.username || user.adminUsername,
        "admin"
      );

      const response: ApiResponse = {
        success: true,
        data: created,
        message: "Category created successfully",
      };

      return res.status(201).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.create]",
        requestId,
        error?.message || error
      );

      if (error.message === "Category code already exists") {
        const response: ApiResponse = {
          success: false,
          error: "DUPLICATE_ERROR",
          message: error.message,
        };
        return res.status(400).json(response);
      }

      if (error.message === "Name and code are required") {
        const response: ApiResponse = {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.message,
        };
        return res.status(400).json(response);
      }

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to create category",
      };

      return res.status(500).json(response);
    }
  }

  static async update(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      if (!adminOnly(req)) {
        const response: ApiResponse = {
          success: false,
          error: "FORBIDDEN",
          message: "Access denied",
        };
        return res.status(403).json(response);
      }

      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const updated = await CategoryService.updateCategory(
        CategoryModel,
        id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: updated,
        message: "Category updated successfully",
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.update]",
        requestId,
        error?.message || error
      );

      if (error.message === "Category not found") {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to update category",
      };

      return res.status(500).json(response);
    }
  }

  static async approve(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      if (!adminOnly(req)) {
        const response: ApiResponse = {
          success: false,
          error: "FORBIDDEN",
          message: "Access denied",
        };
        return res.status(403).json(response);
      }

      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const adminId =
        (req as any).admin?.id || (req as any).user?.id || "admin";
      const approved = await CategoryService.approveCategory(
        CategoryModel,
        id,
        adminId
      );

      const response: ApiResponse = {
        success: true,
        data: approved,
        message: "Category approved successfully",
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.approve]",
        requestId,
        error?.message || error
      );

      if (error.message === "Category not found") {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to approve category",
      };

      return res.status(500).json(response);
    }
  }

  static async reject(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      if (!adminOnly(req)) {
        const response: ApiResponse = {
          success: false,
          error: "FORBIDDEN",
          message: "Access denied",
        };
        return res.status(403).json(response);
      }

      const { id } = req.params;
      const { reason } = req.body || {};

      if (!reason || String(reason).trim() === "") {
        const response: ApiResponse = {
          success: false,
          error: "VALIDATION_ERROR",
          message: "Rejection reason is required",
        };
        return res.status(400).json(response);
      }

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const adminId =
        (req as any).admin?.id || (req as any).user?.id || "admin";
      const rejected = await CategoryService.rejectCategory(
        CategoryModel,
        id,
        reason,
        adminId
      );

      const response: ApiResponse = {
        success: true,
        data: rejected,
        message: "Category rejected successfully",
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.reject]",
        requestId,
        error?.message || error
      );

      if (error.message === "Category not found") {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      if (error.message === "Rejection reason is required") {
        const response: ApiResponse = {
          success: false,
          error: "VALIDATION_ERROR",
          message: error.message,
        };
        return res.status(400).json(response);
      }

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to reject category",
      };

      return res.status(500).json(response);
    }
  }

  static async remove(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      if (!adminOnly(req)) {
        const response: ApiResponse = {
          success: false,
          error: "FORBIDDEN",
          message: "Access denied",
        };
        return res.status(403).json(response);
      }

      const { id } = req.params;
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      await CategoryService.deleteCategory(CategoryModel, id);

      const response: ApiResponse = {
        success: true,
        data: { id },
        message: "Category deleted successfully",
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.remove]",
        requestId,
        error?.message || error
      );

      if (error.message === "Category not found") {
        const response: ApiResponse = {
          success: false,
          error: "NOT_FOUND",
          message: "Category not found",
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to delete category",
      };

      return res.status(500).json(response);
    }
  }

  static async stats(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      const stats = await CategoryService.getCategoryStats(CategoryModel);

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.stats]",
        requestId,
        error?.message || error
      );

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to get category stats",
      };

      return res.status(500).json(response);
    }
  }

  static async listApproved(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      const items = await CategoryService.getApprovedCategories(CategoryModel);

      const response: ApiResponse = {
        success: true,
        data: items,
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.listApproved]",
        requestId,
        error?.message || error
      );

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to get approved categories",
      };

      return res.status(500).json(response);
    }
  }

  static async listMine(req: Request, res: Response): Promise<any> {
    const requestId = getRequestId(req);
    try {
      const user = (req as any).admin || (req as any).user;
      if (!user) {
        const response: ApiResponse = {
          success: false,
          error: "UNAUTHORIZED",
          message: "User not authenticated",
        };
        return res.status(401).json(response);
      }

      const query = {
        createdBy: user.id || user.adminId,
        page: 1,
        limit: 1000, // Get all user's categories
      };

      const result = await CategoryService.getAllCategories(
        CategoryModel,
        query
      );

      const response: ApiResponse = {
        success: true,
        data: result.categories,
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error(
        "[CategoryController.listMine]",
        requestId,
        error?.message || error
      );

      const response: ApiResponse = {
        success: false,
        error: "INTERNAL_ERROR",
        message: error?.message || "Failed to get my categories",
      };

      return res.status(500).json(response);
    }
  }
}
