// backend/src/root/resultsRoutes.ts

import { Router } from "express";
import { 
  getResultsByRound, 
  getSelectedRanking, 
  getUserRoundDetails,
  getSeasonLeaderboard,
  getRoundLeaderboard 
} from "../controllers/resultsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// 1. CLASSEMENTS DES UTILISATEURS (Placées tout en haut pour intercepter l'URL avant le sélecteur /:Round)
router.get("/leaderboard/season", getSeasonLeaderboard);
router.get("/leaderboard/round/:Round", getRoundLeaderboard);

// 2. ROUTES SPÉCIFIQUES UTILISATEUR (Protégées par Token)
router.get("/user/selected-ranking", verifyToken, getSelectedRanking);
router.get("/user/round-details/:Round", verifyToken, getUserRoundDetails);

// 3. AFFICHAGE DE LA GRILLE ENTIÈRE (Placée en dernier car elle capture tous les patterns de type /:Round restant)
router.get("/:Round", getResultsByRound);

export default router;