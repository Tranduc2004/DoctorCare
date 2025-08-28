import { ChevronRight } from "lucide-react";

export default function DoctorSection() {
  const doctors = [
    {
      name: "Bs. Nguyễn Văn A",
      specialty: "Nội Tổng Quát",
      image: "/api/placeholder/300/300",
    },
    {
      name: "Bs. Trần Thị B",
      specialty: "Tim Mạch",
      image: "/api/placeholder/300/300",
    },
    {
      name: "Bs. Lê Văn C",
      specialty: "Nhi Khoa",
      image: "/api/placeholder/300/300",
    },
    {
      name: "Bs. Phạm Thị D",
      specialty: "Da Liễu",
      image: "/api/placeholder/300/300",
    },
  ];

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doctor, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={doctor.image}
                alt={doctor.name}
                className="w-full h-64 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-1">{doctor.name}</h3>
                <p className="text-teal-500 mb-3">{doctor.specialty}</p>
                <button className="text-blue-500 flex items-center hover:text-blue-700">
                  <span>Xem chi tiết</span>
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-medium rounded-md hover:opacity-90">
            Xem tất cả bác sĩ
          </button>
        </div>
      </div>
    </section>
  );
}
