// Admin types - tương tự với Server
export interface Admin {
  _id: string;
  username: string;
  email: string;
  role: "admin";
  createdAt: string;
  updatedAt: string;
}
