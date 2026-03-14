const express = require('express');
const cors = require('cors');
const kpiRoutes = require('./kpiRoutes.cjs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mount the live Neon data routes
app.use('/api/kpi', kpiRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend server is live at http://localhost:${PORT}`);
});