import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/stores/inventoryStore';

const statusStyles: Record<OrderStatus, string> = {
  Draft: 'bg-muted text-muted-foreground',
  Waiting: 'bg-warning/15 text-warning',
  Ready: 'bg-primary/15 text-primary',
  Validated: 'bg-success/15 text-success',
  Cancelled: 'bg-destructive/15 text-destructive',
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', statusStyles[status], className)}>
      {status}
    </span>
  );
}
