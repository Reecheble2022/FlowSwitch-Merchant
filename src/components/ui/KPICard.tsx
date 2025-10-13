import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    positive: boolean;
  };
  icon?: ReactNode;
  sparkline?: number[];
  color?: 'green' | 'cyan' | 'accent' | 'warning';
}

export function KPICard({ title, value, trend, icon, color = 'green' }: KPICardProps) {
  const colorClasses = {
    green: 'from-brand-green/10 to-transparent border-brand-green/20',
    cyan: 'from-brand-cyan/10 to-transparent border-brand-cyan/20',
    accent: 'from-brand-accent/10 to-transparent border-brand-accent/20',
    warning: 'from-warning/10 to-transparent border-warning/20',
  };

  const iconColorClasses = {
    green: 'text-brand-green',
    cyan: 'text-brand-cyan',
    accent: 'text-brand-accent',
    warning: 'text-warning',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm p-6 shadow-soft-lg hover:shadow-glass transition-all duration-150 hover:scale-102`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand opacity-80" />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            {value}
          </p>

          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.positive ? 'text-brand-green' : 'text-error'
            }`}>
              {trend.positive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-500 text-xs ml-1">vs last month</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={`p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
