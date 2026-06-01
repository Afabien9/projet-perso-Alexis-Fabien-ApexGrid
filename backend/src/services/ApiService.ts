import axios from "axios";
import type { RaceResult } from "../models/RaceResult.ts";
import type { DriverStandingsResponse } from "../models/DriverStanding.js";
import type { ConstructorStandingsResponse } from "../models/ConstrctorStanding.js";
import type { promises } from "node:dns";
import { response } from "express";
const BASE_URL = "https://api.jolpi.ca/ergast/f1";

export const getRaceResult = async (
  year: string,
  round: string,
): Promise<RaceResult[]> => {
  try {
    const reponse = await axios.get(
      `${BASE_URL}/${year}/${round}/results.json`,
    );
    const rawResults = reponse.data.MRData.RaceTable.Races[0].Results;

    return rawResults.map((item: any): RaceResult => {
      return {
        driverId: item.Driver.driverId,
        constructorId: item.Constructor.constructorId,
        grid: Number(item.grid),
        position: Number(item.position),
        status: item.status,
        isPoints: Number(item.position) <= 10,
      };
    });
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const bigFive = async (): Promise<string[]> => {
  try {
    const reponse = await fetch(
      "https://api.jolpi.ca/ergast/f1/2026/driverstandings.json",
    );
    if (!reponse.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data: DriverStandingsResponse = await reponse.json();
    const standingsList = data.MRData.StandingsTable.StandingsLists[0];

    if (!standingsList || !standingsList.DriverStandings) {
      return [];
    }
    const bigFiveId = standingsList.DriverStandings.filter(
      (item) => Number(item.position) <= 5,
    ).map((item) => item.Driver.driverId);
    console.log("TOP 5 Identifier pour le malus :", bigFiveId);
    return bigFiveId;
  } catch (error) {
    console.error("Erreur lors de la récupération du Top 5 :", error);
    return [];
  }
};

export const getBottomTeams = async (): Promise<string[]> => {
  try {
    const response = await fetch(
      "https://api.jolpi.ca/ergast/f1/2026/constructorstandings.json",
    );
    if (!response.ok) throw new Error("Erreur Constructor Standings");

    const data: ConstructorStandingsResponse = await response.json();
    const list =
      data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings;

    
    if (!list) return [];

    
    const bottomThree = list
      .slice(-3)
      .map((item) => item.Constructor.constructorId);

    console.log("Fond de grille identifié :", bottomThree);
    return bottomThree;
  } catch (error) {
    console.error("Erreur getBottomTeams:", error);
    return [];
  }
};
