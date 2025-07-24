import React from 'react';

interface DashboardCardProps {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  colorClass?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  link?: string;
  linkText?: string;
  linkIcon?: React.ReactNode;
  status?: string;
  statusColor?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  colorClass = 'bg-white',
  action,
  children,
  link,
  linkText,
  linkIcon,
  status,
  statusColor,
}) => (
  <div className={`rounded-xl shadow-sm border border-slate-100 p-6 transition-all group hover:shadow-md ${colorClass}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="mt-2 flex items-baseline">
          <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
          {status && (
            <span className={`ml-2 text-xs font-medium text-${statusColor}-600 bg-${statusColor}-50 px-2 py-0.5 rounded-full`}>
              {status}
            </span>
          )}
        </div>
      </div>
      <div className="rounded-full p-3 bg-slate-50 group-hover:bg-slate-100 transition-colors">
        {icon}
      </div>
    </div>
    {children && <div className="mt-4">{children}</div>}
    {link && linkText && (
      <div className="mt-4 flex items-center">
        <a href={link} className={`text-sm font-medium text-${statusColor || 'indigo'}-600 hover:text-${statusColor || 'indigo'}-800 flex items-center group-hover:underline`}>
          {linkText}
          {linkIcon}
        </a>
      </div>
    )}
    {action && <div className="mt-4 flex items-center">{action}</div>}
  </div>
);

export default DashboardCard; 