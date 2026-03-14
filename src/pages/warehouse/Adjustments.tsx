import { useState } from 'react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Adjustments() {
  const { products, moves, addAdjustment } = useInventoryStore();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const adjustmentMoves = moves.filter(m => m.type === 'Adjustment');
  const selectedProduct = products.find(p => p.id === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity) return;
    addAdjustment(productId, Number(quantity), reason);
    toast.success('Stock adjustment recorded');
    setProductId('');
    setQuantity('');
    setReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Stock Adjustments</h1>
        <p className="text-sm text-muted-foreground mt-1">Manual overrides for physical count mismatches</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">New Adjustment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedProduct && (
              <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1">
                <p className="text-muted-foreground">Current stock: <span className="font-mono text-foreground">{selectedProduct.stock}</span></p>
                <p className="text-muted-foreground">Location: <span className="text-foreground">{selectedProduct.location}</span></p>
              </div>
            )}
            <div>
              <Label>Quantity Change</Label>
              <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="+50 or -10" required />
              <p className="text-xs text-muted-foreground mt-1">Positive = add stock, Negative = remove stock</p>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Physical count mismatch, damaged items..." rows={3} />
            </div>
            <Button type="submit" className="w-full">Record Adjustment</Button>
          </form>
        </div>

        <div className="lg:col-span-2 glass-card rounded-lg p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">Adjustment History</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Reference</th>
                <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left pb-2 text-xs font-medium text-muted-foreground">Product</th>
                <th className="text-left pb-2 text-xs font-medium text-muted-foreground font-mono">SKU</th>
                <th className="text-right pb-2 text-xs font-medium text-muted-foreground">Qty Change</th>
              </tr>
            </thead>
            <tbody>
              {adjustmentMoves.map(m => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150">
                  <td className="py-2.5 font-mono text-xs text-primary">{m.reference}</td>
                  <td className="py-2.5 text-muted-foreground">{m.date}</td>
                  <td className="py-2.5 text-foreground">{m.product}</td>
                  <td className="py-2.5 font-mono text-xs text-muted-foreground">{m.sku}</td>
                  <td className={`py-2.5 text-right font-mono ${m.quantity >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {m.quantity >= 0 ? '+' : ''}{m.quantity}
                  </td>
                </tr>
              ))}
              {adjustmentMoves.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No adjustments recorded</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
