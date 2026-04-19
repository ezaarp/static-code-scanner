import { getSeverityBadgeColor } from '@/lib/utils';

interface SeverityBadgeProps {
  severity: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SeverityBadge({ severity, size = 'md' }: SeverityBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${getSeverityBadgeColor(
        severity
      )} ${sizeClasses[size]}`}
    >
      {severity.toUpperCase()}
    </span>
  );
}


