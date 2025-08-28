export default function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-r from-blue-500 to-teal-400 text-white">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Chăm sóc sức khỏe hiện đại
            </h2>
            <p className="text-lg md:text-xl mb-6">
              Dịch vụ y tế tiên tiến, đội ngũ bác sĩ chuyên nghiệp và không gian
              thân thiện.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md hover:bg-gray-100">
                Đặt lịch ngay
              </button>
              <button className="px-6 py-3 border border-white text-white font-medium rounded-md hover:bg-white hover:text-blue-600 hover:bg-opacity-10">
                Tìm hiểu thêm
              </button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <img
                src="/api/placeholder/600/400"
                alt="Healthcare professionals"
                className="w-full h-64 object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 120"
          className="w-full"
        >
          <path
            fill="#f9fafb"
            fillOpacity="1"
            d="M0,96L80,80C160,64,320,32,480,32C640,32,800,64,960,64C1120,64,1280,32,1360,16L1440,0L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
          ></path>
        </svg>
      </div>
    </section>
  );
}
