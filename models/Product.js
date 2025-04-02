import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    isNew: { type: Boolean, default: false },
    originalPrice: { type: Number },
    discount: { type: Number },
  },
  { suppressReservedKeysWarning: true }
);

export default mongoose.model("Product", productSchema);