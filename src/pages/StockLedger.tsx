import { useState } from 'react';
import { Search } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockLedger() {
  const { moves } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = moves.filter(m => {
    const matchSearch = m.product.toLowerCase().includes(search.toLowerCase()) || m.sku.toLowerCase().includes(search.toLowerCase()) || m.reference.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Stock Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete move history across all operations</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search moves..." className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Receipt">Receipt</SelectItem>
            <SelectItem value="Delivery">Delivery</SelectItem>
            <SelectItem value="Internal Transfer">Internal Transfer</SelectItem>
            <SelectItem value="Adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground font-mono">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">From</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">To</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Qty</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{m.reference}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{m.date}</td>
                <td className="px-4 py-2.5 text-foreground">{m.type}</td>
                <td className="px-4 py-2.5 text-foreground font-medium">{m.product}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{m.sku}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{m.from}</td>
                <td className="px-4 py-2.5 text-muted-foreground text-xs">{m.to}</td>
                <td className="px-4 py-2.5 text-right font-mono">{m.quantity}</td>
                <td className="px-4 py-2.5"><StatusBadge status={m.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
