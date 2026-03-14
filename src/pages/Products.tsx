import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductCategory, UnitOfMeasure, WarehouseLocation } from '@/stores/inventoryStore';

export default function Products() {
  const { products, addProduct } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addProduct({
      sku: fd.get('sku') as string,
      name: fd.get('name') as string,
      category: fd.get('category') as ProductCategory,
      uom: fd.get('uom') as UnitOfMeasure,
      stock: Number(fd.get('stock')),
      reorderLevel: Number(fd.get('reorderLevel')),
      reorderQty: Number(fd.get('reorderQty')),
      location: fd.get('location') as WarehouseLocation,
      costPrice: Number(fd.get('costPrice')),
      sellingPrice: Number(fd.get('sellingPrice')),
    });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products managed</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>New Product</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>SKU</Label><Input name="sku" required placeholder="ELC-004" className="font-mono" /></div>
                <div><Label>Name</Label><Input name="name" required placeholder="Product Name" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Category</Label>
                  <Select name="category" defaultValue="Electronics">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Electronics', 'Furniture', 'Raw Materials', 'Consumables', 'Packaging'] as const).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Unit</Label>
                  <Select name="uom" defaultValue="Units">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Units', 'Kg', 'Liters', 'Meters', 'Boxes'] as const).map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Stock</Label><Input name="stock" type="number" defaultValue={0} /></div>
                <div><Label>Reorder Level</Label><Input name="reorderLevel" type="number" defaultValue={50} /></div>
                <div><Label>Reorder Qty</Label><Input name="reorderQty" type="number" defaultValue={100} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Location</Label>
                  <Select name="location" defaultValue="Warehouse A">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Warehouse A', 'Warehouse B', 'Rack A', 'Rack B', 'Rack C'] as const).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Cost Price</Label><Input name="costPrice" type="number" step="0.01" defaultValue={0} /></div>
                <div><Label>Sell Price</Label><Input name="sellingPrice" type="number" step="0.01" defaultValue={0} /></div>
              </div>
              <Button type="submit" className="w-full">Create Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(['Electronics', 'Furniture', 'Raw Materials', 'Consumables', 'Packaging'] as const).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Location</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Stock</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Reorder Lvl</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Cost</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Sell</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors duration-150">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{p.sku}</td>
                <td className="px-4 py-2.5 text-foreground font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.location}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">{p.stock.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{p.reorderLevel}</td>
                <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">${p.costPrice.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">${p.sellingPrice.toFixed(2)}</td>
                <td className="px-4 py-2.5">
                  {p.stock <= p.reorderLevel ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/15 text-destructive">Low Stock</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/15 text-success">In Stock</span>
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
