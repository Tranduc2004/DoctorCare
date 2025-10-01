README.md — Quy trình khám chữa bệnh & xử lý vắng/bận (E2E)

Tài liệu mô tả luồng khám chữa bệnh từ khi bác sĩ bắt đầu khám đến khi kết thúc, cách lưu tiền sử cho lần sau, cùng chính sách khi bác sĩ/bệnh nhân bận hoặc không đến. Bao gồm mô hình dữ liệu, API, guard an toàn, và gợi ý UI/UX.

1. Phạm vi & vai trò

Bệnh nhân (BN): đặt lịch, thanh toán, điền tiền sử (tùy chọn), check-in.

Bác sĩ (BS): bắt đầu khám (tạo hồ sơ), ghi SOAP, chỉ định, kê đơn, kết thúc, ký/khóa.

Hệ thống: quản lý lịch hẹn, trạng thái, thông báo, hoàn/giữ tiền, reschedule, no-show.

2. Thu thập thông tin tối thiểu (để “đặt lịch gọn lẹ”)

Bắt buộc để tạo lịch: Họ tên, SĐT (OTP), dịch vụ/bác sĩ, khung giờ.

Không bắt buộc khi đặt: BHYT, chiều cao/cân nặng, nhóm máu, liên lạc khẩn cấp, tiền sử.

Sau khi đặt (tuỳ chọn): BN điền intake ngắn (triệu chứng, dị ứng, thuốc đang dùng, bệnh nền). BS sẽ xác nhận khi khám.

3. Trạng thái & chuyển trạng thái chính
   Sự kiện Điều kiện appointment.status
   Bắt đầu khám Đã duyệt/đã thanh toán → tạo Encounter in_consult
   Lưu đơn thuốc Có ≥1 thuốc, allergyStatus ≠ "unknown" prescription_issued
   Sẵn sàng kết thúc Có chẩn đoán cuối + tóm tắt ra viện ready_to_discharge
   Hoàn tất Ký/khóa Encounter completed

Trường hợp dời/hủy: doctor_reschedule, cancelled (kèm lý do trong meta.reason).

4. Luồng khám (Doctor Workflow)
5. Preflight

Hiển thị hồ sơ hành chính tối thiểu; pane Tiền sử & Dị ứng.

Nếu dị ứng = unknown → banner nhắc xác nhận trước khi kê đơn.

1. Bắt đầu khám → in_consult

Tạo Encounter; ghi SOAP:

S: lý do khám, triệu chứng.

O: sinh hiệu (mạch/HA/SpO₂/NĐ…), khám lâm sàng, kết quả nhanh.

A: chẩn đoán (ICD-10 nếu có), mức độ nặng.

P: kế hoạch, chỉ định cận lâm sàng.

Tạo Orders (xét nghiệm, CĐHA), đính kèm file.

2. Kê đơn → prescription_issued

Đơn thuốc điện tử (tên, hàm lượng, liều, đường dùng, tần suất, thời gian, SL, ghi chú).

Guard: không cho ký nếu allergyStatus === "unknown"; cảnh báo tương tác.

Tùy chọn gửi qua Pharmacy.

3. Sẵn sàng kết thúc → ready_to_discharge

Chốt chẩn đoán cuối (ICD-10 chính/phụ).

Discharge summary: tóm tắt điều trị, hướng dẫn tại nhà, red flags, lịch tái khám.

Billing hoàn tất.

4. Hoàn tất → completed

Ký số (nếu có) và khóa hồ sơ (read-only).

Gửi BN: đơn thuốc, tóm tắt ra viện, lịch tái khám.

Cập nhật tiền sử dài hạn (PatientHistory) + tạo EncounterSummary để lần sau xem nhanh.

5. Tiền sử khám bệnh (để lần sau xem nhanh)

PatientHistory (dài hạn): dị ứng (Có/Không/Không rõ), danh sách dị ứng/thuốc đang dùng (đã đối chiếu), problem list (ICD-10, active/resolved), dấu lastReviewedAt/By.

EncounterSummary (ảnh chụp 1 lần khám): ngày, bác sĩ, chẩn đoán cuối, vài thuốc chính, kết quả cận lâm sàng nổi bật, hướng dẫn, lịch tái khám.

