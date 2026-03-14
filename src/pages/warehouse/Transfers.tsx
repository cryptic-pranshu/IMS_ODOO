import { useState } from 'react';
import { Plus, CheckCircle } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { WarehouseLocation } from '@/stores/inventoryStore';

const locations: WarehouseLocation[] = ['Warehouse A', 'Warehouse B', 'Rack A', 'Rack B', 'Rack C'];

export default function Transfers() {
  const { transfers, products, validateTransfer, addTransfer } = useInventoryStore();
  const [open, setOpen] = useState(false);

  const handleValidate = (id: string) => {
    validateTransfer(id);
    toast.success('Transfer validated');
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productId = fd.get('product') as string;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addTransfer({
      reference: `INT-${String(transfers.length + 1).padStart(3, '0')}`,
      from: fd.get('from') as WarehouseLocation,
      to: fd.get('to') as WarehouseLocation,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      lines: [{ productId, productName: product.name, quantity: Number(fd.get('quantity')) }],
    });
    setOpen(false);
    toast.success('Transfer created');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Internal Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">Move stock between locations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Transfer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Transfer</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From</Label>
                  <Select name="from" defaultValue="Warehouse A">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>To</Label>
                  <Select name="to" defaultValue="Warehouse B">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Product</Label>
                <Select name="product" required>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Quantity</Label><Input name="quantity" type="number" min={1} required defaultValue={1} /></div>
              <Button type="submit" className="w-full">Create Transfer</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">From</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">To</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Products</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{t.reference}</td>
                <td className="px-4 py-2.5 text-foreground">{t.from}</td>
                <td className="px-4 py-2.5 text-foreground">{t.to}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{t.lines.map(l => `${l.productName} (${l.quantity})`).join(', ')}</td>
                <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2.5 text-right">
                  {t.status !== 'Validated' && t.status !== 'Cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => handleValidate(t.id)} className="text-success hover:text-success">
                      <CheckCircle className="w-4 h-4 mr-1" /> Validate
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
