import AppointmentSection from "../../../components/Home/AppointmentSection";

export default function AppointmentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-grow">
        <AppointmentSection />
      </main>
    </div>
  );
}
