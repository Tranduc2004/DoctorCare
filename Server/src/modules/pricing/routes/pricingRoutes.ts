import { Router, Request, Response } from "express";
import { computeConsultPrice } from "../services/computePricing";

const router = Router();

router.post("/compute", async (req: Request, res: Response) => {
  try {
    const {
      serviceCode,
      doctorId,
      durationMin,
      startAt,
      bhytEligible,
      copayRate,
    } = req.body;
    const result = await computeConsultPrice({
      serviceCode,
      doctorId,
      durationMin,
      startAt,
      bhytEligible,
      copayRate,
    });
    res.json(result);
  } catch (err: any) {
    console.error("Pricing compute error:", err);
    res.status(400).json({ message: err.message || "Error computing price" });
  }
});

export default router;
