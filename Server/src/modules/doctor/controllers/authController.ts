import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor";

export const doctorRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialty,
      experience,
      workplace,
      description,
      education,
      certifications,
      languages,
      consultationFee,
    } = req.body;

    if (!name || !email || !password || !specialty) {
      res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      res.status(400).json({
        success: false,
        message: "Email đã tồn tại",
      });
      return;
    }

    const doctor = new Doctor({
      name,
      email,
      password,
      phone,
      specialty,
      experience: experience ? parseInt(experience) : undefined,
      workplace,
      description,
      education: education ? education.split(",") : [],
      certifications: certifications ? certifications.split(",") : [],
      languages: languages ? languages.split(",") : [],
      consultationFee: consultationFee
        ? parseFloat(consultationFee)
        : undefined,
      license: req.file?.path,
      status: "pending",
    });

    await doctor.save();

    // Return user data after successful registration
    const doctorData = {
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      experience: doctor.experience,
      workplace: doctor.workplace,
      description: doctor.description,
      education: doctor.education,
      certifications: doctor.certifications,
      languages: doctor.languages,
      consultationFee: doctor.consultationFee,
      role: "doctor",
    };

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: doctorData,
    });
  } catch (error) {
    console.error("Doctor registration error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const doctorLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email và password là bắt buộc",
      });
      return;
    }

    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
      return;
    }

    const isPasswordValid = await doctor.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
      return;
    }

    if (doctor.status !== "approved") {
      res
        .status(403)
        .json({ success: false, message: "Tài khoản chưa được admin duyệt" });
      return;
    }

    const token = jwt.sign(
      {
        doctorId: doctor._id,
        email: doctor.email,
        role: "doctor",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    const doctorData = {
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      experience: doctor.experience,
      workplace: doctor.workplace,
      description: doctor.description,
      education: doctor.education,
      certifications: doctor.certifications,
      languages: doctor.languages,
      consultationFee: doctor.consultationFee,
      role: "doctor", // Thêm role vào response
    };

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      user: doctorData,
      token,
    });
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getDoctorProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const doctorId = (req as any).doctorId;

    const doctor = await Doctor.findById(doctorId).select("-password");
    if (!doctor) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bác sĩ",
      });
      return;
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get doctor profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
