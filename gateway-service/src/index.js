require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const proxyRoutes = require("./routes/proxyRoutes");

const app = express();

app.use(cors());

app.use(morgan("dev"));

proxyRoutes(app);

app.get("/health", (req,res)=>{
  res.json({status:"Gateway running"});
});

app.listen(process.env.PORT, ()=>{
  console.log(`Gateway running on ${process.env.PORT}`);
});
