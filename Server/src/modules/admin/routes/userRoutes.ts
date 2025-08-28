import { Router } from "express";
import {
  getAllUsers,
  getUsersByRole,
  updateUser,
  deleteUser,
  getUserStats,
  getUserById,
} from "../controllers";

const router = Router();

// Admin: Quản lý tất cả người dùng
router.get("/", getAllUsers);
router.get("/role/:role", getUsersByRole);
// approve/reject có thể dùng updateUser với role=doctor và status
router.get("/stats", getUserStats);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
