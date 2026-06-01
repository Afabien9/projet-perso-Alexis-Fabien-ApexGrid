// backend/scripts/SyncManager.ts (ou le chemin actuel de ton script de synchro)

import fs from 'fs';
import path from 'path';
// Importation des services de récupération de données
import { bigFive, getBottomTeams, getRaceResult } from '../src/services/ApiService.js';
import * as ScoringEngine from '../src/services/ScoringEngine.js';
import type { RaceResult } from '../src/models/RaceResult.js';
import { db } from '../src/config/ds.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const RESULTS_DIR = path.join(DATA_DIR, 'results');
const LOG_FILE = path.join(DATA_DIR, 'sync_log.json');

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

async function runSync() {
  // Extraction du paramètre --round passé en commande npm
  const args = process.argv.slice(2);
  const roundArg = args.find(arg => arg.startsWith('--round='))?.split('=')[1];
  
  if (!roundArg) {
    console.error("❌ Erreur : Vous devez spécifier un round (ex: npm run sync -- --round=2)");
    process.exit(1);
  }

  console.log(`--- 🏁 DÉBUT SYNCHRONISATION APEXGRID (Round ${roundArg}) ---`);

  try {
    // 1. MISE À ZONE DE L'ÉLITE (Top 5 mondial)
    console.log("🔍 Identification de l'élite actuelle...");
    const eliteIds: string[] = await bigFive();
    fs.writeFileSync(path.join(DATA_DIR, 'elite_ids.json'), JSON.stringify(eliteIds, null, 2));
    console.log(`✅ Élite mise à jour : ${eliteIds.join(', ')}`);

    // 2. MISE À JOUR DU FOND DE GRILLE (3 dernières écuries)
    console.log("🔍 Identification du fond de grille actuel...");
    const bottomIds: string[] = await getBottomTeams();
    fs.writeFileSync(path.join(DATA_DIR, 'bottom_ids.json'), JSON.stringify(bottomIds, null, 2));
    console.log(`✅ Fond de grille mis à jour : ${bottomIds.join(', ')}`);

    // 3. RÉCUPÉRATION DES RÉSULTATS DE COURSE
    console.log(`📥 Téléchargement des résultats du Round ${roundArg}...`);
    const raceResults: RaceResult[] = await getRaceResult("2026", roundArg);
    
    // Vérification sommaire de la donnée reçue avant écriture
    if (raceResults && raceResults.length > 0) {
      fs.writeFileSync(path.join(RESULTS_DIR, `round_${roundArg}.json`), JSON.stringify(raceResults, null, 2));
      console.log(`✅ Résultats du Round ${roundArg} enregistrés.`);
    } else {
      throw new Error(`Aucun résultat trouvé pour le round ${roundArg}`);
    }

    // =========================================================================
    // 4. CALCUL AUTOMATIQUE ET SYNCHRONISATION DES SCORES EN BDD (POSTGRESQL)
    // =========================================================================
    console.log(`📊 Calcul des scores des managers pour le Round ${roundArg}...`);

    // Récupération de tous les alignements d'écuries verrouillés par les utilisateurs
    const teamsResult = await db.query(
      "SELECT user_id, driver_ids FROM public.user_teams WHERE round = $1",
      [roundArg]
    );

    if (teamsResult.rows.length === 0) {
      console.warn(`⚠️ Aucune composition d'équipe trouvée en BDD pour le Round ${roundArg}. Aucun score calculé.`);
    } else {
      for (const team of teamsResult.rows) {
        const { user_id, driver_ids } = team;

        if (!driver_ids || !Array.isArray(driver_ids) || driver_ids.length === 0) {
          continue;
        }

        let userRoundTotal = 0;

        // Évaluation de chaque pilote sélectionné par le manager
        driver_ids.forEach((driverId: string) => {
          const driverData = raceResults.find(
            (r) => r.driverId.toLowerCase() === driverId.toLowerCase()
          );

          if (driverData) {
            // Utilisation stricte de tes fonctions de calcul TypeScript
            const base = ScoringEngine.calculateUserPoints(driverData, eliteIds);
            const overtake = ScoringEngine.calculateOvertakeBonus(driverData);
            const teamMate = ScoringEngine.calculateTeamMateBonus(driverData, raceResults);
            const underdog = ScoringEngine.calculateUnderdogBonus(driverData, bottomIds);

            userRoundTotal += (base + overtake + teamMate + underdog);
          }
        });

        // Protection anti-négatif globale
        userRoundTotal = Math.max(0, userRoundTotal);

        // Insertion ou mise à jour (Upsert) pour écraser les anciennes valeurs erronées
        await db.query(`
          INSERT INTO public.user_scores (user_id, round, points, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, round) 
          DO UPDATE SET points = EXCLUDED.points, updated_at = NOW();
        `, [user_id, roundArg, userRoundTotal]);

        console.log(`   ↳ ✅ Score synchronisé pour le joueur [ID: ${user_id}] : ${userRoundTotal} Pts`);
      }
    }

    // 5. GÉNÉRATION DU LOG DE SUIVI
    const syncLog = {
      last_sync: new Date().toISOString(),
      round_synchronized: roundArg,
      status: "SUCCESS",
      files_updated: [
        "elite_ids.json",
        "bottom_ids.json",
        `results/round_${roundArg}.json`
      ],
      database_sync: "SUCCESS"
    };
    fs.writeFileSync(LOG_FILE, JSON.stringify(syncLog, null, 2));
    
    console.log("--- ✨ TOUTES LES DONNÉES SONT À JOUR EN LOCAL ET EN BDD ---");
    process.exit(0);

  } catch (error) {
    // Log d'échec en cas de problème API ou système
    const errorLog = {
      last_attempt: new Date().toISOString(),
      round_attempted: roundArg,
      status: "FAILED",
      error_message: error instanceof Error ? error.message : "Erreur inconnue"
    };
    fs.writeFileSync(LOG_FILE, JSON.stringify(errorLog, null, 2));
    
    console.error("❌ ERREUR CRITIQUE DURANT LA SYNCHRO :", error);
    process.exit(1);
  }
}

runSync();