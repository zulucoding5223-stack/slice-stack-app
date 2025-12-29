import express from "express";
import "dotenv/config";
import { connectDB } from "./config/db.js";

const app = express();

const port = process.env.PORT;

app.get("/", (rep, res) => {
  res.send("backend");
});

const startServer = async (req, res) => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.log("Error: ", error.message);
  }
};

startServer();