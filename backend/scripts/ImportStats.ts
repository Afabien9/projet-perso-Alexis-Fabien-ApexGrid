import fs from "fs";
import path from "path";
import { db } from "../src/config/ds.js";

async function importStats() {
  const files = ["2023.json", "2024.json", "2025.json"];
  
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", file), "utf-8"));
    
    for (const item of data) {
      await db.query(
        `INSERT INTO public.race_results_history 
         (season, driver_name, team, position, points, wins, podiums, poles, fastest_laps, dnf)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          item.saison, item.pilote, item.equipe, item.position_championnat, 
          item.points, item.victoires_total, item.podiums, item.poles, 
          item.meilleurs_tours || 0, item.dnf
        ]
      );
    }
    console.log(`✅ ${file} importé.`);
  }
}

importStats();