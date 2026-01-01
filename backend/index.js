import express from "express";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import { createOwner } from "./controllers/userController.js";
import userRouter from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";

const app = express();

const port = process.env.PORT;

app.get("/", (rep, res) => {
  res.send("backend");
});

app.use(cookieParser())
app.use(express.json());
app.use('/users', userRouter)

const startServer = async () => {
  try {
    console.log("Connecting to database...");
    await connectDB();
    await createOwner();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

    
  } catch (error) {
    console.log("Error: ", error.message);
  }
};

startServer();
