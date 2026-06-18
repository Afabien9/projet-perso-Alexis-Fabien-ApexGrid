require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function importTable(tableName, fileName, mappingFn) {
  const filePath = path.join(__dirname, "data", fileName);
  const rows = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        Object.keys(row).forEach((key) => {
          if (row[key] === "\\N") row[key] = null;
        });
        rows.push(mappingFn(row));
      })
      .on("end", async () => {
        console.log(`Insertion de ${rows.length} lignes dans ${tableName}...`);
        const { error } = await supabase.from(tableName).upsert(rows);
        if (error) reject(error);
        else resolve();
      });
  });
}

async function runAll() {
  try {
    // 1. Pilotes
    await importTable("drivers_wiki", "drivers.csv", (r) => ({
      driver_id: parseInt(r.driverId),
      forename: r.forename,
      surname: r.surname,
      nationality: r.nationality,
    }));

    // 2. Constructeurs
    await importTable("constructors_wiki", "constructors.csv", (r) => ({
      constructor_id: parseInt(r.constructorId),
      name: r.name,
      nationality: r.nationality,
    }));

    // 3. Courses
    await importTable("races_wiki", "races.csv", (r) => ({
      race_id: parseInt(r.raceId),
      year: parseInt(r.year),
      round: parseInt(r.round),
      name: r.name,
      date: r.date,
    }));

    // 4. Status
    await importTable("status_wiki", "status.csv", (r) => ({
      status_id: parseInt(r.statusId),
      status: r.status,
    }));

    // 5. Résultats (La plus grosse table)
    await importTable("results_wiki", "results.csv", (r) => ({
      result_id: parseInt(r.resultId),
      race_id: parseInt(r.raceId),
      driver_id: parseInt(r.driverId),
      constructor_id: parseInt(r.constructorId),
      status_id: parseInt(r.statusId),
      position_order: parseInt(r.positionOrder),
      points: parseFloat(r.points),
    }));

    console.log("Importation terminée avec succès !");
  } catch (err) {
    console.error("Erreur globale :", err);
  }
}

runAll();