Lần khám sau: bác sĩ mở overview + timeline 20 lần gần nhất.

6. Khi bác sĩ/BN bận hoặc không đến (busy/no-show)
   SLA & cửa sổ chờ (config mặc định)

Check-in window: ±15′ quanh giờ hẹn.

Nhắc lần 1: +10′ sau giờ hẹn nếu chưa bắt đầu.

Đánh dấu muộn: +20′.

No-show: +30′ chưa vào khám.

Chính sách công bằng (tiền)
Tình huống Hành động Tiền
BN xin đổi ≥24h Dời lịch Giữ tiền
BN xin đổi 4–24h Cho 1 lần miễn phí Giữ tiền
BN xin đổi <4h Tùy BS đồng ý; nếu không → hủy Phí hủy (config)
BN no-show ≥30′ cancelled + meta.reason="patient_no_show" Giữ/khấu trừ (config)
BS no-show ≥30′ cancelled + meta.reason="doctor_no_show" Refund 100% hoặc credit
BS xin dời doctor_reschedule Giữ tiền, có thể tặng voucher
Dời lịch (reschedule) hai chiều

reschedule-propose (gửi 3–5 slot), reschedule-accept, expiresAt.

Worker tự hủy đề xuất quá hạn.

Thanh toán

Thu ngay: hủy/refund theo chính sách.

Hoặc chỉ authorize và capture khi in_consult (nếu cổng thanh toán hỗ trợ).

7. Mô hình dữ liệu (TypeScript)
   type StatusKey =
   | "booked" | "doctor_approved" | "await_payment" | "paid" | "confirmed"
   | "in_consult" | "prescription_issued" | "ready_to_discharge" | "completed"
   | "payment_failed" | "cancelled" | "doctor_reschedule";

type CancelReason =
| "patient_no_show" | "doctor_no_show"
| "patient_busy" | "doctor_busy"
| "patient_cancel" | "doctor_cancel" | "force_majeure";

interface AppointmentMeta {
patientCheckedInAt?: string;
doctorCheckedInAt?: string;
graceUntil?: string;
reschedule?: { proposedBy?: "doctor"|"patient"; proposedSlots?: string[]; expiresAt?: string; accepted?: boolean };
reason?: CancelReason;
refund?: { status: "none"|"pending"|"succeeded"|"failed"; amount: number; paymentId?: string };
}

interface Appointment {
\_id: string;
status: StatusKey;
patientId: string;
doctorId: string;
scheduleId: { date: string; startTime: string; endTime: string };
meta?: AppointmentMeta;
createdAt: string; updatedAt: string;
}

type Provenance = "patient_reported" | "clinician_verified";

interface Encounter {
\_id: string;
appointmentId?: string; // có thể null với walk-in
patientId: string;
doctorId: string;
status: "in_consult" | "ready_to_discharge" | "completed";
startedAt?: string; endedAt?: string; locked?: boolean;
vitals?: { temp?: number; pulse?: number; bp?: string; spo2?: number; weightKg?: number; heightCm?: number };
soap: {
subjective?: string;
objective?: string;
assessment?: Array<{ icd10?: string; text: string; certainty?: "suspected"|"confirmed" }>;
plan?: string;
};
orders?: Array<{ type: "lab"|"imaging"; name: string; status: "ordered"|"in_progress"|"resulted"; resultUrl?: string }>;
discharge?: {
diagnosisFinal: Array<{ icd10?: string; text: string }>;
instructions: string;
redFlags?: string[];
followUp?: { date?: string; note?: string; nextAppointmentId?: string };
};
createdAt: string; updatedAt: string;
signedByDoctor?: { at: string; signatureId?: string };
}

interface Prescription {
\_id: string; encounterId: string; patientId: string; doctorId: string;
items: Array<{ drugName: string; strength?: string; dose: string; route: string; frequency: string; duration: string; quantity: number; notes?: string }>;
allergyChecked: boolean; interactionChecked: boolean;
status: "draft"|"sent"|"dispensed"|"cancelled";
createdAt: string;
}

