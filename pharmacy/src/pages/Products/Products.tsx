import React from "react";
import { Package, Plus, Search, Filter } from "lucide-react";

const Products: React.FC = () => {
  return (
    <div className="min-h-screen">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                Quản lý sản phẩm
              </h1>
              <p className="text-slate-600 text-lg">
                Quản lý kho thuốc và các sản phẩm y tế
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                <Plus className="w-5 h-5" />
                Thêm sản phẩm mới
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Tổng sản phẩm
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-2">1,234</p>
                <div className="flex items-center mt-2">
                  <Package className="w-4 h-4 text-teal-500 mr-1" />
                  <span className="text-sm text-teal-600 font-medium">
                    Đang quản lý
                  </span>
                </div>
              </div>
              <div className="p-3 bg-teal-100 rounded-xl">
                <Package className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Sắp hết hàng
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-2">23</p>
                <div className="flex items-center mt-2">
                  <Package className="w-4 h-4 text-amber-500 mr-1" />
                  <span className="text-sm text-amber-600 font-medium">
                    Cần nhập thêm
                  </span>
                </div>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Package className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Hết hàng
                </p>
                <p className="text-3xl font-bold text-red-600 mt-2">5</p>
                <div className="flex items-center mt-2">
                  <Package className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 font-medium">
                    Không còn tồn kho
                  </span>
                </div>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <Package className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">
                  Giá trị kho
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">2.5M</p>
                <div className="flex items-center mt-2">
                  <Package className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Tổng giá trị
                  </span>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur p-6 rounded-2xl shadow-lg border border-teal-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm, SKU, hoạt chất..."
                  className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white/70 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white/70 focus:bg-white transition-all min-w-[150px]">
                <option value="">Tất cả danh mục</option>
                <option value="medicines">Thuốc</option>
                <option value="vitamins">Vitamin</option>
                <option value="equipment">Thiết bị y tế</option>
              </select>

              <button className="px-4 py-3 border border-slate-200 rounded-xl bg-white/70 hover:bg-white transition-all flex items-center gap-2 text-slate-600">
                <Filter className="w-4 h-4" />
                Bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Products Placeholder */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100 p-12 text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            Trang sản phẩm đang được phát triển
          </h3>
          <p className="text-slate-500">
            Chức năng quản lý sản phẩm sẽ được bổ sung trong phiên bản tiếp theo
          </p>
        </div>
      </div>
    </div>
  );
};

export default Products;
