import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { specialtyApi } from "../../../api/specialtyApi";

interface Specialty {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const SpecialtiesPage: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        setLoading(true);
        const data = await specialtyApi.getActiveSpecialties();
        setSpecialties(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching specialties:", err);
        setError("Không thể tải danh sách chuyên khoa. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialties();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chuyên khoa</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      ) : specialties.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">Hiện tại chưa có chuyên khoa nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map((specialty) => (
            <div
              key={specialty._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {specialty.name}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {specialty.description}
                </p>
                <Link
                  to={`/specialties/${specialty._id}`}
                  className="mt-4 inline-block w-full text-center px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors duration-300"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialtiesPage;
