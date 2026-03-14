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

export default function Deliveries() {
  const { deliveries, products, validateDelivery, addDelivery } = useInventoryStore();
  const [open, setOpen] = useState(false);

  const handleValidate = (id: string) => {
    validateDelivery(id);
    toast.success('Delivery validated — stock updated');
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productId = fd.get('product') as string;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addDelivery({
      reference: `DEL-${String(deliveries.length + 1).padStart(3, '0')}`,
      customer: fd.get('customer') as string,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      lines: [{ productId, productName: product.name, demanded: Number(fd.get('quantity')), picked: 0 }],
    });
    setOpen(false);
    toast.success('Delivery order created');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Delivery Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Outgoing shipments to customers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Delivery</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Delivery Order</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Customer</Label><Input name="customer" required placeholder="Customer name" /></div>
              <div><Label>Product</Label>
                <Select name="product" required>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Quantity</Label><Input name="quantity" type="number" min={1} required defaultValue={1} /></div>
              <Button type="submit" className="w-full">Create Delivery</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Products</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Demanded</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map(d => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{d.reference}</td>
                <td className="px-4 py-2.5 text-foreground">{d.customer}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.date}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.lines.map(l => l.productName).join(', ')}</td>
                <td className="px-4 py-2.5 text-right font-mono">{d.lines.reduce((s, l) => s + l.demanded, 0)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={d.status} /></td>
                <td className="px-4 py-2.5 text-right">
                  {d.status !== 'Validated' && d.status !== 'Cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => handleValidate(d.id)} className="text-success hover:text-success">
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
