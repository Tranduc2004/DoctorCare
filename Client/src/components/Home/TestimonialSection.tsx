export default function TestimonialSection() {
  const testimonials = [
    {
      name: "Nguyễn Thị M",
      role: "Khách hàng",
      text: "Tôi rất hài lòng với dịch vụ tại MediCare. Các bác sĩ chuyên nghiệp và tận tâm, nhân viên nhiệt tình. Quy trình đặt lịch trực tuyến rất thuận tiện và tiết kiệm thời gian.",
      avatar: "/api/placeholder/80/80",
    },
    {
      name: "Trần Văn N",
      role: "Khách hàng",
      text: "Đây là lần đầu tiên tôi sử dụng dịch vụ đặt lịch khám online và cảm thấy rất tiện lợi. Bác sĩ khám rất kỹ và tư vấn chi tiết. Chắc chắn tôi sẽ quay lại MediCare trong tương lai.",
      avatar: "/api/placeholder/80/80",
    },
    {
      name: "Lê Thị P",
      role: "Khách hàng",
      text: "MediCare đã giúp gia đình tôi theo dõi sức khỏe định kỳ một cách dễ dàng. Đặc biệt ấn tượng với việc tra cứu kết quả khám online và nhận thông báo nhắc lịch tái khám.",
      avatar: "/api/placeholder/80/80",
    },
  ];

  return (
    <section className="py-16 bg-gray-50" id="testimonials">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">
            Khách hàng nói gì về chúng tôi
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Trải nghiệm và đánh giá từ những khách hàng đã sử dụng dịch vụ y tế
            tại MediCare
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
