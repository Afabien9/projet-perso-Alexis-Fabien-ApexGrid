import { Router } from "express";
import {
  getResultsByRound,
  getSelectedRanking,
  getUserRoundDetails,
  getSeasonLeaderboard,
  getRoundLeaderboard,
} from "../controllers/resultsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = Router();

// Classement des utlisateur
router.get("/leaderboard/season", getSeasonLeaderboard);
router.get("/leaderboard/round/:Round", getRoundLeaderboard);

router.get("/user/selected-ranking", verifyToken, getSelectedRanking);
router.get("/user/round-details/:Round", verifyToken, getUserRoundDetails);

// affichage de la grille entière
router.get("/:Round", getResultsByRound);

export default router;
