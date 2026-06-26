import { Router } from "express";
import type { Request, Response } from "express";
import { exec } from "child_process";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import { db } from "../config/ds.js";

const router = Router();

// Route Admin : Synchro des données
router.post("/sync-data", verifyToken, isAdmin, (req: any, res: any) => {
  const round = req.body.round || "1";

  exec(`npm run sync -- --round=${round}`, (error, stdout) => {
    if (error)
      return res.status(500).json({ error: "Échec de la synchronisation" });
    res.json({
      message: `Synchronisation du Round ${round} terminée`,
      logs: stdout,
    });
  });
});

// Lister tous les utilisateurs
router.get(
  "/users",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await db.query(
        "SELECT id, username, email, role FROM public.users ORDER BY username ASC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Erreur récupération utilisateurs :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

// Changer le rôle
router.patch(
  "/users/:id/role",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Rôle invalide" });
    }

    try {
      await db.query("UPDATE public.users SET role = $1 WHERE id = $2", [
        role,
        id,
      ]);
      res.json({ message: "Rôle mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur mise à jour rôle :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

// Supprimer un utilisateur
router.delete(
  "/users/:id",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      await db.query("DELETE FROM public.users WHERE id = $1", [id]);
      res.json({ message: "Utilisateur supprimé avec succès" });
    } catch (error) {
      console.error("Erreur suppression utilisateur :", error);
      res.status(500).json({ message: "Erreur lors de la suppression" });
    }
  },
);

// Lister toutes les suggestions
router.get(
  "/suggestions",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    try {
      const result = await db.query(
        "SELECT s.*, u.username FROM public.suggestions s JOIN public.users u ON s.user_id = u.id ORDER BY s.created_at DESC",
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Erreur récupération suggestions :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

// Mettre à jour le statut d'une suggestion
router.patch(
  "/suggestions/:id",
  verifyToken,
  isAdmin,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "validated", "refused"].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    try {
      await db.query(
        "UPDATE public.suggestions SET status = $1 WHERE id = $2",
        [status, id],
      );
      res.json({ message: "Statut mis à jour avec succès" });
    } catch (error) {
      console.error("Erreur mise à jour statut suggestion :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  },
);

export default router;
