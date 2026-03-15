import { create } from 'zustand';

export type ProductCategory = 'Electronics' | 'Furniture' | 'Raw Materials' | 'Consumables' | 'Packaging';
export type UnitOfMeasure = 'Units' | 'Kg' | 'Liters' | 'Meters' | 'Boxes';
export type WarehouseLocation = 'Warehouse A' | 'Warehouse B' | 'Rack A' | 'Rack B' | 'Rack C';
export type OrderStatus = 'Draft' | 'Waiting' | 'Ready' | 'Validated' | 'Cancelled';
export type MoveType = 'Receipt' | 'Delivery' | 'Internal Transfer' | 'Adjustment';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  uom: UnitOfMeasure;
  stock: number;
  reorderLevel: number;
  reorderQty: number;
  location: WarehouseLocation;
  costPrice: number;
  sellingPrice: number;
}

export interface StockMove {
  id: string;
  date: string;
  type: MoveType;
  product: string;
  sku: string;
  from: string;
  to: string;
  quantity: number;
  status: OrderStatus;
  reference: string;
}

export interface Receipt {
  id: string;
  reference: string;
  supplier: string;
  date: string;
  status: OrderStatus;
  lines: { productId: string; productName: string; quantity: number; received: number }[];
}

export interface DeliveryOrder {
  id: string;
  reference: string;
  customer: string;
  date: string;
  status: OrderStatus;
  lines: { productId: string; productName: string; demanded: number; picked: number }[];
}

export interface InternalTransfer {
  id: string;
  reference: string;
  from: WarehouseLocation;
  to: WarehouseLocation;
  date: string;
  status: OrderStatus;
  lines: { productId: string; productName: string; quantity: number }[];
}

const sampleProducts: Product[] = [
  { id: '1', sku: 'ELC-001', name: 'Circuit Board v2', category: 'Electronics', uom: 'Units', stock: 1250, reorderLevel: 200, reorderQty: 500, location: 'Warehouse A', costPrice: 12.50, sellingPrice: 24.99 },
  { id: '2', sku: 'ELC-002', name: 'LED Display Panel', category: 'Electronics', uom: 'Units', stock: 85, reorderLevel: 100, reorderQty: 300, location: 'Warehouse A', costPrice: 45.00, sellingPrice: 89.99 },
  { id: '3', sku: 'FRN-001', name: 'Standing Desk Frame', category: 'Furniture', uom: 'Units', stock: 340, reorderLevel: 50, reorderQty: 100, location: 'Warehouse B', costPrice: 120.00, sellingPrice: 249.99 },
  { id: '4', sku: 'RAW-001', name: 'Aluminum Sheet 2mm', category: 'Raw Materials', uom: 'Kg', stock: 5200, reorderLevel: 1000, reorderQty: 3000, location: 'Rack A', costPrice: 3.20, sellingPrice: 5.50 },
  { id: '5', sku: 'RAW-002', name: 'Copper Wire 0.5mm', category: 'Raw Materials', uom: 'Meters', stock: 15000, reorderLevel: 5000, reorderQty: 10000, location: 'Rack B', costPrice: 0.80, sellingPrice: 1.50 },
  { id: '6', sku: 'CON-001', name: 'Thermal Paste TG-7', category: 'Consumables', uom: 'Units', stock: 42, reorderLevel: 100, reorderQty: 200, location: 'Rack C', costPrice: 8.00, sellingPrice: 15.99 },
  { id: '7', sku: 'PKG-001', name: 'Shipping Box Large', category: 'Packaging', uom: 'Boxes', stock: 890, reorderLevel: 200, reorderQty: 500, location: 'Warehouse B', costPrice: 2.10, sellingPrice: 4.50 },
  { id: '8', sku: 'ELC-003', name: 'Power Supply 500W', category: 'Electronics', uom: 'Units', stock: 156, reorderLevel: 50, reorderQty: 100, location: 'Warehouse A', costPrice: 35.00, sellingPrice: 69.99 },
];

