import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PanelProps {
  title: string;
  icon?: LucideIcon;
  action?: string;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, icon: Icon, action, className = '', children }: PanelProps) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <h2>
          {Icon && <Icon size={16} strokeWidth={1.8} />}
          <span>{title}</span>
        </h2>
        {action && (
          <button className="panel-action" type="button" onClick={() => setDetailOpen((open) => !open)}>
            {action}
          </button>
        )}
      </header>
      <div className="panel-body">{children}</div>
      {detailOpen && (
        <div className="panel-detail" role="status">
          <strong>{title}</strong>
          <span>Expanded summary view is ready for backend data.</span>
          <button type="button" onClick={() => setDetailOpen(false)}>Close</button>
        </div>
      )}
    </section>
  );
}
