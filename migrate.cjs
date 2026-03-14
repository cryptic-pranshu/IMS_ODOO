/**
 * CoreInventory — Neon.tech PostgreSQL Migration
 * ------------------------------------------------
 * Run: node migrate.js
 * Requires: DATABASE_URL in .env (Neon connection string)
 *
 * Tables created (in dependency order):
 *  1. product_categories
 *  2. warehouses
 *  3. locations
 *  4. products
 *  5. receipts
 *  6. receipt_items
 *  7. delivery_orders
 *  8. delivery_order_items
 *  9. stock_ledger
 */

require("dotenv").config();
const { Client } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL is not set in your .env file.");
  process.exit(1);
}

// ─── SQL ────────────────────────────────────────────────────────────────────

const SQL = `

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()


-- ============================================================
-- 1. PRODUCT CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE product_categories IS
  'Lookup table for product classification (e.g. Raw Material, Finished Good).';


-- ============================================================
-- 2. WAREHOUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL UNIQUE,
  address     TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE warehouses IS
  'Physical or virtual warehouses. Supports multi-warehouse layout.';


-- ============================================================
-- 3. LOCATIONS  (zones / racks inside a warehouse)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID        NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name         VARCHAR(150) NOT NULL,            -- e.g. "Rack A", "Production Floor"
  barcode      VARCHAR(100) UNIQUE,
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (warehouse_id, name)
);

COMMENT ON TABLE locations IS
  'Sub-locations within a warehouse (racks, zones, floors).';


-- ============================================================
-- 4. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                VARCHAR(255)  NOT NULL,
  sku                 VARCHAR(100)  NOT NULL UNIQUE,
  category_id         UUID          REFERENCES product_categories(id) ON DELETE SET NULL,
  unit_of_measure     VARCHAR(50)   NOT NULL DEFAULT 'pcs',  -- e.g. kg, pcs, litre
  initial_stock       NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (initial_stock >= 0),
  reorder_point       NUMERIC(12,3) NOT NULL DEFAULT 0,      -- low-stock alert threshold
  reorder_qty         NUMERIC(12,3) NOT NULL DEFAULT 0,      -- suggested reorder quantity
  description         TEXT,
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku          ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category_id  ON products(category_id);

COMMENT ON TABLE products IS
  'Master product catalogue. SKU is the unique business identifier.';
COMMENT ON COLUMN products.reorder_point IS
  'When on-hand stock falls to or below this value, a low-stock alert is triggered.';


-- ============================================================
-- 5. RECEIPTS  (Incoming Goods from vendors)
-- ============================================================
CREATE TABLE IF NOT EXISTS receipts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no    VARCHAR(100) NOT NULL UNIQUE,         -- e.g. REC-2025-0001
  supplier_name   VARCHAR(255) NOT NULL,
  destination_id  UUID        REFERENCES locations(id) ON DELETE SET NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','waiting','ready','done','cancelled')),
  scheduled_date  DATE,
  validated_at    TIMESTAMPTZ,                          -- set when status → done
  notes           TEXT,
  created_by      UUID,                                 -- FK to users table (add later)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_status         ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_receipts_scheduled_date ON receipts(scheduled_date);

COMMENT ON TABLE receipts IS
  'Header record for an incoming goods receipt from a vendor.';


-- ============================================================
-- 6. RECEIPT LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS receipt_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id     UUID          NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id     UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty_expected   NUMERIC(12,3) NOT NULL CHECK (qty_expected > 0),
  qty_received   NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
  unit_cost      NUMERIC(14,4),                         -- optional purchase price
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (receipt_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id  ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_product_id  ON receipt_items(product_id);

COMMENT ON TABLE receipt_items IS
  'One row per product line on a receipt. Validation increases stock via stock_ledger.';


-- ============================================================
-- 7. DELIVERY ORDERS  (Outgoing Goods to customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no    VARCHAR(100) NOT NULL UNIQUE,         -- e.g. DEL-2025-0001
  customer_name   VARCHAR(255) NOT NULL,
  source_id       UUID        REFERENCES locations(id) ON DELETE SET NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','waiting','ready','done','cancelled')),
  scheduled_date  DATE,
  validated_at    TIMESTAMPTZ,
  notes           TEXT,
  created_by      UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_orders_status         ON delivery_orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_orders_scheduled_date ON delivery_orders(scheduled_date);

COMMENT ON TABLE delivery_orders IS
  'Header record for an outgoing delivery. Validation decreases stock via stock_ledger.';


-- ============================================================
-- 8. DELIVERY ORDER LINE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_order_items (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id    UUID          NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  product_id     UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty_ordered    NUMERIC(12,3) NOT NULL CHECK (qty_ordered > 0),
  qty_delivered  NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (qty_delivered >= 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (delivery_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_delivery_items_delivery_id ON delivery_order_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_items_product_id  ON delivery_order_items(product_id);

COMMENT ON TABLE delivery_order_items IS
  'One row per product line on a delivery order.';


-- ============================================================
-- 9. STOCK LEDGER  (append-only movement log)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_ledger (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  location_id     UUID          REFERENCES locations(id) ON DELETE SET NULL,

  -- Movement type drives sign of qty_change
  movement_type   VARCHAR(30)   NOT NULL
                    CHECK (movement_type IN (
                      'receipt',          -- incoming from vendor   (+)
                      'delivery',         -- outgoing to customer   (-)
                      'transfer_in',      -- arrived at location    (+)
                      'transfer_out',     -- left a location        (-)
                      'adjustment_add',   -- stock count surplus    (+)
                      'adjustment_sub',   -- stock count deficit    (-)
                      'initial'           -- opening stock entry    (+)
                    )),

  qty_change      NUMERIC(12,3) NOT NULL,   -- positive = stock in, negative = stock out
  qty_before      NUMERIC(12,3) NOT NULL,   -- snapshot before this movement
  qty_after       NUMERIC(12,3) NOT NULL,   -- snapshot after  this movement

  -- Source document references (nullable; only the relevant one is set)
  receipt_id      UUID REFERENCES receipts(id)        ON DELETE SET NULL,
  delivery_id     UUID REFERENCES delivery_orders(id) ON DELETE SET NULL,

  -- Free-text reference for internal transfers / adjustments
  reference_no    VARCHAR(100),
  notes           TEXT,

  created_by      UUID,                             -- FK to users (add later)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Ledger rows are NEVER updated or deleted
);

CREATE INDEX IF NOT EXISTS idx_ledger_product_id     ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_location_id    ON stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_ledger_movement_type  ON stock_ledger(movement_type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at     ON stock_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_receipt_id     ON stock_ledger(receipt_id)  WHERE receipt_id  IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_delivery_id    ON stock_ledger(delivery_id) WHERE delivery_id IS NOT NULL;

COMMENT ON TABLE stock_ledger IS
  'Immutable audit log of every stock movement. Never UPDATE or DELETE rows here.';
COMMENT ON COLUMN stock_ledger.qty_change IS
  'Positive = stock increased; Negative = stock decreased.';


-- ============================================================
-- 10. HELPER VIEW — current on-hand stock per product × location
-- ============================================================
CREATE OR REPLACE VIEW v_stock_on_hand AS
SELECT
  p.id              AS product_id,
  p.name            AS product_name,
  p.sku,
  p.unit_of_measure,
  l.id              AS location_id,
  l.name            AS location_name,
  w.id              AS warehouse_id,
  w.name            AS warehouse_name,
  COALESCE(SUM(sl.qty_change), 0) AS qty_on_hand
FROM products p
LEFT JOIN stock_ledger sl ON sl.product_id = p.id
LEFT JOIN locations    l  ON l.id = sl.location_id
LEFT JOIN warehouses   w  ON w.id = l.warehouse_id
GROUP BY p.id, p.name, p.sku, p.unit_of_measure,
         l.id, l.name, w.id, w.name;

COMMENT ON VIEW v_stock_on_hand IS
  'Live on-hand quantity per product per location, derived from the stock ledger.';

`;

// ─── RUNNER ─────────────────────────────────────────────────────────────────

async function migrate() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Neon.tech
  });

  console.log("🔌  Connecting to Neon.tech PostgreSQL…");
  await client.connect();
  console.log("✅  Connected.\n");

  console.log("🚀  Running migration inside a single transaction…");
  try {
    await client.query("BEGIN");
    await client.query(SQL);
    await client.query("COMMIT");

    console.log("\n✅  Migration complete! Tables created:\n");
    const { rows } = await client.query(`
      SELECT table_name
      FROM   information_schema.tables
      WHERE  table_schema = 'public'
        AND  table_type   = 'BASE TABLE'
      ORDER  BY table_name;
    `);
    rows.forEach(({ table_name }) => console.log("   📋  " + table_name));

    const { rows: views } = await client.query(`
      SELECT table_name AS view_name
      FROM   information_schema.views
      WHERE  table_schema = 'public'
      ORDER  BY table_name;
    `);
    if (views.length) {
      console.log("\n   👁️  Views:");
      views.forEach(({ view_name }) => console.log("   📊  " + view_name));
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("\n❌  Migration failed — transaction rolled back.");
    console.error(err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌  Connection closed.");
  }
}

migrate();