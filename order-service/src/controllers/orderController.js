const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const MenuCategory = require("../models/MenuCategory");
const { redisClient } = require("../config/redis");
const publishEvent = require("../events/publisher");

const getContext = (req) => ({
  clubId: req.user?.clubId || "default-club",
  clubName: req.user?.clubName || "Default Club",
  eventId: req.user?.eventId || "default-event",
  eventName: req.user?.eventName || "Default Event"
});

exports.addItem = async (req, res) => {
  try {
    const { sessionId, itemName, price, quantity } = req.body;

    if (!sessionId || !itemName || !price || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { clubId, clubName, eventId, eventName } = getContext(req);
    const addedById = req.user?.id || null;
    const addedByName = req.user?.name || "Unknown";
    const sessionKey = `session:${clubId}:${eventId}:${sessionId}`;

    const sessionExists = await redisClient.exists(sessionKey);
    if (!sessionExists) {
      return res.status(404).json({ message: "Session not active" });
    }

    const totalIncrease = Number(price) * Number(quantity);
    await redisClient.hIncrBy(sessionKey, "total", totalIncrease);

    const order = await Order.create({
      clubId,
      clubName,
      eventId,
      eventName,
      addedById,
      addedByName,
      sessionId,
      itemName,
      price,
      quantity
    });

    await publishEvent("order.created", {
      sessionId,
      itemName,
      price,
      quantity,
      clubId,
      clubName,
      eventId,
      eventName,
      addedById,
      addedByName
    });

    res.json({
      message: "Item added",
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add item" });
  }
};

exports.getMenu = async (req, res) => {
  try {
    const { clubId, eventId } = getContext(req);
    const menu = await MenuItem.find({ clubId, eventId }).sort({ category: 1, itemName: 1 });
    res.json(menu);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch menu" });
  }
};

exports.getMenuCategories = async (req, res) => {
  try {
    const { clubId, eventId } = getContext(req);
    const categories = await MenuCategory.find({ clubId, eventId }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

exports.createMenuCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const normalizedName = name?.trim();
    const { clubId, eventId } = getContext(req);

    if (!normalizedName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const category = await MenuCategory.findOneAndUpdate(
      { clubId, eventId, name: normalizedName },
      { clubId, eventId, name: normalizedName, createdBy: req.user?.id || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: "Category saved", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save category" });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { category, itemName, price } = req.body;
    const { clubId, eventId } = getContext(req);

    if (!category || !itemName || price === undefined || price === null) {
      return res.status(400).json({ message: "category, itemName and price are required" });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const normalizedCategory = category.trim();
    const normalizedName = itemName.trim();

    if (!normalizedCategory || !normalizedName) {
      return res.status(400).json({ message: "Invalid category or itemName" });
    }

    await MenuCategory.findOneAndUpdate(
      { clubId, eventId, name: normalizedCategory },
      { clubId, eventId, name: normalizedCategory, createdBy: req.user?.id || null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const menuItem = await MenuItem.findOneAndUpdate(
      { clubId, eventId, category: normalizedCategory, itemName: normalizedName },
      {
        clubId,
        eventId,
        category: normalizedCategory,
        itemName: normalizedName,
        price: parsedPrice,
        createdBy: req.user?.id || null
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: "Menu item saved", menuItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to save menu item" });
  }
};

const parseMenuLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const csv = trimmed.split(",");
  if (csv.length >= 3) {
    const category = csv[0].trim();
    const name = csv[1].trim();
    const price = Number(csv[2].trim());
    if (category && name && Number.isFinite(price) && price >= 0) {
      return { category, itemName: name, price };
    }
  }

  const byComma = trimmed.split(",");
  if (byComma.length >= 2) {
    const name = byComma[0].trim();
    const price = Number(byComma[1].trim());
    if (name && Number.isFinite(price) && price >= 0) {
      return { category: "General", itemName: name, price };
    }
  }

  const byDash = trimmed.split("-");
  if (byDash.length >= 2) {
    const priceCandidate = byDash[byDash.length - 1].trim();
    const nameCandidate = byDash.slice(0, -1).join("-").trim();
    const price = Number(priceCandidate);
    if (nameCandidate && Number.isFinite(price) && price >= 0) {
      return { category: "General", itemName: nameCandidate, price };
    }
  }

  return null;
};

exports.uploadMenu = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { clubId, eventId } = getContext(req);
    const content = req.file.buffer.toString("utf-8");
    const lines = content.split(/\r?\n/);

    const parsed = lines
      .map(parseMenuLine)
      .filter(Boolean)
      .map((item) => ({ ...item, itemName: item.itemName.trim() }));

    if (!parsed.length) {
      return res.status(400).json({
        message: "No valid menu rows found. Use: category,itemName,price"
      });
    }

    const operations = parsed.map((item) => ({
      updateOne: {
        filter: { clubId, eventId, category: item.category, itemName: item.itemName },
        update: {
          $set: {
            clubId,
            eventId,
            category: item.category,
            itemName: item.itemName,
            price: item.price,
            createdBy: req.user?.id || null
          }
        },
        upsert: true
      }
    }));

    const categories = [...new Set(parsed.map((item) => item.category))];
    await MenuCategory.bulkWrite(
      categories.map((name) => ({
        updateOne: {
          filter: { clubId, eventId, name },
          update: { $set: { clubId, eventId, name, createdBy: req.user?.id || null } },
          upsert: true
        }
      }))
    );

    await MenuItem.bulkWrite(operations);

    res.json({
      message: "Menu uploaded successfully",
      processed: parsed.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload menu file" });
  }
};
