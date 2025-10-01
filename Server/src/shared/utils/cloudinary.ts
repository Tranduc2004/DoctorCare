import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Cấu hình cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (
  filePath: string,
  folder: string = "general"
): Promise<{ url: string; public_id: string }> => {
  try {
    // Upload file lên cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `medicare/${folder}`, // Tên thư mục trên cloudinary
      resource_type: "auto", // Tự động phát hiện loại file
    });

    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    // Xóa file tạm nếu upload thất bại
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const deleteFromCloudinary = async (
  public_id: string
): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(public_id);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

// Chức năng upload ảnh cho hồ sơ bệnh án
export const uploadMedicalRecordImage = async (
  filePath: string,
  medicalRecordId: string,
  imageType: "xray" | "lab_result" | "prescription" | "document" | "other" = "document"
): Promise<{ url: string; public_id: string; thumbnail_url?: string }> => {
  try {
    // Upload ảnh gốc với tối ưu hóa
    const result = await cloudinary.uploader.upload(filePath, {
      folder: `medicare/medical-records/${medicalRecordId}/${imageType}`,
      resource_type: "image",
      transformation: [
        { quality: "auto:good" }, // Tự động tối ưu chất lượng
        { fetch_format: "auto" }, // Tự động chọn format tốt nhất
        { width: 1920, height: 1080, crop: "limit" } // Giới hạn kích thước tối đa
      ],
      tags: [`medical_record_${medicalRecordId}`, `type_${imageType}`] // Thêm tags để dễ quản lý
    });

    // Tạo thumbnail cho ảnh
    const thumbnailUrl = cloudinary.url(result.public_id, {
      transformation: [
        { width: 300, height: 300, crop: "fill", gravity: "center" },
        { quality: "auto:low" },
        { fetch_format: "auto" }
      ]
    });

    // Xóa file tạm sau khi upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      public_id: result.public_id,
      thumbnail_url: thumbnailUrl,
    };
  } catch (error) {
    // Xóa file tạm nếu upload thất bại
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Medical record image upload error:", error);
    throw error;
  }
};

// Upload nhiều ảnh cho hồ sơ bệnh án
export const uploadMultipleMedicalRecordImages = async (
  filePaths: string[],
  medicalRecordId: string,
  imageType: "xray" | "lab_result" | "prescription" | "document" | "other" = "document"
): Promise<Array<{ url: string; public_id: string; thumbnail_url?: string; originalName?: string }>> => {
  try {
    const uploadPromises = filePaths.map(async (filePath, index) => {
      const result = await uploadMedicalRecordImage(filePath, medicalRecordId, imageType);
      return {
        ...result,
        originalName: `${imageType}_${index + 1}` // Tên gốc để nhận diện
      };
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Multiple medical record images upload error:", error);
    throw error;
  }
};

// Xóa tất cả ảnh của một hồ sơ bệnh án
export const deleteMedicalRecordImages = async (
  medicalRecordId: string
): Promise<void> => {
  try {
    // Tìm tất cả ảnh có tag medical_record_id
    const searchResult = await cloudinary.search
      .expression(`tags:medical_record_${medicalRecordId}`)
      .execute();

    if (searchResult.resources && searchResult.resources.length > 0) {
      const publicIds = searchResult.resources.map((resource: any) => resource.public_id);
      
      // Xóa tất cả ảnh
      await cloudinary.api.delete_resources(publicIds);
      
      console.log(`Deleted ${publicIds.length} images for medical record ${medicalRecordId}`);
    }
  } catch (error) {
    console.error("Delete medical record images error:", error);
    throw error;
  }
};

// Lấy danh sách ảnh của hồ sơ bệnh án
export const getMedicalRecordImages = async (
  medicalRecordId: string,
  imageType?: "xray" | "lab_result" | "prescription" | "document" | "other"
): Promise<Array<{ url: string; public_id: string; thumbnail_url: string; created_at: string; type: string }>> => {
  try {
    let searchExpression = `tags:medical_record_${medicalRecordId}`;
    
    if (imageType) {
      searchExpression += ` AND tags:type_${imageType}`;
    }

    const searchResult = await cloudinary.search
      .expression(searchExpression)
      .sort_by("created_at", "desc")
      .max_results(100)
      .execute();

    if (searchResult.resources) {
      return searchResult.resources.map((resource: any) => {
        // Tạo thumbnail URL
        const thumbnailUrl = cloudinary.url(resource.public_id, {
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "center" },
            { quality: "auto:low" },
            { fetch_format: "auto" }
          ]
        });

        // Lấy loại ảnh từ tags
        const typeTag = resource.tags?.find((tag: string) => tag.startsWith('type_'));
        const type = typeTag ? typeTag.replace('type_', '') : 'unknown';

        return {
          url: resource.secure_url,
          public_id: resource.public_id,
          thumbnail_url: thumbnailUrl,
          created_at: resource.created_at,
          type: type
        };
      });
    }

    return [];
  } catch (error) {
    console.error("Get medical record images error:", error);
    throw error;
  }
};

// ==================== CHỨC NĂNG UPLOAD TÀI LIỆU HỒ SƠ BỆNH ÁN ====================

// Upload tài liệu cho hồ sơ bệnh án (PDF, Word, Excel, v.v.)
export const uploadMedicalRecordDocument = async (
  filePath: string,
  medicalRecordId: string,
  originalName: string,
  documentType: "pdf" | "word" | "excel" | "text" | "other" = "other"
): Promise<{ url: string; fileName: string; originalName: string; size: number }> => {
  try {
    // Tạo thư mục uploads nếu chưa tồn tại
    const uploadsDir = path.join(process.cwd(), "uploads", "medical-records", medicalRecordId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Tạo tên file unique với timestamp
    const fileExtension = path.extname(originalName);
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const fileName = `${timestamp}-${randomNum}${fileExtension}`;
    const destinationPath = path.join(uploadsDir, fileName);

    // Copy file từ temp location đến uploads folder
    fs.copyFileSync(filePath, destinationPath);

    // Lấy thông tin file
    const stats = fs.statSync(destinationPath);
    const fileSize = stats.size;

    // Xóa file tạm
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Tạo URL để truy cập file
    const fileUrl = `/uploads/medical-records/${medicalRecordId}/${fileName}`;

    return {
      url: fileUrl,
      fileName: fileName,
      originalName: originalName,
      size: fileSize,
    };
  } catch (error) {
    // Xóa file tạm nếu upload thất bại
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error("Medical record document upload error:", error);
    throw error;
  }
};

// Upload nhiều tài liệu cho hồ sơ bệnh án
export const uploadMultipleMedicalRecordDocuments = async (
  files: Array<{ filePath: string; originalName: string; documentType?: "pdf" | "word" | "excel" | "text" | "other" }>,
  medicalRecordId: string
): Promise<Array<{ url: string; fileName: string; originalName: string; size: number; error?: string }>> => {
  const results = [];

  for (const file of files) {
    try {
      const result = await uploadMedicalRecordDocument(
        file.filePath,
        medicalRecordId,
        file.originalName,
        file.documentType || "other"
      );
      results.push(result);
    } catch (error) {
      console.error(`Error uploading ${file.originalName}:`, error);
      results.push({
        url: "",
        fileName: "",
        originalName: file.originalName,
        size: 0,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  }

  return results;
};

// Xóa tài liệu hồ sơ bệnh án
export const deleteMedicalRecordDocument = async (
  medicalRecordId: string,
  fileName: string
): Promise<void> => {
  try {
    const filePath = path.join(process.cwd(), "uploads", "medical-records", medicalRecordId, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted document: ${fileName} for medical record: ${medicalRecordId}`);
    } else {
      console.warn(`Document not found: ${fileName} for medical record: ${medicalRecordId}`);
    }
  } catch (error) {
    console.error("Error deleting medical record document:", error);
    throw error;
  }
};

// Xóa tất cả tài liệu của hồ sơ bệnh án
export const deleteMedicalRecordDocuments = async (
  medicalRecordId: string
): Promise<void> => {
  try {
    const documentsDir = path.join(process.cwd(), "uploads", "medical-records", medicalRecordId);
    
    if (fs.existsSync(documentsDir)) {
      const files = fs.readdirSync(documentsDir);
      
      // Xóa từng file
      for (const file of files) {
        const filePath = path.join(documentsDir, file);
        fs.unlinkSync(filePath);
      }
      
      // Xóa thư mục nếu rỗng
      fs.rmdirSync(documentsDir);
      console.log(`Deleted all documents for medical record: ${medicalRecordId}`);
    }
  } catch (error) {
    console.error("Error deleting medical record documents:", error);
    throw error;
  }
};

// Lấy danh sách tài liệu của hồ sơ bệnh án
export const getMedicalRecordDocuments = async (
  medicalRecordId: string
): Promise<Array<{ url: string; fileName: string; originalName: string; size: number; uploadedAt: Date; extension: string }>> => {
  try {
    const documentsDir = path.join(process.cwd(), "uploads", "medical-records", medicalRecordId);
    
    if (!fs.existsSync(documentsDir)) {
      return [];
    }

    const files = fs.readdirSync(documentsDir);
    const documents = [];

    for (const fileName of files) {
      const filePath = path.join(documentsDir, fileName);
      const stats = fs.statSync(filePath);
      
      // Tách timestamp từ tên file để lấy tên gốc
      const parts = fileName.split('-');
      const timestamp = parts[0];
      const extension = path.extname(fileName);
      const originalName = fileName.replace(`${timestamp}-${parts[1]}`, '').replace(extension, '') + extension;

      documents.push({
        url: `/uploads/medical-records/${medicalRecordId}/${fileName}`,
        fileName: fileName,
        originalName: originalName || fileName,
        size: stats.size,
        uploadedAt: stats.birthtime,
        extension: extension.toLowerCase(),
      });
    }

    // Sắp xếp theo thời gian upload (mới nhất trước)
    documents.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    return documents;
  } catch (error) {
    console.error("Error getting medical record documents:", error);
    throw error;
  }
};

// Kiểm tra loại file có được phép upload không
export const isAllowedDocumentType = (fileName: string): boolean => {
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.txt', '.rtf', '.csv', '.zip', '.rar', '.7z'
  ];
  
  const extension = path.extname(fileName).toLowerCase();
  return allowedExtensions.includes(extension);
};

// Lấy loại tài liệu dựa trên extension
export const getDocumentType = (fileName: string): "pdf" | "word" | "excel" | "text" | "other" => {
  const extension = path.extname(fileName).toLowerCase();
  
  if (extension === '.pdf') return 'pdf';
  if (['.doc', '.docx'].includes(extension)) return 'word';
  if (['.xls', '.xlsx'].includes(extension)) return 'excel';
  if (['.txt', '.rtf'].includes(extension)) return 'text';
  
  return 'other';
};

export default cloudinary;
