import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

const app = express();
const PORT = process.env.PORT || 5328;

// Middleware
app.use(cors({ origin: "http://localhost:3000" })); // Restrict CORS to Next.js dev server
app.use(bodyParser.json());

// Debug MongoDB URI
console.log("MONGO_URI:", process.env.MONGO_URI);

// MongoDB Connection
await mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas and Models
const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    isNew: { type: Boolean, default: false }, // Reserved keyword, suppressed below
    originalPrice: { type: Number },
    discount: { type: Number },
  },
  { suppressReservedKeysWarning: true } // Suppress `isNew` warning
);

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      productId: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Should be hashed in production
  name: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);
const Cart = mongoose.model("Cart", cartSchema);
const User = mongoose.model("User", userSchema);

// API Routes
app.get("/api/products", async (req, res) => {
  try {
    const { category, min_price, max_price } = req.query;

    const query = {};
    if (category) query.category = category;
    if (min_price || max_price) {
      query.price = {};
      if (min_price) query.price.$gte = Number.parseFloat(min_price);
      if (max_price) query.price.$lte = Number.parseFloat(max_price);
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/products/related", async (req, res) => {
  try {
    const { category, exclude_id } = req.query;
    if (!category) {
      return res.status(400).json({ error: "Category parameter is required" });
    }

    const relatedProducts = await Product.find({
      category,
      id: { $ne: exclude_id },
    }).limit(4);

    res.json(relatedProducts);
  } catch (error) {
    console.error("Error fetching related products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cart management
app
  .route("/api/cart")
  .get(async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || "default_user";
      const cart = await Cart.findOne({ userId });
      res.json(cart ? cart.items : []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
  .post(async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || "default_user";
      const { product_id, quantity } = req.body;

      if (!product_id || !quantity) {
        return res.status(400).json({ error: "Invalid item data" });
      }

      const product = await Product.findOne({ id: product_id });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      let cart = await Cart.findOne({ userId });
      if (!cart) {
        cart = new Cart({ userId, items: [] });
      }

      const itemIndex = cart.items.findIndex((item) => item.productId === product_id);
      if (itemIndex !== -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ productId: product_id, quantity });
      }

      await cart.save();
      res.json(cart.items);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
  .put(async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || "default_user";
      const { product_id, quantity } = req.body;

      if (!product_id || !quantity) {
        return res.status(400).json({ error: "Invalid item data" });
      }

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }

      const itemIndex = cart.items.findIndex((item) => item.productId === product_id);
      if (itemIndex === -1) {
        return res.status(404).json({ error: "Item not in cart" });
      }

      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      res.json(cart.items);
    } catch (error) {
      console.error("Error updating cart:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  })
  .delete(async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] || "default_user";
      const productId = req.query.product_id;

      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }

      if (!productId) {
        await Cart.deleteOne({ userId });
        return res.json({ message: "Cart cleared" });
      }

      cart.items = cart.items.filter((item) => item.productId !== productId);
      await cart.save();
      res.json(cart.items);
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// User authentication
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const user = new User({ email, password, name });
    await user.save();

    const responseData = { email: user.email, name: user.name, createdAt: user.createdAt };
    res.status(201).json(responseData);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = "sample_jwt_token"; // Replace with real JWT in production
    const responseData = { email: user.email, name: user.name, token };
    res.json(responseData);
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Test endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Express with MongoDB!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});