interface PatientHistory {
patientId: string;
allergiesStatus: "none"|"present"|"unknown";
allergies: Array<{ substance: string; reaction?: string; severity?: "mild"|"moderate"|"severe"; provenance: Provenance; verifiedAt?: string }>;
medications: Array<{ name: string; dose?: string; route?: string; frequency?: string; active: boolean; provenance: Provenance; startDate?: string; stopDate?: string }>;
problems: Array<{ code?: string; text: string; status: "active"|"resolved"; onsetDate?: string; resolvedDate?: string; provenance: Provenance; verifiedAt?: string }>;
lastReviewedAt?: string; lastReviewedBy?: string;
updatedAt: string;
}

interface EncounterSummary {
encounterId: string; appointmentId?: string; doctorId: string; date: string;
diagnosisFinal: Array<{ icd10?: string; text: string }>;
vitals?: { temp?: number; pulse?: number; bp?: string; spo2?: number; weightKg?: number };
keyOrders?: Array<{ type: "lab"|"imaging"; name: string; resultUrl?: string }>;
keyMeds?: Array<{ name: string; dose?: string; frequency?: string; duration?: string }>;
instructions?: string; followUp?: { date?: string; note?: string };
createdAt: string;
}

8. API (REST) tối thiểu
   Lịch hẹn & tình huống bận/no-show
   POST /appointments/:id/checkin { by: "patient"|"doctor" }
   POST /appointments/:id/reschedule-propose { by, proposedSlots[] }
   POST /appointments/:id/reschedule-accept { slotId }
   POST /appointments/:id/cancel { reason: CancelReason }
   POST /payments/:paymentId/refund { amount }

Khám & hồ sơ
POST /appointments/:id/start-consult // tạo Encounter + set in_consult
PATCH /encounters/:id // cập nhật SOAP/vitals/orders/diagnosis
POST /encounters/:id/prescriptions // tạo đơn → set prescription_issued
POST /encounters/:id/discharge // tóm tắt ra viện → set ready_to_discharge
POST /encounters/:id/complete // ký/khóa → set completed + cập nhật PatientHistory

GET /patients/:id/history/overview // dị ứng/thuốc/problem list
GET /patients/:id/encounters?limit=20 // EncounterSummary timeline

Realtime (socket) – khuyến nghị

appointment_booked, payment_completed, patient_checked_in, intake_submitted, lab_result_ready, appointment_rescheduled.

9. Cron/Worker no-show (pseudo)
   for (const appt of await findTodayUnstarted()) {
   const start = toDateTime(appt.scheduleId);
   if (now > addMinutes(start, 30) && ["paid","confirmed"].includes(appt.status)) {
   if (!appt.meta?.patientCheckedInAt && appt.meta?.doctorCheckedInAt) {
   await cancelWithReason(appt, "patient_no_show"); // giữ/khấu trừ
   } else if (appt.meta?.patientCheckedInAt && !appt.meta?.doctorCheckedInAt) {
   await cancelWithReason(appt, "doctor_no_show"); // refund 100%
   await createRefund(appt);
   }
   }
   }

10. Guard FE/UX (tóm tắt)

Kê đơn: ch

Bạn đã nói:
tôi đã hoàn thành bước đặt lịch và thanh toán rồi giờ tới phần bắt đầu khám,... hãy viết lại toàn bộ bước còn lại bao gồm việc bận do bác sĩ hoặc người bệnh
ChatGPT đã nói:
Đã suy nghĩ trong 14s
README — Từ Bắt đầu khám → Kết thúc khám (kèm xử lý bác sĩ/BN bận)

Bạn đã xong bước đặt lịch & thanh toán. Tài liệu này hướng dẫn toàn bộ phần còn lại: bắt đầu khám, kê đơn, kết thúc, lưu tiền sử; đồng thời xử lý các tình huống bác sĩ/bệnh nhân bận, đến trễ, không đến (reschedule/no-show/refund).

1. Trạng thái & chuyển trạng thái (sau thanh toán)
   Sự kiện Điều kiện appointment.status cập nhật
   Bác sĩ bắt đầu khám Hẹn hợp lệ → tạo Encounter in_consult
   Lưu đơn thuốc Có ≥1 thuốc, allergyStatus ≠ "unknown" prescription_issued
   Sẵn sàng kết thúc Có chẩn đoán cuối (ICD-10) + tóm tắt ra viện ready_to_discharge
   Hoàn tất Ký/khóa Encounter completed
   Xin đổi giờ Hai bên đồng ý slot mới giữ confirmed
   Đến trễ/không đến Hết “grace” theo SLA cancelled + meta.reason
