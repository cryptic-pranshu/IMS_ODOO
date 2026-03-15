import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ── API base ──────────────────────────────────────────────────────────────────
// In production Vercel sets this to your deployed backend URL.
// Locally it falls back to localhost:3000.
// Set it in your Vercel dashboard:  Settings → Environment Variables → VITE_API_URL
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Types ─────────────────────────────────────────────────────────────────────
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
  const [products, setProducts]         = useState<Product[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [open, setOpen]                 = useState(false);
  const [addError, setAddError]         = useState<string | null>(null);

  // ── Fetch live products from Neon ─────────────────────────────────────────
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/kpi/products`);
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  // ── Add product ───────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddError(null);
    const fd = new FormData(e.currentTarget);

    const newProduct = {
      sku:          fd.get('sku'),
      name:         fd.get('name'),
      category:     fd.get('category'),
      uom:          fd.get('uom'),
      stock:        Number(fd.get('stock')),
      reorderLevel: Number(fd.get('reorderLevel')),
    };

    try {
      const res = await fetch(`${API_BASE}/api/kpi/products`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(newProduct),
      });

      if (res.ok) {
        setOpen(false);
        fetchProducts();
      } else {
        // Surface the exact error from the server (e.g. duplicate SKU)
        const body = await res.json().catch(() => ({}));
        setAddError(body.error ?? `Error ${res.status} — please try again.`);
      }
    } catch (err) {
      console.error('Add Product Error:', err);
      setAddError('Network error — is the backend running?');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Loading…' : `${products.length} products (live from Neon)`}
          </p>
        </div>
        <Button size="sm" onClick={() => { setOpen(true); setAddError(null); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      </div>

      {/* Search & filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SKU or Name…"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Raw Material">Raw Material</SelectItem>
            <SelectItem value="Furniture">Furniture</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Loading products…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No products found.
                </td>
              </tr>
            )}
            {!loading && filtered.map(p => (
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

      {/* Add product dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="Steel Rod" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required placeholder="STL-001" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="Raw Material" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Input id="uom" name="uom" placeholder="kg" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input id="stock" name="stock" type="number" min="0" defaultValue="0" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input id="reorderLevel" name="reorderLevel" type="number" min="0" defaultValue="10" />
              </div>
            </div>
            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save Product</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
