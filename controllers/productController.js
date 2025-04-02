import Product from "../models/Product.js";

export const getProducts = async (req, res) => {
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
};

export const getProductById = async (req, res) => {
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
};

export const getRelatedProducts = async (req, res) => {
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
};