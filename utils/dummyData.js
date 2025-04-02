import Product from "../models/Product.js";

const categories = ["electronics", "clothing", "furniture", "toys", "books", "appliances", "beauty", "sports", "automotive", "jewelry"];
const prices = [199.99, 299.99, 399.99, 499.99, 599.99, 699.99, 799.99, 899.99, 999.99, 1099.99];
const reviews = [10, 25, 50, 75, 100, 150, 200, 300, 500, 1000];
const ratings = [3.5, 4.0, 4.2, 4.5, 4.7, 4.8, 4.9, 5.0, 3.8, 3.9];
const originalPrices = [249.99, 349.99, 449.99, 549.99, 649.99, 749.99, 849.99, 949.99, 1049.99, 1149.99];
const discounts = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const addDummyProducts = async () => {
  try {
    const products = [];

    for (let i = 1; i <= 100; i++) {
      products.push({
        id: `prod-${i}`,
        name: `Dummy Product ${i}`,
        description: `A test product for demonstration purposes - ${i}`,
        price: getRandom(prices),
        category: getRandom(categories),
        rating: getRandom(ratings),
        reviews: getRandom(reviews),
        isNew: Math.random() < 0.5,
        originalPrice: getRandom(originalPrices),
        discount: getRandom(discounts),
      });
    }

    await Product.insertMany(products);
    console.log("100 Dummy products added successfully!");
  } catch (error) {
    console.error("Error adding dummy products:", error);
  }
};