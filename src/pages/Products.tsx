import { useState, useEffect } from 'react'; // Added useEffect here
import { Plus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── Types ──────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  uom: string;
  current_stock: number;
  reorder_level: number;
  location?: string;
  cost_price?: number;
  selling_price?: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);

  // ── 1. Fetch live products from Neon via your Express server ─────────────
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/kpi/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── 2. Filter Logic ──────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) || 
                        p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  
  const newProduct = {
    sku: fd.get('sku'),
    name: fd.get('name'),
    category: fd.get('category'),
    uom: fd.get('uom'),
    stock: Number(fd.get('stock')),
    reorderLevel: Number(fd.get('reorderLevel'))
  };

  try {
    const res = await fetch("http://localhost:3000/api/kpi/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });

    if (res.ok) {
      setOpen(false);
      fetchProducts(); // Refresh the list automatically
    } else {
      alert("Error adding product. Check if SKU is unique.");
    }
  } catch (err) {
    console.error("Add Product Error:", err);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products managed (Live from Neon)</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SKU or Name..." className="pl-9" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Raw Material">Raw Material</SelectItem>
            <SelectItem value="Furniture">Furniture</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card rounded-lg overflow-hidden border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-mono text-xs text-primary">{p.sku}</td>
                <td className="px-4 py-2.5 text-foreground font-medium">{p.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.category}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">{p.current_stock}</td>
                <td className="px-4 py-2.5">
                  {p.current_stock <= p.reorder_level ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-destructive/15 text-destructive">Low Stock</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-success/15 text-success">In Stock</span>
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