const sampleMoves: StockMove[] = [
  { id: 'm1', date: '2026-03-14 09:15', type: 'Receipt', product: 'Circuit Board v2', sku: 'ELC-001', from: 'Supplier: TechParts Inc', to: 'Warehouse A', quantity: 500, status: 'Validated', reference: 'REC-001' },
  { id: 'm2', date: '2026-03-14 10:30', type: 'Delivery', product: 'Standing Desk Frame', sku: 'FRN-001', from: 'Warehouse B', to: 'Customer: OfficeMax', quantity: 20, status: 'Validated', reference: 'DEL-001' },
  { id: 'm3', date: '2026-03-13 14:00', type: 'Internal Transfer', product: 'Aluminum Sheet 2mm', sku: 'RAW-001', from: 'Rack A', to: 'Rack B', quantity: 200, status: 'Validated', reference: 'INT-001' },
  { id: 'm4', date: '2026-03-13 16:45', type: 'Adjustment', product: 'Thermal Paste TG-7', sku: 'CON-001', from: 'Rack C', to: 'Rack C', quantity: -8, status: 'Validated', reference: 'ADJ-001' },
  { id: 'm5', date: '2026-03-12 11:00', type: 'Receipt', product: 'LED Display Panel', sku: 'ELC-002', from: 'Supplier: DisplayTech', to: 'Warehouse A', quantity: 150, status: 'Waiting', reference: 'REC-002' },
  { id: 'm6', date: '2026-03-12 08:30', type: 'Delivery', product: 'Power Supply 500W', sku: 'ELC-003', from: 'Warehouse A', to: 'Customer: BuildCorp', quantity: 30, status: 'Ready', reference: 'DEL-002' },
];

const sampleReceipts: Receipt[] = [
  { id: 'r1', reference: 'REC-001', supplier: 'TechParts Inc', date: '2026-03-14', status: 'Validated', lines: [{ productId: '1', productName: 'Circuit Board v2', quantity: 500, received: 500 }] },
  { id: 'r2', reference: 'REC-002', supplier: 'DisplayTech', date: '2026-03-12', status: 'Waiting', lines: [{ productId: '2', productName: 'LED Display Panel', quantity: 150, received: 0 }] },
  { id: 'r3', reference: 'REC-003', supplier: 'MetalWorks Ltd', date: '2026-03-10', status: 'Draft', lines: [{ productId: '4', productName: 'Aluminum Sheet 2mm', quantity: 1000, received: 0 }, { productId: '5', productName: 'Copper Wire 0.5mm', quantity: 5000, received: 0 }] },
];

const sampleDeliveries: DeliveryOrder[] = [
  { id: 'd1', reference: 'DEL-001', customer: 'OfficeMax', date: '2026-03-14', status: 'Validated', lines: [{ productId: '3', productName: 'Standing Desk Frame', demanded: 20, picked: 20 }] },
  { id: 'd2', reference: 'DEL-002', customer: 'BuildCorp', date: '2026-03-12', status: 'Ready', lines: [{ productId: '8', productName: 'Power Supply 500W', demanded: 30, picked: 30 }] },
  { id: 'd3', reference: 'DEL-003', customer: 'RetailHub', date: '2026-03-11', status: 'Draft', lines: [{ productId: '1', productName: 'Circuit Board v2', demanded: 100, picked: 0 }, { productId: '7', productName: 'Shipping Box Large', demanded: 100, picked: 0 }] },
];

const sampleTransfers: InternalTransfer[] = [
  { id: 't1', reference: 'INT-001', from: 'Rack A', to: 'Rack B', date: '2026-03-13', status: 'Validated', lines: [{ productId: '4', productName: 'Aluminum Sheet 2mm', quantity: 200 }] },
  { id: 't2', reference: 'INT-002', from: 'Warehouse A', to: 'Warehouse B', date: '2026-03-11', status: 'Draft', lines: [{ productId: '1', productName: 'Circuit Board v2', quantity: 50 }] },
];

