import Service, { IService } from '../models/Service';

export interface CreateServiceData {
  name: string;
  description: string;
  price: number;
  duration: number;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  isActive?: boolean;
}

export class ServiceService {
  // Lấy tất cả dịch vụ
  async getAllServices(): Promise<IService[]> {
    return await Service.find().sort({ createdAt: -1 });
  }

  // Lấy dịch vụ theo ID
  async getServiceById(id: string): Promise<IService | null> {
    return await Service.findById(id);
  }

  // Tạo dịch vụ mới
  async createService(data: CreateServiceData): Promise<IService> {
    const service = new Service(data);
    return await service.save();
  }

  // Cập nhật dịch vụ
  async updateService(id: string, data: UpdateServiceData): Promise<IService | null> {
    return await Service.findByIdAndUpdate(
      id,
      { ...data },
      { new: true, runValidators: true }
    );
  }

  // Xóa dịch vụ (soft delete)
  async deleteService(id: string): Promise<IService | null> {
    return await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
  }

  // Xóa hoàn toàn dịch vụ
  async hardDeleteService(id: string): Promise<boolean> {
    const result = await Service.findByIdAndDelete(id);
    return !!result;
  }

  // Tìm kiếm dịch vụ
  async searchServices(query: string): Promise<IService[]> {
    return await Service.find({
      $text: { $search: query },
      isActive: true
    }).sort({ score: { $meta: "textScore" } });
  }

  // Lấy dịch vụ đang hoạt động
  async getActiveServices(): Promise<IService[]> {
    return await Service.find({ isActive: true }).sort({ name: 1 });
  }
}

export default new ServiceService();
