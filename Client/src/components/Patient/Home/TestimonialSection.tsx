import { Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export default function TestimonialSection() {
  const reviews = [
    {
      id: 1,
      name: "Nguyễn Thị Hoa",
      date: "15/11/2024",
      text: "Dịch vụ y tế tuyệt vời! Các bác sĩ rất tận tâm và chuyên nghiệp. Tôi đã được khám và điều trị rất hiệu quả. Hệ thống đặt lịch online cũng rất tiện lợi.",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b5e5?q=80&w=256&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: 2,
      name: "Trần Văn Minh",
      date: "22/10/2024",
      text: "Cảm ơn đội ngũ y bác sĩ đã chăm sóc tôi rất chu đáo. Phòng khám sạch sẽ, hiện đại và quy trình khám bệnh rất nhanh chóng.",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: 3,
      name: "Lê Thị Mai",
      date: "08/10/2024",
      text: "Tôi rất hài lòng với dịch vụ tại đây. Bác sĩ tư vấn rất kỹ lưỡng và giải đáp mọi thắc mắc của tôi. Sẽ quay lại lần sau.",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=256&auto=format&fit=crop",
      rating: 4,
    },
    {
      id: 4,
      name: "Phạm Đức An",
      date: "30/09/2024",
      text: "Hệ thống đặt lịch khám rất thuận tiện, không phải chờ đợi lâu. Nhân viên thân thiện và hỗ trợ rất tốt.",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: 5,
      name: "Hoàng Thị Lan",
      date: "25/09/2024",
      text: "Dịch vụ chất lượng cao với giá cả hợp lý. Tôi đã giới thiệu cho nhiều người bạn và họ đều rất hài lòng.",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
      rating: 5,
    },
    {
      id: 6,
      name: "Vũ Công Thành",
      date: "18/09/2024",
      text: "Cơ sở vật chất hiện đại, trang thiết bị y tế tiên tiến. Quy trình khám bệnh khoa học và hiệu quả.",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=256&auto=format&fit=crop",
      rating: 4,
    },
  ];

  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto slide testimonials
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentReviewIndex((prev: number) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [reviews.length, isPaused]);

  const currentReview = reviews[currentReviewIndex];

  // nhóm avatar mẫu (có thể thay bằng dữ liệu thật)
  const faces = [
    "https://api.dicebear.com/7.x/thumbs/svg?seed=a",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=b",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=c",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=d",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=e",
    "https://api.dicebear.com/7.x/thumbs/svg?seed=f",
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.3,
      },
    },
  };

  const slideInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const slideInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const avatarVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={containerVariants}
      className="bg-[#E8F7F5] py-30"
      id="testimonials"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        {/* Left copy */}
        <motion.div variants={slideInLeft}>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight text-slate-900"
          >
            What{" "}
            <span className="bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent">
              Our Member’s
            </span>
            <br />
            Saying About Us
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 max-w-xl text-slate-600"
          >
            Hàng nghìn bệnh nhân đã tin tưởng và lựa chọn dịch vụ y tế của chúng
            tôi. Sự hài lòng của bạn là động lực để chúng tôi không ngừng cải
            thiện chất lượng dịch vụ.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 flex items-center gap-6"
          >
            <motion.div
              variants={containerVariants}
              className="-space-x-3 flex"
            >
              {faces.map((src, i) => (
                <motion.img
                  key={i}
                  variants={avatarVariants}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                  src={src}
                  alt={`avatar ${i + 1}`}
                  className="h-10 w-10 rounded-full ring-2 ring-[#E8F7F5]"
                />
              ))}
            </motion.div>
            <div className="text-slate-700 font-semibold">
              1000+ Đánh giá tích cực
            </div>
          </motion.div>
        </motion.div>

        {/* Right card with animated testimonials */}
        <motion.div
          variants={slideInRight}
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.article
              key={currentReview.id}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{
                duration: 0.6,
                ease: "easeInOut",
              }}
              whileHover={{
                y: -5,
                scale: 1.02,
                transition: { duration: 0.2 },
              }}
              className="rounded-3xl bg-white p-8 md:p-10 ring-1 ring-slate-200 shadow-sm"
            >
              {/* header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.img
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    src={currentReview.avatar}
                    alt={currentReview.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="font-semibold text-slate-900"
                    >
                      {currentReview.name}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                      className="text-xs text-slate-500"
                    >
                      {currentReview.date}
                    </motion.div>
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <Stars value={currentReview.rating} />
                </motion.div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="mt-6 leading-7 text-slate-700"
              >
                {currentReview.text}
              </motion.p>
            </motion.article>
          </AnimatePresence>

          {/* Dots indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="flex justify-center gap-2 mt-6"
          >
            {reviews.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentReviewIndex(index)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === currentReviewIndex
                    ? "bg-teal-500 w-8"
                    : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}

/** Sao vàng giống thiết kế với animation */
function Stars({ value = 5 }: { value?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            duration: 0.3,
            delay: i * 0.1,
            type: "spring",
            stiffness: 200,
          }}
          whileHover={{
            scale: 1.2,
            transition: { duration: 0.2 },
          }}
        >
          <Star
            className={`h-5 w-5 transition-colors duration-200 ${
              i < value ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}
