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

// Add dummy products after connection
mongoose.connection.once("open", () => {
  // addDummyProducts();
});

// Routes
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/auth", authRoutes);
app.use(cors({ origin: "http://localhost:3000" })); // Restrict CORS to Next.js dev server
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});