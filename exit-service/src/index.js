require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/exit", require("./routes/exitRoutes"));

app.get("/health", (req, res) => {
  res.json({ status: "Exit service running" });
});

const startServer = async () => {
  await connectDB();
  await connectRedis();

  app.listen(process.env.PORT, () => {
    console.log(`Exit service running on ${process.env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Exit service startup failed:", error);
  process.exit(1);
});
