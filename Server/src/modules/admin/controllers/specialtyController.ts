import { Request, Response, NextFunction, RequestHandler } from "express";
import specialtyService, {
  CreateSpecialtyData,
  UpdateSpecialtyData,
} from "../services/specialtyService";
import {
  uploadSpecialtyImage,
  deleteSpecialtyImage,
  deleteImageByPublicId,
} from "../../../shared/utils/cloudinary";

// Lấy tất cả chuyên khoa
export const getAllSpecialties: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const specialties = await specialtyService.getAllSpecialties();
    res.json({
      success: true,
      data: specialties,
      message: "Lấy danh sách chuyên khoa thành công",
    });
  } catch (error) {
    console.error("Error getting specialties:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách chuyên khoa",
    });
  }
};

// Lấy chuyên khoa theo ID
export const getSpecialtyById: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const specialty = await specialtyService.getSpecialtyById(id);

    if (!specialty) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy chuyên khoa",
      });
      return;
    }

    res.json({
      success: true,
      data: specialty,
      message: "Lấy thông tin chuyên khoa thành công",
    });
  } catch (error) {
    console.error("Error getting specialty by id:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin chuyên khoa",
    });
  }
};

// Tạo chuyên khoa mới
export const createSpecialty: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    // Validation
    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    // Kiểm tra chuyên khoa đã tồn tại
    const exists = await specialtyService.checkSpecialtyExists(name);
    if (exists) {
      res.status(400).json({
        success: false,
        message: "Chuyên khoa đã tồn tại",
      });
      return;
    }

    const specialtyData: CreateSpecialtyData = {
      name: name.trim(),
      description: description.trim(),
    };

    const newSpecialty = await specialtyService.createSpecialty(specialtyData);

    // Upload ảnh nếu có
    let imageData = null;
    if (req.file) {
      try {
        imageData = await uploadSpecialtyImage(
          req.file.path,
          newSpecialty._id as string
        );

        // Cập nhật specialty với thông tin ảnh
        await specialtyService.updateSpecialty(newSpecialty._id as string, {
          imageUrl: imageData.url,
          imagePublicId: imageData.public_id,
          thumbnailUrl: imageData.thumbnail_url,
        });
      } catch (imageError) {
        console.error("Error uploading specialty image:", imageError);
        // Không return error, vì specialty đã được tạo thành công
      }
    }

    // Lấy specialty với thông tin ảnh đã cập nhật
    const updatedSpecialty = await specialtyService.getSpecialtyById(
      newSpecialty._id as string
    );

    res.status(201).json({
      success: true,
      data: updatedSpecialty,
      message: "Tạo chuyên khoa thành công",
    });
  } catch (error: any) {
    console.error("Error creating specialty:", error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Tên chuyên khoa đã tồn tại",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo chuyên khoa",
    });
  }
};

// Cập nhật chuyên khoa
export const updateSpecialty: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData: UpdateSpecialtyData = req.body;

    // Validation
    if (updateData.name && updateData.name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Tên chuyên khoa không được để trống",
      });
      return;
    }

    // Kiểm tra chuyên khoa đã tồn tại (nếu thay đổi tên)
    if (updateData.name) {
      const exists = await specialtyService.checkSpecialtyExists(
        updateData.name,
        id
      );
      if (exists) {
        res.status(400).json({
          success: false,
          message: "Tên chuyên khoa đã tồn tại",
        });
        return;
      }
    }

    // Lấy specialty hiện tại để kiểm tra ảnh cũ
    const currentSpecialty = await specialtyService.getSpecialtyById(id);
    if (!currentSpecialty) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy chuyên khoa",
      });
      return;
    }

    // Xử lý upload ảnh mới
    if (req.file) {
      try {
        // Xóa ảnh cũ nếu có
        if (currentSpecialty.imagePublicId) {
          await deleteImageByPublicId(currentSpecialty.imagePublicId);
        }

        // Upload ảnh mới
        const imageData = await uploadSpecialtyImage(req.file.path, id);
        updateData.imageUrl = imageData.url;
        updateData.imagePublicId = imageData.public_id;
        updateData.thumbnailUrl = imageData.thumbnail_url;
      } catch (imageError) {
        console.error("Error uploading specialty image:", imageError);
        // Tiếp tục update các trường khác
      }
    }

    const updatedSpecialty = await specialtyService.updateSpecialty(
      id,
      updateData
    );

    if (!updatedSpecialty) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy chuyên khoa",
      });
      return;
    }

    res.json({
      success: true,
      data: updatedSpecialty,
      message: "Cập nhật chuyên khoa thành công",
    });
  } catch (error: any) {
    console.error("Error updating specialty:", error);

    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: "Tên chuyên khoa đã tồn tại",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật chuyên khoa",
    });
  }
};

// Xóa chuyên khoa (soft delete)
export const deleteSpecialty: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const deletedSpecialty = await specialtyService.deleteSpecialty(id);

    if (!deletedSpecialty) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy chuyên khoa",
      });
      return;
    }

    res.json({
      success: true,
      message: "Xóa chuyên khoa thành công",
    });
  } catch (error) {
    console.error("Error deleting specialty:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa chuyên khoa",
    });
  }
};

// Xóa hoàn toàn chuyên khoa
export const hardDeleteSpecialty: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Lấy thông tin specialty để xóa ảnh
    const specialty = await specialtyService.getSpecialtyById(id);
    if (specialty && specialty.imagePublicId) {
      try {
        await deleteImageByPublicId(specialty.imagePublicId);
      } catch (imageError) {
        console.error("Error deleting specialty image:", imageError);
      }
    }

    const isDeleted = await specialtyService.hardDeleteSpecialty(id);

    if (!isDeleted) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy chuyên khoa",
      });
      return;
    }

    res.json({
      success: true,
      message: "Xóa hoàn toàn chuyên khoa thành công",
    });
  } catch (error) {
    console.error("Error hard deleting specialty:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa chuyên khoa",
    });
  }
};

// Tìm kiếm chuyên khoa
export const searchSpecialties: RequestHandler = async (
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

    const specialties = await specialtyService.searchSpecialties(q);

    res.json({
      success: true,
      data: specialties,
      message: "Tìm kiếm chuyên khoa thành công",
    });
  } catch (error) {
    console.error("Error searching specialties:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tìm kiếm chuyên khoa",
    });
  }
};

// Lấy chuyên khoa đang hoạt động
export const getActiveSpecialties: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const specialties = await specialtyService.getActiveSpecialties();
    res.json({
      success: true,
      data: specialties,
      message: "Lấy danh sách chuyên khoa đang hoạt động thành công",
    });
  } catch (error) {
    console.error("Error getting active specialties:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách chuyên khoa đang hoạt động",
    });
  }
};
