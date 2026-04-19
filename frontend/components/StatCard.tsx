import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconElement?: ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'primary' | 'green' | 'orange' | 'red' | 'blue' | 'yellow';
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconElement,
  trend,
  color = 'primary',
}: StatCardProps) {
  const colorClasses = {
    primary: 'text-primary-500 bg-primary-50',
    green: 'text-green-500 bg-green-50',
    orange: 'text-orange-500 bg-orange-50',
    red: 'text-red-500 bg-red-50',
    blue: 'text-blue-500 bg-blue-50',
    yellow: 'text-yellow-500 bg-yellow-50',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline space-x-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        {iconElement && iconElement}
      </div>
    </div>
  );
}


