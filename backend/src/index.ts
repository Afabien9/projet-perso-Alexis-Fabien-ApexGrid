import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./root/authRoutes.js";
import adminRoutes from "./root/adminRoutes.js";
import calendarRoutes from "./root/calendarRoutes.js";
import scoresRoutes from "./root/scoresRoutes.js";
import syncRoutes from "./root/syncRoutes.js";
import userRoutes from "./root/userRoutes.js";
import resultsRoutes from "./root/resultsRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.use(cors());
app.use(express.json());

// Routes
app.use("/", authRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api", syncRoutes);
app.use("/api", userRoutes);
app.use("/", scoresRoutes);
app.use("/admin", adminRoutes);

httpServer.listen(port, () => {
  console.log(`🚀 Serveur ApexGrid lancé sur le port ${port}`);
});
