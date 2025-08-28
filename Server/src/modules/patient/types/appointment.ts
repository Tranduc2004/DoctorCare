export type AppointmentStatus = "pending" | "confirmed" | "examining" | "prescribing" | "done" | "cancelled";

export interface AppointmentUpdateData {
  status?: AppointmentStatus;
  symptoms?: string;
  note?: string;
}

export interface AppointmentQuery {
  patientId?: string;
  doctorId?: string;
  scheduleId?: string;
  status?: AppointmentStatus;
  date?: string;
}

// Interface cho appointment với populate
export interface AppointmentWithPopulate {
  _id: string;
  patientId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
    workplace: string;
  };
  scheduleId: {
    _id: string;
    date: string;
    startTime: string;
    endTime: string;
    isBooked: boolean;
  };
  status: AppointmentStatus;
  symptoms?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}
