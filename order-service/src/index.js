require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");
const MenuCategory = require("./models/MenuCategory");
const MenuItem = require("./models/MenuItem");

const app = express();

app.use(cors());
app.use(express.json());

const dropLegacyIndexes = async () => {
  try {
    const categoryIndexes = await MenuCategory.collection.indexes();
    if (categoryIndexes.some((idx) => idx.name === "name_1")) {
      await MenuCategory.collection.dropIndex("name_1");
      console.log("Dropped legacy index menucategories.name_1");
    }
  } catch (error) {
    if (error.codeName !== "NamespaceNotFound") {
      throw error;
    }
  }

  try {
    const menuItemIndexes = await MenuItem.collection.indexes();
    if (menuItemIndexes.some((idx) => idx.name === "itemName_1")) {
      await MenuItem.collection.dropIndex("itemName_1");
      console.log("Dropped legacy index menuitems.itemName_1");
    }
  } catch (error) {
    if (error.codeName !== "NamespaceNotFound") {
      throw error;
    }
  }
};

const ensureIndexes = async () => {
  await dropLegacyIndexes();
  await MenuCategory.syncIndexes();
  await MenuItem.syncIndexes();
  console.log("Menu indexes synced");
};

app.use("/api/orders", require("./routes/orderRoutes"));

app.get("/health", (req,res)=>{
  res.json({status:"Order service running"});
});

const startServer = async () => {
  await connectDB();
  await connectRedis();
  await ensureIndexes();

  app.listen(process.env.PORT, ()=>{
    console.log(`Order service running on ${process.env.PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Order service startup failed:", error);
  process.exit(1);
});
