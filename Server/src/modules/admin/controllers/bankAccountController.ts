import { Request, Response } from "express";
import BankAccount from "../../shared/models/BankAccount";

export const listBankAccounts = async (req: Request, res: Response) => {
  try {
    const items = await BankAccount.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Lỗi lấy danh sách tài khoản", error: err });
  }
};

export const createBankAccount = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const item = await BankAccount.create(payload);
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tạo tài khoản", error: err });
  }
};

export const updateBankAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = await BankAccount.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!item)
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Lỗi cập nhật tài khoản", error: err });
  }
};

export const deleteBankAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await BankAccount.findByIdAndDelete(id);
    res.json({ message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa tài khoản", error: err });
  }
};
