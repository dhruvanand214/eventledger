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

app.use("/api/orders", require("./routes/orderRoutes"));

app.get("/health", (req,res)=>{
  res.json({status:"Order service running"});
});

app.listen(process.env.PORT, ()=>{
  console.log(`Order service running on ${process.env.PORT}`);
});