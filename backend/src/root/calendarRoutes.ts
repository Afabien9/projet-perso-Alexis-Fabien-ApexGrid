import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../config/ds.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      'SELECT round, name, circuit, date, location, track_image_url AS "trackImageUrl" FROM public.calendar ORDER BY CAST(round AS INTEGER) ASC',
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Erreur récupération calendrier BDD :", error);
    res.status(500).json({
      message: "Impossible de charger le calendrier depuis la base de données.",
    });
  }
});

export default router;
