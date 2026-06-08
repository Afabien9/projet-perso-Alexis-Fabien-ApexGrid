// backend/scripts/SyncManager.ts

import { bigFive, getBottomTeams, getRaceResult } from '../src/services/ApiService.js';
import * as ScoringEngine from '../src/services/ScoringEngine.js';
import type { RaceResult } from '../src/models/RaceResult.js';
import { db } from '../src/config/ds.js';

async function runSync() {
  // Extraction du paramètre --round passé en commande npm
  const args = process.argv.slice(2);
  const roundArg = args.find(arg => arg.startsWith('--round='))?.split('=')[1];
  
  if (!roundArg) {
    console.error("❌ Erreur : Vous devez spécifier un round (ex: npm run sync -- --round=2)");
    process.exit(1);
  }

  console.log(`--- 🏁 DÉBUT SYNCHRONISATION APEXGRID SUR BDD (Round ${roundArg}) ---`);

  try {
    // 1. MISE À JOUR DE L'ÉLITE (Top 5 mondial) DANS LE CONFIG DE SAISON
    console.log("🔍 Identification de l'élite actuelle...");
    const eliteIds: string[] = await bigFive();
    
    // Normalisation en minuscules pour éviter les pièges de casse
    const normalizedElite = eliteIds.map(id => id.toLowerCase());

    // Le driver pg convertit un Array JS directement au format TEXT ARRAY (_text) de Postgres
    await db.query(`
      INSERT INTO public.season_config (round, key, value, updated_at)
      VALUES ($1, 'elite_ids', $2, NOW())
      ON CONFLICT (round, key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `, [roundArg, normalizedElite]);
    console.log(`✅ Élite synchronisée en BDD : ${normalizedElite.join(', ')}`);

    // 2. MISE À JOUR DU FOND DE GRILLE (3 dernières écuries) DANS LE CONFIG DE SAISON
    console.log("🔍 Identification du fond de grille actuel...");
    const bottomIds: string[] = await getBottomTeams();
    
    // Normalisation en minuscules également
    const normalizedBottom = bottomIds.map(id => id.toLowerCase());

    await db.query(`
      INSERT INTO public.season_config (round, key, value, updated_at)
      VALUES ($1, 'bottom_ids', $2, NOW())
      ON CONFLICT (round, key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
    `, [roundArg, normalizedBottom]);
    console.log(`✅ Fond de grille synchronisé en BDD : ${normalizedBottom.join(', ')}`);

    // 3. RÉCUPÉRATION ET SAUVEGARDE DES RÉSULTATS DE COURSE
    console.log(`📥 Téléchargement des résultats du Round ${roundArg}...`);
    const raceResults: RaceResult[] = await getRaceResult("2026", roundArg);
    
    if (raceResults && raceResults.length > 0) {
      console.log(`📥 Sauvegarde de sécurité des ${raceResults.length} résultats de pilotes dans la table public.race_results...`);
      
      for (const driverResult of raceResults) {
        // Sécurité cruciale anti-NaN pour les abandons (ex: position "R" ou "D")
        const positionVal = isNaN(Number(driverResult.position)) ? 20 : Number(driverResult.position);
        const gridVal = isNaN(Number(driverResult.grid)) ? 20 : Number(driverResult.grid);
        
        // Validation stricte de l'entrée dans les points (Top 10)
        const isPointsVal = positionVal <= 10;

        try {
          await db.query(`
            INSERT INTO public.race_results (round, driver_id, constructor_id, grid, position, status, is_points, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (round, driver_id) 
            DO UPDATE SET 
              constructor_id = EXCLUDED.constructor_id, 
              grid = EXCLUDED.grid, 
              position = EXCLUDED.position, 
              status = EXCLUDED.status, 
              is_points = EXCLUDED.is_points;
          `, [
            roundArg,
            driverResult.driverId.toLowerCase(),
            driverResult.constructorId.toLowerCase(),
            gridVal,
            positionVal,
            driverResult.status || "Finished",
            isPointsVal
          ]);
          
          console.log(`   ↳ 🏎️ Pilote [${driverResult.driverId}] synchronisé en position P${positionVal}`);
        } catch (sqlError) {
          console.error(`❌ Échec de la requête SQL d'insertion pour le pilote ${driverResult.driverId} :`, sqlError);
        }
      }
      console.log(`✅ Table race_results mise à jour avec succès.`);
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

        // La colonne driver_ids étant de type _text, elle arrive nativement en Array JS
        const parsedDriverIds: string[] = driver_ids;

        if (!parsedDriverIds || !Array.isArray(parsedDriverIds) || parsedDriverIds.length === 0) {
          continue;
        }

        let userRoundTotal = 0;

        // Évaluation de chaque pilote sélectionné par le manager
        parsedDriverIds.forEach((driverId: string) => {
          const driverData = raceResults.find(
            (r) => r.driverId.toLowerCase() === driverId.toLowerCase()
          );

          if (driverData) {
            // Utilisation stricte de tes fonctions de calcul TypeScript
            const base = ScoringEngine.calculateUserPoints(driverData, normalizedElite);
            const overtake = ScoringEngine.calculateOvertakeBonus(driverData);
            const teamMate = ScoringEngine.calculateTeamMateBonus(driverData, raceResults);
            const underdog = ScoringEngine.calculateUnderdogBonus(driverData, normalizedBottom);

            userRoundTotal += (base + overtake + teamMate + underdog);
          }
        });

        // Protection anti-négatif globale
        userRoundTotal = Math.max(0, userRoundTotal);

        // Insertion ou mise à jour (Upsert) pour écraser les anciennes valeurs
        await db.query(`
          INSERT INTO public.user_scores (user_id, round, points, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, round) 
          DO UPDATE SET points = EXCLUDED.points, updated_at = NOW();
        `, [user_id, roundArg, userRoundTotal]);

        console.log(`   ↳ ✅ Score synchronisé pour le joueur [ID: ${user_id}] : ${userRoundTotal} Pts`);
      }
    }

    // 5. AFFICHAGE DU LOG DE SUIVI DANS LA CONSOLE
    const syncLog = {
      last_sync: new Date().toISOString(),
      round_synchronized: roundArg,
      status: "SUCCESS",
      database_sync: "ALL_TABLES_COMPLETED"
    };
    
    console.log("--- ✨ TOUTES LES DONNÉES SONT À JOUR DIRECTEMENT EN BDD ---");
    console.table(syncLog);
    process.exit(0);

  } catch (error) {
    console.error("❌ ERREUR CRITIQUE DURANT LA SYNCHRO EN BDD :", error);
    process.exit(1);
  }
}

runSync();