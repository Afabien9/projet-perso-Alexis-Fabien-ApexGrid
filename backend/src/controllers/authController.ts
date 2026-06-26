import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { db } from "../config/ds.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "CRITIQUE : JWT_SECRET n'est pas défini dans le fichier .env",
  );
}

// enregistrer utilisateur hachage mot passe base données
export const register = async (req: any, res: any) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
      [username, email, hash],
    );
    res.status(201).json({ message: "Compte créé" });
  } catch (error) {
    res.status(400).json({ message: "Email ou Pseudo déjà utilisé" });
  }
};

// Vérifier l'identifiant au moment de la connexion
export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  const user = (await db.query("SELECT * FROM users WHERE email = $1", [email]))
    .rows[0];

  if (user && (await bcrypt.compare(password, user.password_hash))) {
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token, username: user.username, role: user.role });
  } else {
    res.status(401).json({ message: "Identifiants incorrects" });
  }
};
