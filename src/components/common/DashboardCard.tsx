import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  to: string;
  className?: string;
  iconColor?: string;
}

export const DashboardCard = ({
  title,
  description,
  icon: Icon,
  to,
  className,
  iconColor = 'text-primary',
}: DashboardCardProps) => {
  return (
    <Link
      to={to}
      className={cn(
        'group block p-6 rounded-xl bg-card border border-border',
        'transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-1',
        'animate-slide-up',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
          'bg-primary/10 group-hover:bg-primary/20 transition-colors'
        )}>
          <Icon className={cn('h-7 w-7', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
};
