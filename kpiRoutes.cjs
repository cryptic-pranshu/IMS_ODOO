const express = require('express');
const router  = express.Router();
const pool    = require('./db.cjs'); // lowercase — matches the filename exactly

// ── GET /api/kpi/summary ─────────────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const [totalResult, lowStockResult] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(current_stock), 0) AS total_products FROM products`),
      pool.query(`SELECT COUNT(*) AS low_stock_items FROM products WHERE current_stock <= reorder_level`)
    ]);

    res.json({
      totalProducts: Number(totalResult.rows[0].total_products),
      lowStockItems: Number(lowStockResult.rows[0].low_stock_items),
    });
  } catch (err) {
    res.status(500).json({ error: 'Neon Connection Error' });
  }
});

// ── GET /api/kpi/products ────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌  /api/kpi/products GET error:', err.message);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
});

// ── POST /api/kpi/products ───────────────────────────────────────────────────
router.post('/products', async (req, res) => {
  const { sku, name, category, uom, stock, reorderLevel } = req.body;

  if (!sku || !name) {
    return res.status(400).json({ error: 'sku and name are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (sku, name, category, uom, current_stock, reorder_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [sku, name, category ?? null, uom ?? 'pcs', stock ?? 0, reorderLevel ?? 10]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌  /api/kpi/products POST error:', err.message);
    const isDuplicate = err.code === '23505';
    res.status(isDuplicate ? 409 : 500).json({
      error: isDuplicate ? 'A product with that SKU already exists.' : 'Database error.',
    });
  }
});

// ── IMPORTANT: module.exports must be at the END ─────────────────────────────
// Placing it in the middle of the file (as it was before) means every route
// defined after that line is registered on the router object but never
// included in the exported value — those routes become dead code.
// GET /api/kpi/recent-moves — Fetches the last 5 warehouse activities
router.get('/recent-moves', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        sl.reference_no AS reference,
        TO_CHAR(sl.created_at, 'Mon DD, HH24:MI') AS date,
        sl.type AS type,         -- Corrected from sl.movement_type
        p.name AS product,
        p.sku,
        sl.quantity AS quantity  -- Corrected from sl.qty_change
      FROM stock_ledger sl
      JOIN products p ON sl.product_id = p.id
      ORDER BY sl.created_at DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Recent moves error:', err.message);
    res.status(500).json({ error: 'Failed to fetch activity feed' });
  }
});
// GET /api/kpi/trends — Generates data for Inbound/Outbound graphs
router.get('/trends', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon DD') AS date,
        SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END) AS inbound,
        SUM(CASE WHEN quantity < 0 THEN ABS(quantity) ELSE 0 END) AS outbound
      FROM stock_ledger
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'Mon DD'), DATE_TRUNC('day', created_at)
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Trends error:', err.message);
    // Return empty array instead of 500 so dashboard doesn't crash
    res.json([]); 
  }
});
// IMPORTANT: Ensure this is the absolute last line in the file
module.exports = router;