import { Request, Response } from "express";
import { vnpayService } from "../../../shared/services/vnpayService";

// Debug endpoint: compute signData and secure hash for given params
export const computeVnPayHash = async (req: Request, res: Response) => {
  try {
    const params = req.body || {};
    const result = vnpayService.computeHashForParams(params);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export default computeVnPayHash;
