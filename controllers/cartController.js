import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || "default_user";
    const cart = await Cart.findOne({ userId });
    res.json(cart ? cart.items : []);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addToCart = async (req, res) => {
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
};

export const updateCart = async (req, res) => {
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
};

export const removeFromCart = async (req, res) => {
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
};