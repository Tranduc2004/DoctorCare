import { Router } from "express";
import Message from "../../../shared/models/message";
import Appointment from "../../patient/models/Appointment";
import Patient from "../../patient/models/Patient";

const router = Router();

// Gửi tin nhắn (bác sĩ hoặc bệnh nhân)
router.post("/send", async (req, res) => {
  try {
    let { appointmentId, doctorId, patientId, senderRole, content } =
      req.body as {
        appointmentId?: string;
        doctorId: string;
        patientId: string;
        senderRole: "doctor" | "patient";
        content: string;
      };

    if (!doctorId || !patientId || !senderRole || !content) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    // Nếu thiếu appointmentId: lấy lịch hẹn gần nhất giữa bác sĩ và bệnh nhân
    if (!appointmentId) {
      const latestAppointment = await Appointment.findOne({
        doctorId,
        patientId,
      })
        .sort({ createdAt: -1 })
        .select("_id")
        .lean();
      if (!latestAppointment) {
        return res.status(400).json({
          message: "Không tìm thấy lịch hẹn giữa bác sĩ và bệnh nhân",
        });
      }
      appointmentId = String(latestAppointment._id);
    }

    const doc = await Message.create({
      appointmentId,
      doctorId,
      patientId,
      senderRole,
      content,
      isReadByDoctor: senderRole === "doctor",
      isReadByPatient: senderRole === "patient",
    });

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: "Lỗi gửi tin nhắn", error: e });
  }
});

// Danh sách tin nhắn theo cặp doctor-patient (tuỳ chọn lọc theo appointment)
router.get("/thread", async (req, res) => {
  try {
    const { doctorId, patientId, appointmentId } = req.query as {
      doctorId?: string;
      patientId?: string;
      appointmentId?: string;
    };

    if (!doctorId || !patientId) {
      return res.status(400).json({ message: "Thiếu doctorId hoặc patientId" });
    }

    const query: any = { doctorId, patientId };
    if (appointmentId) query.appointmentId = appointmentId;

    const list = await Message.find(query).sort({ createdAt: 1 }).lean();
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: "Lỗi lấy tin nhắn", error: e });
  }
});

// Đánh dấu đã đọc
router.post("/mark-read", async (req, res) => {
  try {
    const { doctorId, patientId, role } = req.body as {
      doctorId: string;
      patientId: string;
      role: "doctor" | "patient";
    };

    if (!doctorId || !patientId || !role) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    const update: any = {};
    if (role === "doctor") update.isReadByDoctor = true;
    if (role === "patient") update.isReadByPatient = true;

    await Message.updateMany({ doctorId, patientId }, { $set: update });
    return res.json({ success: true });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Lỗi cập nhật trạng thái đọc", error: e });
  }
});

// Đếm tin chưa đọc cho role
router.get("/unread-count", async (req, res) => {
  try {
    const { doctorId, patientId, role } = req.query as {
      doctorId?: string;
      patientId?: string;
      role?: "doctor" | "patient";
    };

    if (role === "doctor") {
      if (!doctorId) return res.status(400).json({ message: "Thiếu doctorId" });
      const count = await Message.countDocuments({
        doctorId,
        isReadByDoctor: false,
        senderRole: "patient",
      });
      return res.json({ count });
    }
    if (role === "patient") {
      if (!patientId)
        return res.status(400).json({ message: "Thiếu patientId" });
      const count = await Message.countDocuments({
        patientId,
        isReadByPatient: false,
        senderRole: "doctor",
      });
      return res.json({ count });
    }
    return res.status(400).json({ message: "Thiếu role" });
  } catch (e) {
    return res.status(500).json({ message: "Lỗi đếm tin chưa đọc", error: e });
  }
});

// Lấy bác sĩ gần nhất có nhắn cho bệnh nhân (dựa theo thời gian mới nhất)
router.get("/latest-doctor", async (req, res) => {
  try {
    const { patientId } = req.query as { patientId?: string };
    if (!patientId) return res.status(400).json({ message: "Thiếu patientId" });

    const latest = await Message.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    if (!latest.length) return res.json({ doctorId: null });
    return res.json({ doctorId: String(latest[0].doctorId) });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Lỗi lấy bác sĩ gần nhất", error: e });
  }
});

// Danh sách hội thoại của bác sĩ dựa trên các lịch hẹn với bệnh nhân
router.get("/doctor-threads", async (req, res) => {
  try {
    const { doctorId } = req.query as { doctorId?: string };
    if (!doctorId) return res.status(400).json({ message: "Thiếu doctorId" });

    // Lấy danh sách patient từ Message (những thread đã có tin nhắn)
    const messagePatientIds = await Message.distinct("patientId", { doctorId });

    // Bổ sung danh sách patient từ Appointment (đã đặt lịch với bác sĩ)
    const appointments = await Appointment.find({ doctorId })
      .select("patientId")
      .lean();
    const appointmentPatientIds = appointments.map((a: any) =>
      String(a.patientId)
    );

    const uniquePatientIds: string[] = Array.from(
      new Set<string>([
        ...messagePatientIds.map((id: any) => String(id)),
        ...appointmentPatientIds,
      ])
    );

    const threads = await Promise.all(
      uniquePatientIds.map(async (pid) => {
        const [patient, lastMessage, unreadCount] = await Promise.all([
          Patient.findById(pid).select("name email phone avatar").lean(),
          Message.findOne({ doctorId, patientId: pid })
            .sort({ createdAt: -1 })
            .lean(),
          Message.countDocuments({
            doctorId,
            patientId: pid,
            senderRole: "patient",
            isReadByDoctor: false,
          }),
        ]);

        return {
          patientId: pid,
          patient,
          lastMessage,
          lastMessageAt: lastMessage?.createdAt || null,
          unreadCount,
        };
      })
    );

    threads.sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });

    return res.json(threads);
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Lỗi lấy danh sách hội thoại", error: e });
  }
});

export default router;
