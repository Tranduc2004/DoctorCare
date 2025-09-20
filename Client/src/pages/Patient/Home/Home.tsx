import HeroBanner from "../../../components/Home/HeroBanner";
import ServiceSection from "../../../components/Home/ServiceSection";
import DoctorSection from "../../../components/Home/DoctorSection";
import AppointmentSection from "../../../components/Home/AppointmentSection";
import TestimonialSection from "../../../components/Home/TestimonialSection";
import FaqSection from "../../../components/Home/FaqSection";
import FloatingChatWidget from "../../../components/Home/FloatingChatWidget";

// Component chính cho trang chủ
export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <HeroBanner />
        <ServiceSection />
        <DoctorSection />
        <AppointmentSection />
        <TestimonialSection />
        <FaqSection />
        {/* Gợi ý: thêm đường dẫn hồ sơ/BHYT tại đây hoặc trong Header */}
        <FloatingChatWidget />
      </main>
    </div>
  );
}
