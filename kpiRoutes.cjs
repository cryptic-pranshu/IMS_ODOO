const express = require("express");
const router  = express.Router();
const pool    = require("./db.cjs"); // Ensure this file exists and connects to Neon

// GET /api/kpi/summary
router.get("/summary", async (req, res) => {
  try {
    const [totalResult, lowStockResult] = await Promise.all([
      // 1. Total stock sum across all products [cite: 181]
      pool.query(`
        SELECT COALESCE(SUM(current_stock), 0) AS total_products
        FROM   products
      `),
      // 2. Count of products at or below their reorder level [cite: 181]
      pool.query(`
        SELECT COUNT(*) AS low_stock_items
        FROM   products
        WHERE  current_stock <= reorder_level
      `),
    ]);

    // Send the real Neon data back to the frontend [cite: 181]
    res.json({
      totalProducts: Number(totalResult.rows[0].total_products),
      lowStockItems: Number(lowStockResult.rows[0].low_stock_items),
    });
  } catch (err) {
    console.error("❌ /api/kpi/summary error:", err.message);
    res.status(500).json({ error: "Failed to fetch live KPI data from Neon." });
  }
});

module.exports = router;
router.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products" });
  }
});
// POST /api/kpi/products - Save a new product to Neon
router.post("/products", async (req, res) => {
  const { sku, name, category, uom, stock, reorderLevel } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (sku, name, category, uom, current_stock, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [sku, name, category, uom, stock || 0, reorderLevel || 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Add product error:", err.message);
    res.status(500).json({ error: "SKU already exists or database error." });
  }
});