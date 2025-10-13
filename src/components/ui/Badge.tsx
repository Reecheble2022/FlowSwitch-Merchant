import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    success: 'bg-success/10 text-success dark:bg-success/20 dark:text-success border border-success/20',
    warning: 'bg-warning/10 text-warning dark:bg-warning/20 dark:text-warning border border-warning/20',
    error: 'bg-error/10 text-error dark:bg-error/20 dark:text-error border border-error/20',
    info: 'bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20 dark:text-brand-cyan border border-brand-accent/20',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
