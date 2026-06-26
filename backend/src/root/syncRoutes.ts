import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../config/ds.js";

const router = Router();

// Webhook pour notifier la synchro
router.post("/sync-notify", (req: Request, res: Response) => {
  const { round } = req.body;
  const io = req.app.get("io");
  console.log(
    `📡 Notification de synchronisation reçue pour le round ${round}`,
  );
  io.emit("sync-completed", {
    round,
    message: `Synchronisation du Round ${round} terminée`,
  });
  res.sendStatus(200);
});

router.get("/last-synced-round", async (req: Request, res: Response) => {
  try {
    const result = await db.query(
      "SELECT MAX(round::integer) as max_round FROM public.race_results",
    );
    res.json({ lastSyncedRound: result.rows[0].max_round || 0 });
  } catch (error) {
    console.error("Erreur récupération last-synced-round :", error);
    res.status(500).json({ error: "Erreur lors de la récupération" });
  }
});

export default router;
