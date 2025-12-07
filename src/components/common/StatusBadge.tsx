import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'procesando' | 'completado' | 'error';
  className?: string;
}

const statusConfig = {
  procesando: {
    label: 'Procesando',
    className: 'status-processing',
  },
  completado: {
    label: 'Completado',
    className: 'status-completed',
  },
  error: {
    label: 'Error',
    className: 'status-error',
  },
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const config = statusConfig[status];

  return (
    <span className={cn('status-badge', config.className, className)}>
      {status === 'procesando' && (
        <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse mr-1.5" />
      )}
      {config.label}
    </span>
  );
};
