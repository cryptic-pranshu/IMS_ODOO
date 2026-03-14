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

export default function Receipts() {
  const { receipts, products, validateReceipt, addReceipt } = useInventoryStore();
  const [open, setOpen] = useState(false);

  const handleValidate = (id: string) => {
    validateReceipt(id);
    toast.success('Receipt validated — stock updated');
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const productId = fd.get('product') as string;
    const product = products.find(p => p.id === productId);
    if (!product) return;
    addReceipt({
      reference: `REC-${String(receipts.length + 1).padStart(3, '0')}`,
      supplier: fd.get('supplier') as string,
      date: new Date().toISOString().split('T')[0],
      status: 'Draft',
      lines: [{ productId, productName: product.name, quantity: Number(fd.get('quantity')), received: 0 }],
    });
    setOpen(false);
    toast.success('Receipt created');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Receipts</h1>
          <p className="text-sm text-muted-foreground mt-1">Incoming goods from suppliers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Receipt</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Receipt</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Supplier</Label><Input name="supplier" required placeholder="Supplier name" /></div>
              <div><Label>Product</Label>
                <Select name="product" required>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Quantity</Label><Input name="quantity" type="number" min={1} required defaultValue={1} /></div>
              <Button type="submit" className="w-full">Create Receipt</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Supplier</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Products</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Total Qty</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.reference}</td>
                <td className="px-4 py-2.5 text-foreground">{r.supplier}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.date}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.lines.map(l => l.productName).join(', ')}</td>
                <td className="px-4 py-2.5 text-right font-mono">{r.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-2.5 text-right">
                  {r.status !== 'Validated' && r.status !== 'Cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => handleValidate(r.id)} className="text-success hover:text-success">
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
