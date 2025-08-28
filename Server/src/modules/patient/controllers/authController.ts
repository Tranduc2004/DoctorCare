import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Patient from "../models/Patient";

export const patientRegister = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, phone, dateOfBirth, gender, address } =
      req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      res.status(400).json({
        success: false,
        message: "Email đã tồn tại",
      });
      return;
    }

    const patient = new Patient({
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
    });

    await patient.save();

    // Return user data after successful registration
    const patientData = {
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      role: "patient",
    };

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: patientData,
    });
  } catch (error) {
    console.error("Patient registration error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const patientLogin = async (
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

    const patient = await Patient.findOne({ email });
    if (!patient) {
      res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
      return;
    }

    const isPasswordValid = await patient.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
      return;
    }

    const token = jwt.sign(
      {
        patientId: patient._id,
        email: patient.email,
        role: "patient",
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    const patientData = {
      _id: patient._id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      role: "patient", // Thêm role vào response
    };

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      user: patientData,
      token,
    });
  } catch (error) {
    console.error("Patient login error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

export const getPatientProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const patientId = (req as any).patientId;

    const patient = await Patient.findById(patientId).select("-password");
    if (!patient) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy bệnh nhân",
      });
      return;
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error("Get patient profile error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};
