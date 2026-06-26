import { db } from "../config/ds.js";

export async function getSeasonConfig(round: string) {
  const configResult = await db.query(
    "SELECT key, value FROM public.season_config WHERE round = $1",
    [round],
  );

  let eliteIds: string[] = [];
  let bottomIds: string[] = [];

  configResult.rows.forEach((row) => {
    if (row.key === "elite_ids") {
      eliteIds = row.value;
    } else if (row.key === "bottom_ids") {
      bottomIds = row.value;
    }
  });

  return {
    eliteIds: Array.isArray(eliteIds) ? eliteIds : [],
    bottomIds: Array.isArray(bottomIds) ? bottomIds : [],
  };
}
