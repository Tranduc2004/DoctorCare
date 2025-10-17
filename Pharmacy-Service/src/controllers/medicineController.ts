import { Request, Response } from "express";
import Medicine from "../models/Medicine";

// Get all medicines
export const getAllMedicines = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicines = await Medicine.find();
    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicines", error });
  }
};

// Get medicine by ID
export const getMedicineById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      res.status(404).json({ message: "Medicine not found" });
      return;
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: "Error fetching medicine", error });
  }
};

// Create new medicine
export const createMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicine = await Medicine.create(req.body);
    res.status(201).json(medicine);
  } catch (error) {
    res.status(500).json({ message: "Error creating medicine", error });
  }
};

// Update medicine
export const updateMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!medicine) {
      res.status(404).json({ message: "Medicine not found" });
      return;
    }
    res.json(medicine);
  } catch (error) {
    res.status(500).json({ message: "Error updating medicine", error });
  }
};

// Delete medicine
export const deleteMedicine = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);
    if (!medicine) {
      res.status(404).json({ message: "Medicine not found" });
      return;
    }
    res.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting medicine", error });
  }
};
