// ---------------------------------------------
// server.js — PRODUCTION READY BACKEND
// ---------------------------------------------

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------
// MIDDLEWARE
// -----------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve public folder (only needed if keeping form.html)
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Create uploads folder if not exists
if (!fs.existsSync("./uploads")) fs.mkdirSync("./uploads");

// -----------------------------------------------------
// MULTER SETUP
// -----------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// -----------------------------------------------------
// MONGODB CONNECT
// -----------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// -----------------------------------------------------
// ORDER SCHEMA
// -----------------------------------------------------
const orderSchema = new mongoose.Schema(
  {
    orderId: String,
    customerName: String,
    contact: String,
    email: String,
    dob: String,
    age: String,
    country: String,
    occupation: String,
    travelDate: String,
    address: String,
    company: String,

    plan: String,
    duration: String,
    multiplier: Number,
    offer: Number,
    total: Number,

    status: { type: String, default: "Pending" },

    passportFile: String,
    calc: Object,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

// -----------------------------------------------------
// API: SAVE ORDER
// -----------------------------------------------------
app.post("/api/save-order", upload.single("passportFile"), async (req, res) => {
  try {
    const body = req.body;
    const calc = JSON.parse(body.calc || "{}");

    const order = new Order({
      orderId: body.orderId,
      customerName: body.customerName,
      contact: body.contact,
      email: body.email,
      dob: body.dob,
      age: calc.age,
      country: body.country,
      occupation: body.occupation,
      travelDate: body.travelDate,
      address: body.address,
      company: body.company,

      plan: calc.plan,
      duration: calc.days,
      multiplier: calc.multiplier,
      offer: calc.adminDiscount,
      total: calc.totalPayable,

      passportFile: req.file ? `/uploads/${req.file.filename}` : null,
      calc,
    });

    await order.save();
    res.json({ success: true, message: "Order Saved", order });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// API: GET ALL ORDERS
// -----------------------------------------------------
app.get("/api/get-orders", async (req, res) => {
  try {
    const list = await Order.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// API: UPDATE ORDER
// -----------------------------------------------------
app.post("/api/orders/update", async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.body.orderId },
      req.body,
      { new: true }
    );
    res.json({ success: true, order });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// API: DELETE ORDER
// -----------------------------------------------------
app.post("/api/delete-order", async (req, res) => {
  try {
    await Order.findOneAndDelete({ orderId: req.body.orderId });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// API: UPDATE STATUS
// -----------------------------------------------------
app.post("/api/update-status", async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    );

    res.json({ success: true, order });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------
// ROOT ROUTE (IMPORTANT FOR HOSTING)
// -----------------------------------------------------
app.get("/", (req, res) => {
  res.send("NextSure API is running successfully 🚀");
});

// -----------------------------------------------------
// WILDCARD ROUTE
// -----------------------------------------------------
app.get("*", (req, res) => {
  res.send("404: API route not found");
});

// -----------------------------------------------------
// START SERVER
// -----------------------------------------------------
app.listen(PORT, () =>
  console.log(`🚀 Server running at port: ${PORT}`)
);
