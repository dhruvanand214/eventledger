const mongoose = require("mongoose");

const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forces Node to use Google DNS

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Exit DB Connected");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;