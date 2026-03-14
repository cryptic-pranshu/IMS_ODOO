/**
 * inventoryKPIs.js — CoreInventory Dashboard KPI Logic
 * -------------------------------------------------------
 * Four exported async functions:
 *
 *  1. getTotalStock()          → number   (sum of current_stock across all products)
 *  2. getLowStockCount()       → number   (count where current_stock <= reorder_level)
 *  3. validateReceipt(...)     → object   (updated product row after stock increase)
 *  4. validateDelivery(...)    → object   (updated product row after stock decrease)
 *
 * Functions 3 & 4 run inside a single database transaction:
 *   UPDATE products  +  INSERT stock_ledger
 * If either step fails, the whole operation is rolled back automatically.
 */

const pool = require("./db.cjs");

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET TOTAL STOCK SUM
//    Returns the sum of current_stock across every active product.
//    Dashboard KPI: "Total Products in Stock"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @returns {Promise<number>} Total units of stock across all products.
 */
async function getTotalStock() {
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(current_stock), 0) AS total_stock
    FROM   products
  `);
  return Number(rows[0].total_stock);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET LOW STOCK COUNT
//    Counts products where current_stock has hit or fallen below reorder_level.
//    Dashboard KPI: "Low Stock / Out of Stock Items"
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @returns {Promise<number>} Number of products at or below their reorder level.
 */
async function getLowStockCount() {
  const { rows } = await pool.query(`
    SELECT COUNT(*) AS low_stock_count
    FROM   products
    WHERE  current_stock <= reorder_level
  `);
  return Number(rows[0].low_stock_count);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. VALIDATE RECEIPT  (Incoming Goods)
//    Atomically:
//      a) UPDATE products SET current_stock = current_stock + qty
//      b) INSERT a 'receipt' row into stock_ledger
//
//    Rolls back both steps if either fails.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.productId     - UUID of the product being received
 * @param {number} params.qty           - Quantity received (must be > 0)
 * @param {string} params.referenceNo   - Receipt document reference, e.g. "REC-2025-0001"
 * @param {string} [params.supplierName]- Vendor name (stored in ledger notes)
 * @param {string} [params.locationId]  - UUID of the destination location (optional)
 * @param {string} [params.createdBy]   - UUID of the user validating the receipt
 * @returns {Promise<object>} The updated product row (id, name, sku, current_stock)
 */
async function validateReceipt({ productId, qty, referenceNo, supplierName, locationId, createdBy }) {
  if (!productId)   throw new Error("validateReceipt: productId is required.");
  if (!referenceNo) throw new Error("validateReceipt: referenceNo is required.");
  if (!qty || qty <= 0) throw new Error("validateReceipt: qty must be greater than 0.");

  const client = await pool.connect(); // Grab a dedicated connection for the transaction

  try {
    await client.query("BEGIN");

    // ── a) Lock the product row and read current stock ──────────────────────
    const { rows: productRows } = await client.query(
      `SELECT id, name, sku, current_stock
       FROM   products
       WHERE  id = $1
       FOR UPDATE`,          // Row-level lock prevents concurrent stock corruption
      [productId]
    );

    if (productRows.length === 0) {
      throw new Error(`validateReceipt: Product with id "${productId}" not found.`);
    }

    const product      = productRows[0];
    const stockBefore  = Number(product.current_stock);
    const stockAfter   = stockBefore + Number(qty);

    // ── b) Update product stock ─────────────────────────────────────────────
    const { rows: updatedRows } = await client.query(
      `UPDATE products
       SET    current_stock = $1,
              updated_at    = NOW()
       WHERE  id = $2
       RETURNING id, name, sku, current_stock`,
      [stockAfter, productId]
    );

    // ── c) Write to stock ledger ────────────────────────────────────────────
    await client.query(
      `INSERT INTO stock_ledger
         (product_id, location_id, movement_type, qty_change,
          qty_before, qty_after, reference_no, notes, created_by)
       VALUES
         ($1, $2, 'receipt', $3, $4, $5, $6, $7, $8)`,
      [
        productId,
        locationId  || null,
        Number(qty),
        stockBefore,
        stockAfter,
        referenceNo,
        supplierName ? `Received from: ${supplierName}` : null,
        createdBy   || null,
      ]
    );

    await client.query("COMMIT");

    console.log(
      `✅  Receipt validated — ${product.name} (${product.sku}): ` +
      `${stockBefore} → ${stockAfter} (+${qty})`
    );

    return updatedRows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  validateReceipt rolled back:", err.message);
    throw err;              // Re-throw so the caller can handle / respond with 500
  } finally {
    client.release();       // Always return the connection to the pool
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VALIDATE DELIVERY  (Outgoing Goods)
//    Atomically:
//      a) Checks sufficient stock exists (throws if not)
//      b) UPDATE products SET current_stock = current_stock - qty
//      c) INSERT a 'delivery' row into stock_ledger
//
//    Rolls back both steps if either fails.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.productId     - UUID of the product being shipped
 * @param {number} params.qty           - Quantity to deduct (must be > 0)
 * @param {string} params.referenceNo   - Delivery document reference, e.g. "DEL-2025-0001"
 * @param {string} [params.customerName]- Customer name (stored in ledger notes)
 * @param {string} [params.locationId]  - UUID of the source location (optional)
 * @param {string} [params.createdBy]   - UUID of the user validating the delivery
 * @returns {Promise<object>} The updated product row (id, name, sku, current_stock)
 */
async function validateDelivery({ productId, qty, referenceNo, customerName, locationId, createdBy }) {
  if (!productId)   throw new Error("validateDelivery: productId is required.");
  if (!referenceNo) throw new Error("validateDelivery: referenceNo is required.");
  if (!qty || qty <= 0) throw new Error("validateDelivery: qty must be greater than 0.");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // ── a) Lock the product row and read current stock ──────────────────────
    const { rows: productRows } = await client.query(
      `SELECT id, name, sku, current_stock
       FROM   products
       WHERE  id = $1
       FOR UPDATE`,
      [productId]
    );

    if (productRows.length === 0) {
      throw new Error(`validateDelivery: Product with id "${productId}" not found.`);
    }

    const product      = productRows[0];
    const stockBefore  = Number(product.current_stock);

    // ── b) Guard: prevent stock going negative ──────────────────────────────
    if (stockBefore < Number(qty)) {
      throw new Error(
        `validateDelivery: Insufficient stock for "${product.name}". ` +
        `Available: ${stockBefore}, Requested: ${qty}.`
      );
    }

    const stockAfter = stockBefore - Number(qty);

    // ── c) Update product stock ─────────────────────────────────────────────
    const { rows: updatedRows } = await client.query(
      `UPDATE products
       SET    current_stock = $1,
              updated_at    = NOW()
       WHERE  id = $2
       RETURNING id, name, sku, current_stock`,
      [stockAfter, productId]
    );

    // ── d) Write to stock ledger ────────────────────────────────────────────
    await client.query(
      `INSERT INTO stock_ledger
         (product_id, location_id, movement_type, qty_change,
          qty_before, qty_after, reference_no, notes, created_by)
       VALUES
         ($1, $2, 'delivery', $3, $4, $5, $6, $7, $8)`,
      [
        productId,
        locationId   || null,
        -Number(qty),          // Negative — stock left the warehouse
        stockBefore,
        stockAfter,
        referenceNo,
        customerName ? `Shipped to: ${customerName}` : null,
        createdBy    || null,
      ]
    );

    await client.query("COMMIT");

    console.log(
      `✅  Delivery validated — ${product.name} (${product.sku}): ` +
      `${stockBefore} → ${stockAfter} (-${qty})`
    );

    return updatedRows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  validateDelivery rolled back:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getTotalStock,
  getLowStockCount,
  validateReceipt,
  validateDelivery,
};


// ─────────────────────────────────────────────────────────────────────────────
// USAGE EXAMPLES (remove before production)
// ─────────────────────────────────────────────────────────────────────────────
//
// const kpi = require("./inventoryKPIs");
//
// // --- Dashboard KPIs ---
// const total    = await kpi.getTotalStock();       // → 1240
// const lowCount = await kpi.getLowStockCount();    // → 3
//
// // --- Validate a Receipt ---
// const updated = await kpi.validateReceipt({
//   productId:    "uuid-of-steel-rod",
//   qty:          50,
//   referenceNo:  "REC-2025-0001",
//   supplierName: "ABC Metals Ltd",
//   locationId:   "uuid-of-rack-a",     // optional
//   createdBy:    "uuid-of-manager",    // optional
// });
// console.log(updated.current_stock);   // → previous stock + 50
//
// // --- Validate a Delivery ---
// const updated = await kpi.validateDelivery({
//   productId:    "uuid-of-office-chair",
//   qty:          10,
//   referenceNo:  "DEL-2025-0001",
//   customerName: "XYZ Corp",
//   locationId:   "uuid-of-main-store", // optional
//   createdBy:    "uuid-of-manager",    // optional
// });
// console.log(updated.current_stock);   // → previous stock - 10