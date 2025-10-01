import { Router } from "express";
import { getActiveServices, getServiceById } from "../../admin/controllers";

const router = Router();

// Public routes for services
// Lấy danh sách dịch vụ đang hoạt động
// Đặt route này TRƯỚC route /:id để tránh conflict
router.get("/active", getActiveServices);

// Lấy dịch vụ theo ID (công khai)
// Đặt route này SAU route /active
router.get("/:id", getServiceById);

export default router;
