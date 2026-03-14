import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ClipboardList, BookOpen, LogOut, ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import { useInventoryStore } from '@/stores/inventoryStore';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Products', icon: Package, path: '/products' },
  {
    label: 'Warehouse', icon: Warehouse, children: [
      { label: 'Receipts', icon: ArrowDownToLine, path: '/warehouse/receipts' },
      { label: 'Deliveries', icon: ArrowUpFromLine, path: '/warehouse/deliveries' },
      { label: 'Transfers', icon: ArrowLeftRight, path: '/warehouse/transfers' },
      { label: 'Adjustments', icon: SlidersHorizontal, path: '/warehouse/adjustments' },
    ]
  },
  { label: 'Stock Ledger', icon: BookOpen, path: '/stock-ledger' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Warehouse');
  const location = useLocation();
  const { logout, currentUser } = useInventoryStore();

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-150 z-50 ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Warehouse className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-foreground font-semibold text-sm">IMS Pro</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded hover:bg-sidebar-accent text-sidebar-foreground transition-colors duration-150"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          if (item.children) {
            const isExpanded = expandedGroup === item.label;
            const isActive = item.children.some(c => location.pathname === c.path);
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpandedGroup(isExpanded ? null : item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${isActive ? 'text-foreground' : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'}`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                </button>
                {isExpanded && !collapsed && (
                  <div className="ml-4 pl-3 border-l border-sidebar-border space-y-0.5 mt-0.5">
                    {item.children.map(child => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${location.pathname === child.path
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'}`}
                      >
                        <child.icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent'}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        {!collapsed && currentUser && (
          <div className="px-3 mb-2">
            <p className="text-xs text-foreground font-medium truncate">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent transition-colors duration-150"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
