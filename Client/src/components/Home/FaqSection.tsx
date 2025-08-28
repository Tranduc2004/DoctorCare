import { ChevronRight } from "lucide-react";

export default function FaqSection() {
  const faqs = [
    {
      question: "Làm thế nào để đặt lịch khám trực tuyến?",
      answer:
        "Để đặt lịch khám trực tuyến, bạn chỉ cần đăng nhập vào tài khoản, chọn chuyên khoa, bác sĩ, ngày giờ phù hợp và xác nhận thông tin. Sau đó, bạn sẽ nhận được email xác nhận lịch hẹn.",
    },
    {
      question: "Tôi có thể hủy hoặc thay đổi lịch hẹn không?",
      answer:
        "Có, bạn có thể hủy hoặc thay đổi lịch hẹn ít nhất 24 giờ trước giờ khám đã đặt. Vui lòng đăng nhập vào tài khoản và vào mục Quản lý lịch hẹn để thực hiện.",
    },
    {
      question: "Làm sao để xem kết quả khám online?",
      answer:
        "Sau khi khám bệnh, kết quả sẽ được cập nhật trên hệ thống trong vòng 24-48 giờ. Bạn có thể đăng nhập vào tài khoản và vào mục Kết quả khám bệnh để xem và tải về.",
    },
    {
      question: "MediCare có chấp nhận bảo hiểm y tế không?",
      answer:
        "Có, MediCare có liên kết với nhiều công ty bảo hiểm y tế. Vui lòng mang theo thẻ bảo hiểm khi đến khám và thông báo trước khi đặt lịch khám.",
    },
  ];

  return (
    <section className="py-16 bg-white" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-2">Câu hỏi thường gặp</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Giải đáp những thắc mắc phổ biến về dịch vụ khám chữa bệnh tại
            MediCare
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <details className="group">
                  <summary className="flex justify-between items-center p-4 cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <h3 className="text-lg font-medium">{faq.question}</h3>
                    <span className="transition group-open:rotate-180">
                      <ChevronRight size={20} />
                    </span>
                  </summary>
                  <div className="p-4 border-t border-gray-200">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Bạn có câu hỏi khác?</p>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-400 text-white font-medium rounded-md hover:opacity-90">
            Liên hệ với chúng tôi
          </button>
        </div>
      </div>
    </section>
  );
}
