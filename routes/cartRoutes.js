import express from "express";
import { getCart, addToCart, updateCart, removeFromCart } from "../controllers/cartController.js";

const router = express.Router();

router.get("/", getCart);
router.post("/", addToCart);
router.put("/", updateCart);
router.delete("/", removeFromCart);

export default router;