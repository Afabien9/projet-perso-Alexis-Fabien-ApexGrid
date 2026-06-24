import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "";

// valider token accès jwt middleware
export const verifyToken = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Accès non autorisé" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user=decoded
  next();
  } catch (error) {
    res.status(403).json({ message: "Token invalide ou expiré" });
  }
};


// verifier droits administrateur accès
export const isAdmin = (req: any, res: any, next: any) => {
    if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Accès refusé : Droits administrateur requis" });
  }
};