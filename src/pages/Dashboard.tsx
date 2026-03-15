import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KPICard } from '@/components/dashboard/KPICard';
import { useInventoryStore } from '@/stores/inventoryStore';

// For local dev, hardcoded to 3000. In production, this should come from VITE_API_URL.
const API_BASE = 'http://localhost:3000';

interface LiveKPIs {
  totalProducts: number;
  lowStockItems: number;
}

export default function Dashboard() {
  const [liveKPIs, setLiveKPIs] = useState<LiveKPIs | null>(null);
  const [recentMoves, setRecentMoves] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [kpiError, setKpiError] = useState<string | null>(null);

  const { receipts = [], deliveries = [] } = useInventoryStore();

  const fetchKPIs = useCallback(async () => {
    setKpiLoading(true);
    setKpiError(null);
    try {
      const [kpiRes, movesRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}/api/kpi/summary`),
        fetch(`${API_BASE}/api/kpi/recent-moves`),
        fetch(`${API_BASE}/api/kpi/trends`)
      ]);

      if (!kpiRes.ok || !movesRes.ok || !trendRes.ok) throw new Error('Failed to fetch from server');

      const kpiData = await kpiRes.json();
      const movesData = await movesRes.json();
      const trends = await trendRes.json();

      setLiveKPIs(kpiData);
      setRecentMoves(Array.isArray(movesData) ? movesData : []);
      setTrendData(Array.isArray(trends) ? trends : []);
    } catch (err: any) {
      console.error('Dashboard Fetch Error:', err);
      setKpiError(err.message);
    } finally {
      setKpiLoading(false);
    }
  }, []);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);

  const totalStock = kpiLoading ? '...' : (liveKPIs?.totalProducts ?? 0).toLocaleString();
  const lowStock = kpiLoading ? '...' : (liveKPIs?.lowStockItems ?? 0);
  const pendingR = receipts?.filter(r => r.status !== 'Validated').length ?? 0;
  const pendingD = deliveries?.filter(d => d.status !== 'Validated').length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
        <button onClick={fetchKPIs} className="p-2 hover:bg-muted rounded-full transition-all active:scale-95">
          <RefreshCcw className={`w-4 h-4 text-primary ${kpiLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Stock" value={totalStock} icon={Package} accentColor="primary" trend={{ value: 'Live from Neon', positive: true }} />
        <KPICard title="Low Stock Alerts" value={lowStock} icon={AlertTriangle} accentColor="destructive" subtitle={`${lowStock} items need reorder`} />
        <KPICard title="Pending Receipts" value={pendingR} icon={ArrowDownToLine} accentColor="warning" />
        <KPICard title="Pending Deliveries" value={pendingD} icon={ArrowUpFromLine} accentColor="success" />
      </div>

      {/* Cool AF Chart Section — Animation Fix Included */}
<div className="glass-card rounded-xl p-6 border border-border bg-card/50 backdrop-blur-sm">
  <h2 className="text-sm font-medium mb-6 flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
    Inventory Movement Trends (7D)
  </h2>
  <div className="h-[320px] w-full">
    {/* Only render the chart when data is ready to trigger the glide animation */}
    {!kpiLoading && trendData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={15} />
          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-10}/>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
            cursor={{ stroke: '#334155', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="inbound" 
            stroke="#3b82f6" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorInbound)" 
            isAnimationActive={true}
            animationDuration={2500} // Increased for a slower, smoother glide
            animationEasing="ease-in-out"
          />
          <Area 
            type="monotone" 
            dataKey="outbound" 
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorOutbound)" 
            isAnimationActive={true}
            animationDuration={2500}
            animationEasing="ease-in-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground animate-pulse">
        Synchronizing with Neon...
      </div>
    )}
  </div>
</div>

      {/* Recent Stock Moves Table */}
      <div className="glass-card rounded-xl p-5 border border-border bg-card/30">
        <h2 className="text-sm font-medium mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground">
                <th className="pb-3 px-2 font-medium">Reference</th>
                <th className="pb-3 px-2 font-medium">Product</th>
                <th className="pb-3 px-2 font-medium text-right">Qty</th>
                <th className="pb-3 px-2 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentMoves.map((move, i) => (
                <tr key={i} className="border-b border-border/20 hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-2 font-mono text-xs text-blue-400">{move.reference}</td>
                  <td className="py-4 px-2">
                    <div className="font-medium text-foreground">{move.product}</div>
                    <div className="text-[10px] text-muted-foreground">{move.sku}</div>
                  </td>
                  <td className={`py-4 px-2 text-right font-mono font-bold ${move.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {move.quantity > 0 ? `+${move.quantity}` : move.quantity}
                  </td>
                  <td className="py-4 px-2 text-right text-muted-foreground text-xs">{move.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}