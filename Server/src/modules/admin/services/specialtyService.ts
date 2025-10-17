import Specialty, { ISpecialty } from "../models/Specialty";

export interface CreateSpecialtyData {
  name: string;
  description: string;
}

export interface UpdateSpecialtyData {
  name?: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
}

export class SpecialtyService {
  // Lấy tất cả chuyên khoa
  async getAllSpecialties(): Promise<ISpecialty[]> {
    return await Specialty.find().sort({ createdAt: -1 });
  }

  // Lấy chuyên khoa theo ID
  async getSpecialtyById(id: string): Promise<ISpecialty | null> {
    return await Specialty.findById(id);
  }

  // Tạo chuyên khoa mới
  async createSpecialty(data: CreateSpecialtyData): Promise<ISpecialty> {
    const specialty = new Specialty(data);
    return await specialty.save();
  }

  // Cập nhật chuyên khoa
  async updateSpecialty(
    id: string,
    data: UpdateSpecialtyData
  ): Promise<ISpecialty | null> {
    return await Specialty.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    );
  }

  // Xóa chuyên khoa (soft delete)
  async deleteSpecialty(id: string): Promise<ISpecialty | null> {
    return await Specialty.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  // Xóa hoàn toàn chuyên khoa
  async hardDeleteSpecialty(id: string): Promise<boolean> {
    const result = await Specialty.findByIdAndDelete(id);
    return !!result;
  }

  // Tìm kiếm chuyên khoa
  async searchSpecialties(query: string): Promise<ISpecialty[]> {
    return await Specialty.find({
      $text: { $search: query },
      isActive: true,
    }).sort({ score: { $meta: "textScore" } });
  }

  // Lấy chuyên khoa đang hoạt động
  async getActiveSpecialties(): Promise<ISpecialty[]> {
    return await Specialty.find({ isActive: true }).sort({ name: 1 });
  }

  // Kiểm tra chuyên khoa có tồn tại không
  async checkSpecialtyExists(
    name: string,
    excludeId?: string
  ): Promise<boolean> {
    const query: any = { name: { $regex: new RegExp(`^${name}$`, "i") } };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const existing = await Specialty.findOne(query);
    return !!existing;
  }
}

export default new SpecialtyService();
