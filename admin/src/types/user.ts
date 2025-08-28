export type UserRole = "patient" | "doctor" | "admin";

export interface User {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
