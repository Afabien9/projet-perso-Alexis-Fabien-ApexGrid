import { ReactNode } from "react";

export interface PointDetail {
  bonus_exploit: ReactNode;
  nom: string;
  position: number;
  depart: number;
  points_base: number;
  bonus_duel: number;
  bonus_depassement: number;
  total: number;
}