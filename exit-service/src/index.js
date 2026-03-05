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

app.use("/api/exit", require("./routes/exitRoutes"));

app.get("/health", (req, res) => {
  res.json({ status: "Exit service running" });
});

app.listen(process.env.PORT, () => {
  console.log(`Exit service running on ${process.env.PORT}`);
});