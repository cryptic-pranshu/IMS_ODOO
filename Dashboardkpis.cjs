import { useState, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
// This MUST match the port your Express server (kpiRoutes.cjs) is running on.
const API_BASE = "http://localhost:3000"; 

export default function DashboardKPIs() {
  const [kpis, setKpis] = useState({ totalProducts: null, lowStockItems: null });
  const [status, setStatus] = useState("idle"); 
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  // ── Fetch function (Connects to your Neon-backed Express API) ──
  const fetchKPIs = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      // Calls the /api/kpi/summary route in your kpiRoutes.cjs
      const res = await fetch(`${API_BASE}/api/kpi/summary`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const data = await res.json();

      // Validate that the backend is sending the numbers we need
      if (typeof data.totalProducts !== "number" || typeof data.lowStockItems !== "number") {
        throw new Error("Unexpected response shape from /api/kpi/summary");
      }

      setKpis({ totalProducts: data.totalProducts, lowStockItems: data.lowStockItems });
      setStatus("success");
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, []);

  // ── Auto-fetch when the dashboard loads ──
  useEffect(() => {
    fetchKPIs();
  }, [fetchKPIs]);

  const isLoading = status === "loading";
  const hasError = status === "error";
  const hasData = status === "success";
  const lowStockAlert = hasData && kpis.lowStockItems > 0;

  return (
    <>
      <style>{`
        .kpi-section { font-family: sans-serif; padding: 1rem; color: white; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .kpi-card { background: #1e293b; border: 1px solid #334155; padding: 1.5rem; border-radius: 12px; }
        .kpi-card-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; }
        .kpi-card-value { font-size: 2.5rem; font-weight: bold; margin: 0.5rem 0; }
        .kpi-card--alert { border-color: #ef4444; background: #450a0a; }
        .kpi-refresh-btn { background: #3b82f6; color: white; padding: 0.5rem 1rem; border-radius: