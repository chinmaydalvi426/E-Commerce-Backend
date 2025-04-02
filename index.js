import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { addDummyProducts } from "./utils/dummyData.js";

dotenv.config({
  path: ".env",
});

const app = express();
const PORT = process.env.PORT || 5328;

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Add dummy products after connection
mongoose.connection.once("open", () => {
  // addDummyProducts();
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);

// Test endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express with MongoDB!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});