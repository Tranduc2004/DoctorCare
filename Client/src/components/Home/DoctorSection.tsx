import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getDoctors } from "../../api/doctorsApi";
import { specialtyApi } from "../../api/specialtyApi";
import { Link } from "react-router-dom";

export default function DoctorSection() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [specialties, setSpecialties] = useState<
    { _id: string; name: string }[]
  >([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const list = await getDoctors();
        setDoctors(Array.isArray(list) ? list.slice(0, 4) : []);
      } catch {
        setError("Không tải được danh sách bác sĩ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    specialtyApi
      .getActiveSpecialties()
      .then((data) => setSpecialties(data || []))
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 bg-white" id="doctors">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Đội ngũ bác sĩ</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Các bác sĩ của MediCare đều có chuyên môn cao và nhiều năm kinh
            nghiệm trong lĩnh vực y tế
          </p>
        </div>

        {loading && (
          <div className="text-center text-gray-600">Đang tải...</div>
        )}
        {error && <div className="text-center text-red-600 mb-4">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((d) => (
            <Link
              to={`/doctors/${d._id}`}
              key={d._id}
              className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {d.avatar ? (
                <img
                  src={d.avatar}
                  alt={d.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1">BS. {d.name}</h3>
                <p className="text-teal-500 mb-3">
                  {specialties.find((s) => s._id === d.specialty)?.name || ""}
                </p>
                <div className="text-blue-500 flex items-center hover:text-blue-700">
                  <span>Xem chi tiết</span>
                  <ChevronRight size={16} className="ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/doctors"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-medium rounded-md hover:opacity-90"
          >
            Xem tất cả bác sĩ
          </Link>
        </div>
      </div>
    </section>
  );
}