2. Bắt đầu khám (Start consult)

Nút: Bắt đầu khám / Tiếp nhận trên thẻ lịch hẹn.

Tạo Encounter (hồ sơ cho lần khám này) → set in_consult.

Rà soát nhanh “Tiền sử & Dị ứng” (bắt buộc xác nhận dị ứng trước khi kê đơn):

Dị ứng: none / present / unknown → nếu unknown chặn kê đơn.

Thuốc đang dùng: đối chiếu (reconcile).

Ghi SOAP

S: lý do khám, triệu chứng chính.

O: sinh hiệu (mạch/HA/SpO₂/NĐ/chiều cao/cân nặng), khám lâm sàng, kết quả nhanh.

A: chẩn đoán tạm/khẳng định (ICD-10 nếu có).

P: xử trí, chỉ định cận lâm sàng (xét nghiệm/CĐHA).

Tạo Orders (phiếu chỉ định) + đính kèm kết quả/ảnh (nếu có).

UI: banner cảnh báo nếu dị ứng = unknown; tab: SOAP | Chỉ định | Đơn thuốc | Đính kèm | Hóa đơn.

3. Kê đơn thuốc (eRx)

Mở form Đơn thuốc từ Encounter.

Nhập: tên thuốc, hàm lượng, liều, đường dùng, tần suất, thời gian, số lượng, ghi chú.

Kiểm tra bắt buộc:

allergyStatus !== "unknown" (guard).

Cảnh báo tương tác với thuốc đang dùng / dị ứng.

Lưu đơn → set appointment.status = prescription_issued.

(Tuỳ chọn) Gửi sang Pharmacy để chuẩn bị.

4. Sẵn sàng kết thúc (Ready to discharge)

Chốt chẩn đoán cuối (ICD-10 chính/phụ).

Tạo Discharge summary:

Tóm tắt điều trị đã làm, hướng dẫn tại nhà, red flags.

Tái khám: tạo lịch hẹn mới (nếu cần).

Hoàn thiện Billing (dịch vụ phát sinh, phụ phí).

Cập nhật ready_to_discharge.

5. Hoàn tất & lưu tiền sử (Complete)

Ký số (nếu có) và khóa Encounter (read-only, audit).

Gửi cho BN: đơn thuốc, tóm tắt ra viện, lịch tái khám.

Cập nhật tiền sử dài hạn (PatientHistory)

Dị ứng (trạng thái + danh sách), thuốc đang dùng (active), problem list (ICD-10: active/resolved), lastReviewedAt/By.

Tạo EncounterSummary (ảnh chụp ngắn cho timeline): ngày, chẩn đoán, vài thuốc chính, kết quả nổi bật, hướng dẫn.

Set appointment.status = completed.

6. Khi bác sĩ/BN bận, đến trễ, không đến
   SLA (cấu hình mặc định)

Grace check-in: ±15′ quanh giờ hẹn.

Nhắc lần 1: +10′ sau giờ nếu chưa vào khám (notif cho cả hai).

Đánh dấu muộn: +20′.

No-show: +30′ chưa vào khám.

Nút nhỏ cần có

BN: “Tôi đã đến” → ghi meta.patientCheckedInAt.

BS: “Sẵn sàng khám” → ghi meta.doctorCheckedInAt.

Xin đổi giờ (hai chiều): đề xuất 3–5 slot mới.

Chính sách & tiền
Tình huống Hành động Tài chính
BN xin đổi ≥24h Dời slot Giữ tiền
BN xin đổi 4–24h 1 lần miễn phí Giữ tiền
BN xin đổi <4h Tùy BS; nếu hủy Phí hủy (config)
BN no-show ≥30′ cancelled, meta.reason="patient_no_show" Giữ/khấu trừ (config)
BS no-show ≥30′ cancelled, meta.reason="doctor_no_show" Refund 100% / credit
BS xin dời doctor_reschedule Giữ tiền, (tuỳ chọn) tặng voucher

Khuyến nghị: nếu hai bên chấp nhận dời trong 7 ngày, ưu tiên giữ tiền & reschedule.

Tự động xét no-show

Worker mỗi 1–2′: nếu quá start + 30′ và status ∈ ["paid","confirmed"]:

