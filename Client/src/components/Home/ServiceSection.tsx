import { CheckCircle, User, Calendar, BellRing } from "lucide-react";

export default function ServiceSection() {
  const services = [
    {
      icon: <CheckCircle size={40} className="text-teal-500" />,
      title: "Đặt lịch khám trực tuyến",
      description: "Đặt lịch khám bệnh trực tuyến dễ dàng, tiết kiệm thời gian",
    },
    {
      icon: <User size={40} className="text-teal-500" />,
      title: "Bác sĩ chuyên khoa",
      description: "Đội ngũ y bác sĩ giàu kinh nghiệm, chuyên môn cao",
    },
    {
      icon: <Calendar size={40} className="text-teal-500" />,
      title: "Xem kết quả khám online",
      description: "Tra cứu kết quả khám bệnh online nhanh chóng, bảo mật",
    },
    {
      icon: <BellRing size={40} className="text-teal-500" />,
      title: "Nhận thông báo nhắc lịch hẹn",
      description: "Nhận thông báo nhắc nhở lịch hẹn qua email hoặc SMS",
    },
  ];

  return (
    <section className="py-16 bg-gray-50" id="services">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Dịch vụ của chúng tôi</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            MediCare cung cấp các dịch vụ y tế chất lượng cao, đáp ứng nhu cầu
            chăm sóc sức khỏe toàn diện
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
