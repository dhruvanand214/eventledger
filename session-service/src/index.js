require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();
connectRedis();

app.use("/api/sessions", require("./routes/sessionRoutes"));

app.get("/health", (req, res) => {
  res.json({ status: "Auth Service Running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Auth Service running on port ${process.env.PORT}`);
});