Có doctorCheckedInAt nhưng không patientCheckedInAt → patient_no_show.

Có patientCheckedInAt nhưng không doctorCheckedInAt → doctor_no_show (+ tạo refund).

7. Endpoints tối thiểu
   Khám
   POST /appointments/:id/start-consult // tạo Encounter → in_consult
   PATCH /encounters/:id // cập nhật SOAP/vitals/orders/diagnosis
   POST /encounters/:id/prescriptions // tạo đơn → prescription_issued
   POST /encounters/:id/discharge // tóm tắt → ready_to_discharge
   POST /encounters/:id/complete // khóa + cập nhật tiền sử → completed

Bận / đến trễ / đổi giờ / hoàn tiền
POST /appointments/:id/checkin { by: "patient"|"doctor" }
POST /appointments/:id/reschedule-propose { by, proposedSlots[] }
POST /appointments/:id/reschedule-accept { slotId }
POST /appointments/:id/cancel { reason: "patient_no_show"|"doctor_no_show"|... }
POST /payments/:paymentId/refund { amount }

8. Guard & UX (tóm tắt)

Không cho ký đơn khi allergyStatus === "unknown".

Today queue trên dashboard bác sĩ hiển thị CTA theo ngữ cảnh (Bắt đầu khám / Tiếp tục đơn / Sẵn sàng kết thúc / Hoàn tất).

Notif realtime cho: thanh toán xong, BN check-in, BS check-in, intake mới, kết quả xét nghiệm, reschedule.

Trên thẻ hẹn hiển thị đếm ngược, grace, nút Tôi đã đến / Sẵn sàng khám / Xin đổi giờ.

9. Pseudo-code mẫu (rút gọn)
   // 1) Bắt đầu khám
   async function startConsult(apptId, doctorId) {
   assert(await isPaidOrConfirmed(apptId));
   const enc = await createEncounter({ apptId, doctorId, status: "in_consult" });
   await setApptStatus(apptId, "in_consult");
   return enc.\_id;
   }

// 2) Kê đơn (guard dị ứng)
async function createPrescription(encId, payload) {
const hist = await getHistoryByEncounter(encId);
if (hist.allergiesStatus === "unknown") throw new Error("Confirm allergies first");
const rxId = await savePrescription(encId, payload);
await setApptStatusByEncounter(encId, "prescription_issued");
return rxId;
}

// 3) Sẵn sàng kết thúc
async function discharge(encId, summary) {
await saveDischarge(encId, summary); // diagnosisFinal + instructions + followUp
await setApptStatusByEncounter(encId, "ready_to_discharge");
}

// 4) Hoàn tất & cập nhật tiền sử
async function complete(encId, doctorId) {
const enc = await lockEncounter(encId);
await setApptStatus(enc.appointmentId, "completed");
await upsertPatientHistoryFrom(enc); // allergies/medications/problems
await writeEncounterSummary(enc); // for timeline
await notifyPatient(enc.patientId, "visit_completed");
}

// 5) Check-in & no-show
async function checkin(apptId, by) {
await setMeta(apptId, by === "patient" ? { patientCheckedInAt: now() } : { doctorCheckedInAt: now() });
}

async function cronNoShow() {
for (const appt of await findLatePaidAppointments()) {
if (!appt.meta?.patientCheckedInAt && appt.meta?.doctorCheckedInAt) {
await cancel(appt.\_id, "patient_no_show");
} else if (appt.meta?.patientCheckedInAt && !appt.meta?.doctorCheckedInAt) {
await cancel(appt.\_id, "doctor_no_show");
await refund(appt.paymentId, appt.amount);
}
}
}

10. Checklist triển khai

Nút Bắt đầu khám → tạo Encounter, in_consult.

Tab SOAP / Chỉ định / Đơn thuốc / Đính kèm / Hóa đơn.

Guard dị ứng ≠ unknown khi kê đơn.

Discharge summary + follow-up → ready_to_discharge.

Complete → khóa Encounter + cập nhật PatientHistory & EncounterSummary.

Nút Tôi đã đến / Sẵn sàng khám / Xin đổi giờ + notif.

Worker no-show + chính sách refund/credit.

Dashboard: Today queue + CTA theo ngữ cảnh.
