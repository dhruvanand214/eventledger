require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "Auth Service Running" });
});

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(process.env.PORT, () => {
    console.log(`Auth Service running on port ${process.env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Auth service startup failed:", error);
  process.exit(1);
});
