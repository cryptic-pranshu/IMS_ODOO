import { Package, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KPICard } from '@/components/dashboard/KPICard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useInventoryStore } from '@/stores/inventoryStore';
import DashboardKPIs from "@/components/Dashboard/Dashboardkpis";
const chartData = [
  { date: 'Mar 8', inbound: 320, outbound: 180 },
  { date: 'Mar 9', inbound: 450, outbound: 290 },
  { date: 'Mar 10', inbound: 200, outbound: 350 },
  { date: 'Mar 11', inbound: 580, outbound: 420 },
  { date: 'Mar 12', inbound: 350, outbound: 280 },
  { date: 'Mar 13', inbound: 620, outbound: 510 },
  { date: 'Mar 14', inbound: 500, outbound: 390 },
];

export default function Dashboard() {
  const { products, moves, receipts, deliveries } = useInventoryStore();

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;
  const pendingReceipts = receipts.filter(r => r.status !== 'Validated' && r.status !== 'Cancelled').length;
  const pendingDeliveries = deliveries.filter(d => d.status !== 'Validated' && d.status !== 'Cancelled').length;

  const recentAlerts = [
    ...products.filter(p => p.stock <= p.reorderLevel).map(p => ({
      id: p.id, message: `${p.name} (${p.sku}) below reorder level`, type: 'warning' as const, time: 'Now'
    })),
    ...moves.slice(0, 3).map(m => ({
      id: m.id, message: `${m.type}: ${m.product} — ${m.quantity} units`, type: m.status === 'Validated' ? 'success' as const : 'info' as const, time: m.date.split(' ')[1] || m.date
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time inventory overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Stock" value={totalStock.toLocaleString()} icon={Package} accentColor="primary" trend={{ value: '+12.5% this week', positive: true }} />
        <KPICard title="Low Stock Alerts" value={lowStockCount} icon={AlertTriangle} accentColor="destructive" subtitle={`${lowStockCount} items need reorder`} />
        <KPICard title="Pending Receipts" value={pendingReceipts} icon={ArrowDownToLine} accentColor="warning" subtitle="Awaiting validation" />
        <KPICard title="Pending Deliveries" value={pendingDeliveries} icon={ArrowUpFromLine} accentColor="success" subtitle="In progress" />
      </div>

      {/* Chart + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Live Inventory Movement</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 60%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
              <XAxis dataKey="date" stroke="hsl(240, 5%, 65%)" fontSize={12} />
              <YAxis stroke="hsl(240, 5%, 65%)" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(240, 6%, 9.4%)', border: '1px solid hsl(240, 4%, 16%)', borderRadius: '6px', fontSize: '12px', color: 'hsl(0, 0%, 98%)' }} />
              <Area type="monotone" dataKey="inbound" stroke="hsl(239, 84%, 67%)" fill="url(#inboundGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="outbound" stroke="hsl(160, 60%, 45%)" fill="url(#outboundGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-0.5 bg-primary rounded" /> Inbound</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-0.5 bg-success rounded" /> Outbound</div>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {recentAlerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 text-xs">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === 'warning' ? 'bg-warning' : alert.type === 'success' ? 'bg-success' : 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-foreground truncate">{alert.message}</p>
                  <p className="text-muted-foreground mt-0.5">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Moves */}
      <div className="glass-card rounded-lg p-5">
        <h2 className="text-sm font-medium text-foreground mb-4">Recent Stock Moves</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 text-xs font-medium text-muted-foreground">Reference</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Date</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Type</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Product</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground font-mono">SKU</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Qty</th>
                <th className="pb-2 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {moves.slice(0, 5).map(move => (
                <tr key={move.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                  <td className="py-2.5 font-mono text-xs text-primary">{move.reference}</td>
                  <td className="py-2.5 text-muted-foreground">{move.date}</td>
                  <td className="py-2.5 text-foreground">{move.type}</td>
                  <td className="py-2.5 text-foreground">{move.product}</td>
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">{move.sku}</td>
                  <td className="py-2.5 text-right font-mono">{move.quantity}</td>
                  <td className="py-2.5"><StatusBadge status={move.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
