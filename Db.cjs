const { Pool } = require('pg');
require('dotenv').config();

// Create the pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon cloud connections
  }
});

// Export the POOL directly so kpiRoutes.cjs can use pool.query
// 1. Export the pool so other files can use pool.query()
module.exports = pool;

// 2. Attach your helper functions to the pool object
pool.getDashboardKPIs = async () => {
  const totalStock = await pool.query('SELECT SUM(current_stock) FROM products');
  const lowStock = await pool.query('SELECT COUNT(*) FROM products WHERE current_stock <= reorder_level');
  return {
    totalProducts: Number(totalStock.rows[0].sum || 0),
    lowStockItems: Number(lowStock.rows[0].count || 0)
  };
};

pool.validateReceipt = async (sku, qty) => {
  await pool.query('UPDATE products SET current_stock = current_stock + $1 WHERE sku = $2', [qty, sku]);
  await pool.query('INSERT INTO stock_ledger (type, quantity, reference_no) VALUES ($1, $2, $3)', ['Receipt', qty, `REC-${sku}`]);
};