import { Request, Response, NextFunction, RequestHandler } from "express";
import serviceService, {
  CreateServiceData,
  UpdateServiceData,
} from "../services/serviceService";

// Lấy tất cả dịch vụ
export const getAllServices: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await serviceService.getAllServices();
    res.json({
      success: true,
      data: services,
      message: "Lấy danh sách dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error getting services:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách dịch vụ",
    });
  }
};

// Lấy dịch vụ theo ID
export const getServiceById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const service = await serviceService.getServiceById(id);

    if (!service) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
      return;
    }

    res.json({
      success: true,
      data: service,
      message: "Lấy thông tin dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error getting service by id:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin dịch vụ",
    });
  }
};

// Tạo dịch vụ mới
export const createService: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, price, duration } = req.body;

    // Validation
    if (!name || !description || !price || !duration) {
      res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    if (price < 0) {
      res.status(400).json({
        success: false,
        message: "Giá dịch vụ không được âm",
      });
      return;
    }

    if (duration < 15) {
      res.status(400).json({
        success: false,
        message: "Thời gian khám tối thiểu là 15 phút",
      });
      return;
    }

    const serviceData: CreateServiceData = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      duration: Number(duration),
    };

    const newService = await serviceService.createService(serviceData);

    res.status(201).json({
      success: true,
      data: newService,
      message: "Tạo dịch vụ thành công",
    });
  } catch (error: any) {
    console.error("Error creating service:", error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Tên dịch vụ đã tồn tại",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo dịch vụ",
    });
  }
};

// Cập nhật dịch vụ
export const updateService: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData: UpdateServiceData = req.body;

    // Validation
    if (updateData.price !== undefined && updateData.price < 0) {
      res.status(400).json({
        success: false,
        message: "Giá dịch vụ không được âm",
      });
      return;
    }

    if (updateData.duration !== undefined && updateData.duration < 15) {
      res.status(400).json({
        success: false,
        message: "Thời gian khám tối thiểu là 15 phút",
      });
      return;
    }

    const updatedService = await serviceService.updateService(id, updateData);

    if (!updatedService) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
      return;
    }

    res.json({
      success: true,
      data: updatedService,
      message: "Cập nhật dịch vụ thành công",
    });
  } catch (error: any) {
    console.error("Error updating service:", error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Tên dịch vụ đã tồn tại",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật dịch vụ",
    });
  }
};

// Xóa dịch vụ (soft delete)
export const deleteService: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedService = await serviceService.deleteService(id);

    if (!deletedService) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
      return;
    }

    res.json({
      success: true,
      message: "Xóa dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa dịch vụ",
    });
  }
};

// Xóa hoàn toàn dịch vụ
export const hardDeleteService: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const isDeleted = await serviceService.hardDeleteService(id);

    if (!isDeleted) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy dịch vụ",
      });
      return;
    }

    res.json({
      success: true,
      message: "Xóa hoàn toàn dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error hard deleting service:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa dịch vụ",
    });
  }
};

// Tìm kiếm dịch vụ
export const searchServices: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        message: "Vui lòng nhập từ khóa tìm kiếm",
      });
      return;
    }

    const services = await serviceService.searchServices(q);

    res.json({
      success: true,
      data: services,
      message: "Tìm kiếm dịch vụ thành công",
    });
  } catch (error) {
    console.error("Error searching services:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm dịch vụ",
    });
  }
};

// Lấy dịch vụ đang hoạt động
export const getActiveServices: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const services = await serviceService.getActiveServices();
    res.json({
      success: true,
      data: services,
      message: "Lấy danh sách dịch vụ đang hoạt động thành công",
    });
  } catch (error) {
    console.error("Error getting active services:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách dịch vụ đang hoạt động",
    });
  }
};
