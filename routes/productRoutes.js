import express from "express";
import { getProducts, getProductById, getRelatedProducts } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/related", getRelatedProducts);
router.get("/:id", getProductById);

export default router;