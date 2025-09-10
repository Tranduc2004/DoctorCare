import { Router } from 'express';
import { getActiveSpecialties, getSpecialtyById } from '../../admin/controllers';

const router = Router();

// Route công khai - không cần xác thực
// Lấy danh sách chuyên khoa đang hoạt động
// Đặt route này TRƯỚC route /:id để tránh conflict
router.get('/active', getActiveSpecialties);

// Lấy chuyên khoa theo ID (công khai)
// Đặt route này SAU route /active
router.get('/:id', getSpecialtyById);

export default router;
