// scripts/updateStats.js
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateDriverStats(driverId) {
  // 1. Récupération avec la colonne correcte 'position_order'
  const { data: results, error: fetchError } = await supabase
    .from('results_wiki')
    .select('position_order, points')
    .eq('driver_id', driverId);

  if (fetchError) {
    console.error(`Erreur pour ${driverId}:`, fetchError.message);
    return;
  }

  // 2. Calcul des statistiques
  const stats = results.reduce((acc, curr) => {
    const pos = curr.position_order; // Utilisation du nom réel de la colonne
    
    if (pos === 1) acc.total_wins++;
    if (pos > 0 && pos <= 3) acc.total_podiums++;
    if (pos === 0) acc.total_dnf++; // Si 0 est bien ton code pour DNF
    acc.total_points += (curr.points || 0);
    return acc;
  }, { total_wins: 0, total_podiums: 0, total_dnf: 0, total_points: 0 });

  // 3. Mise à jour de la table driver_stats
  const { error: upsertError } = await supabase
    .from('driver_stats')
    .upsert({ driver_id: driverId, ...stats });

  if (upsertError) console.error(`Erreur upsert pour ${driverId}:`, upsertError.message);
  else console.log(`Stats à jour pour le pilote ${driverId}:`, stats);
}

async function runAllUpdates() {
  console.log("Lancement de la mise à jour des statistiques...");
  
  const { data: drivers, error } = await supabase.from('drivers_wiki').select('driver_id');
  
  if (error) {
    console.error("Erreur lors de la récupération des pilotes:", error);
    return;
  }

  for (const driver of drivers) {
    await updateDriverStats(driver.driver_id);
  }
  
  console.log("Terminé avec succès !");
}

runAllUpdates();