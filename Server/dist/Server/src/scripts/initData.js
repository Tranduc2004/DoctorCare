"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Service_1 = __importDefault(require("../modules/admin/models/Service"));
const Specialty_1 = __importDefault(require("../modules/admin/models/Specialty"));
dotenv_1.default.config();
const initData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Kết nối MongoDB
        yield mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("Kết nối MongoDB thành công!");
        // Khởi tạo chuyên khoa mẫu
        const specialties = [
            {
                name: "Tim mạch",
                description: "Chuyên khoa về các bệnh lý tim mạch, huyết áp, suy tim...",
            },
            {
                name: "Nội tổng quát",
                description: "Chuyên khoa nội tổng quát, khám và điều trị các bệnh nội khoa",
            },
            {
                name: "Ngoại tổng quát",
                description: "Chuyên khoa ngoại tổng quát, phẫu thuật các bệnh ngoại khoa",
            },
            {
                name: "Nhi khoa",
                description: "Chuyên khoa nhi, khám và điều trị bệnh cho trẻ em",
            },
            {
                name: "Sản phụ khoa",
                description: "Chuyên khoa sản phụ khoa, chăm sóc sức khỏe phụ nữ và thai sản",
            },
            {
                name: "Da liễu",
                description: "Chuyên khoa da liễu, điều trị các bệnh về da, tóc, móng",
            },
            {
                name: "Mắt",
                description: "Chuyên khoa mắt, khám và điều trị các bệnh về mắt",
            },
            {
                name: "Tai mũi họng",
                description: "Chuyên khoa tai mũi họng, điều trị các bệnh về tai, mũi, họng",
            },
            {
                name: "Răng hàm mặt",
                description: "Chuyên khoa răng hàm mặt, nha khoa và phẫu thuật hàm mặt",
            },
            {
                name: "Xương khớp",
                description: "Chuyên khoa xương khớp, điều trị các bệnh về cơ xương khớp",
            },
            {
                name: "Thần kinh",
                description: "Chuyên khoa thần kinh, điều trị các bệnh về hệ thần kinh",
            },
            {
                name: "Tâm thần",
                description: "Chuyên khoa tâm thần, điều trị các rối loạn tâm thần",
            },
            {
                name: "Ung bướu",
                description: "Chuyên khoa ung bướu, điều trị các bệnh ung thư",
            },
            {
                name: "Y học cổ truyền",
                description: "Chuyên khoa y học cổ truyền, điều trị bằng thuốc nam, châm cứu",
            },
        ];
        // Xóa dữ liệu cũ nếu có
        yield Specialty_1.default.deleteMany({});
        console.log("Đã xóa dữ liệu chuyên khoa cũ");
        // Thêm chuyên khoa mới
        const createdSpecialties = yield Specialty_1.default.insertMany(specialties);
        console.log(`Đã tạo ${createdSpecialties.length} chuyên khoa mẫu`);
        // Khởi tạo dịch vụ mẫu
        const services = [
            {
                name: "Khám tổng quát",
                description: "Khám sức khỏe tổng quát, kiểm tra các chỉ số cơ bản",
                price: 200000,
                duration: 30,
            },
            {
                name: "Khám chuyên khoa",
                description: "Khám chuyên khoa với bác sĩ chuyên môn",
                price: 300000,
                duration: 45,
            },
            {
                name: "Khám sức khỏe định kỳ",
                description: "Gói khám sức khỏe định kỳ toàn diện",
                price: 500000,
                duration: 60,
            },
            {
                name: "Tư vấn dinh dưỡng",
                description: "Tư vấn chế độ dinh dưỡng phù hợp",
                price: 150000,
                duration: 30,
            },
            {
                name: "Tư vấn tâm lý",
                description: "Tư vấn tâm lý, hỗ trợ tinh thần",
                price: 250000,
                duration: 45,
            },
        ];
        // Xóa dữ liệu cũ nếu có
        yield Service_1.default.deleteMany({});
        console.log("Đã xóa dữ liệu dịch vụ cũ");
        // Thêm dịch vụ mới
        const createdServices = yield Service_1.default.insertMany(services);
        console.log(`Đã tạo ${createdServices.length} dịch vụ mẫu`);
        console.log("Khởi tạo dữ liệu mẫu thành công!");
        process.exit(0);
    }
    catch (error) {
        console.error("Lỗi khi khởi tạo dữ liệu:", error);
        process.exit(1);
    }
});
initData();
