const express = require('express');
const cors    = require('cors');
const kpiRoutes = require('./kpiRoutes.cjs');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/kpi', kpiRoutes);

// ─── Local dev only ──────────────────────────────────────────────────────────
// Vercel runs this file as a serverless function — calling app.listen() there
// causes the invocation to hang. Gate it to local development only.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Dev server running at http://localhost:${PORT}`);
  });
}

// Vercel needs the Express app exported as the default export.
module.exports = app;