interface InventoryState {
  products: Product[];
  moves: StockMove[];
  receipts: Receipt[];
  deliveries: DeliveryOrder[];
  transfers: InternalTransfer[];
  isAuthenticated: boolean;
  currentUser: { email: string; name: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  validateReceipt: (id: string) => void;
  validateDelivery: (id: string) => void;
  validateTransfer: (id: string) => void;
  addAdjustment: (productId: string, quantity: number, reason: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addReceipt: (receipt: Omit<Receipt, 'id'>) => void;
  addDelivery: (delivery: Omit<DeliveryOrder, 'id'>) => void;
  addTransfer: (transfer: Omit<InternalTransfer, 'id'>) => void;
}

// ── Persistence Helper ───────────────────────────────────────────────────────
const savedUser = localStorage.getItem('ims_auth');
const initialUser = savedUser ? JSON.parse(savedUser) : null;

export const useInventoryStore = create<InventoryState>((set, get) => ({
  products: sampleProducts,
  moves: sampleMoves,
  receipts: sampleReceipts,
  deliveries: sampleDeliveries,
  transfers: sampleTransfers,
  
  // Initialize from LocalStorage to survive refreshes
  isAuthenticated: !!initialUser,
  currentUser: initialUser,

  login: (email, password) => {
    if (email && password.length >= 4) {
      const userData = { email, name: email.split('@')[0] };
      
      // Save to disk
      localStorage.setItem('ims_auth', JSON.stringify(userData));
      
      set({ isAuthenticated: true, currentUser: userData });
      return true;
    }
    return false;
  },

  logout: () => {
    // Clear disk
    localStorage.removeItem('ims_auth');
    set({ isAuthenticated: false, currentUser: null });
  },

  validateReceipt: (id) => {
    const state = get();
    const receipt = state.receipts.find(r => r.id === id);
    if (!receipt || receipt.status === 'Validated') return;
    const updatedProducts = [...state.products];
    const newMoves: StockMove[] = [];
    receipt.lines.forEach(line => {
      const product = updatedProducts.find(p => p.id === line.productId);
      if (product) {
        product.stock += line.quantity;
        line.received = line.quantity;
        newMoves.push({
          id: `m${Date.now()}-${line.productId}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          type: 'Receipt', product: line.productName, sku: product.sku,
          from: `Supplier: ${receipt.supplier}`, to: product.location,
          quantity: line.quantity, status: 'Validated', reference: receipt.reference,
        });
      }
    });
    set({
      products: updatedProducts,
      receipts: state.receipts.map(r => r.id === id ? { ...r, status: 'Validated' as OrderStatus } : r),
      moves: [...newMoves, ...state.moves],
    });
  },

  validateDelivery: (id) => {
    const state = get();
    const delivery = state.deliveries.find(d => d.id === id);
    if (!delivery || delivery.status === 'Validated') return;
    const updatedProducts = [...state.products];
    const newMoves: StockMove[] = [];
    delivery.lines.forEach(line => {
      const product = updatedProducts.find(p => p.id === line.productId);
      if (product) {
        product.stock -= line.demanded;
        line.picked = line.demanded;
        newMoves.push({
          id: `m${Date.now()}-${line.productId}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          type: 'Delivery', product: line.productName, sku: product.sku,
          from: product.location, to: `Customer: ${delivery.customer}`,
          quantity: line.demanded, status: 'Validated', reference: delivery.reference,
        });
      }
    });
    set({
      products: updatedProducts,
      deliveries: state.deliveries.map(d => d.id === id ? { ...d, status: 'Validated' as OrderStatus } : d),
      moves: [...newMoves, ...state.moves],
    });
  },

  validateTransfer: (id) => {
    const state = get();
    const transfer = state.transfers.find(t => t.id === id);
    if (!transfer || transfer.status === 'Validated') return;
    const newMoves: StockMove[] = [];
    transfer.lines.forEach(line => {
      const product = state.products.find(p => p.id === line.productId);
      if (product) {
        newMoves.push({
          id: `m${Date.now()}-${line.productId}`,
          date: new Date().toISOString().slice(0, 16).replace('T', ' '),
          type: 'Internal Transfer', product: line.productName, sku: product.sku,
          from: transfer.from, to: transfer.to,
          quantity: line.quantity, status: 'Validated', reference: transfer.reference,
        });
      }
    });
    set({
      transfers: state.transfers.map(t => t.id === id ? { ...t, status: 'Validated' as OrderStatus } : t),
      moves: [...newMoves, ...state.moves],
    });
  },

  addAdjustment: (productId, quantity, reason) => {
    const state = get();
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    set({
      products: state.products.map(p => p.id === productId ? { ...p, stock: p.stock + quantity } : p),
      moves: [{
        id: `m${Date.now()}`,
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        type: 'Adjustment', product: product.name, sku: product.sku,
        from: product.location, to: product.location,
        quantity, status: 'Validated', reference: `ADJ-${String(state.moves.filter(m => m.type === 'Adjustment').length + 2).padStart(3, '0')}`,
      }, ...state.moves],
    });
  },

  addProduct: (product) => {
    set(state => ({
      products: [...state.products, { ...product, id: String(Date.now()) }],
    }));
  },

  addReceipt: (receipt) => {
    set(state => ({
      receipts: [...state.receipts, { ...receipt, id: String(Date.now()) }],
    }));
  },

  addDelivery: (delivery) => {
    set(state => ({
      deliveries: [...state.deliveries, { ...delivery, id: String(Date.now()) }],
    }));
  },

  addTransfer: (transfer) => {
    set(state => ({
      transfers: [...state.transfers, { ...transfer, id: String(Date.now()) }],
    }));
  },
}));