import type { MetricCardData } from '../../types/dashboard';
import { Sparkline } from '../charts/Sparkline';

interface MetricCardProps {
  metric: MetricCardData;
  selected: boolean;
  onSelect: () => void;
}

export function MetricCard({ metric, selected, onSelect }: MetricCardProps) {
  const Icon = metric.icon;

  return (
    <button
      className={`metric-card metric-${metric.accent} ${selected ? 'is-selected' : ''}`}
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
    >
      <div className="metric-content">
        <span className="metric-title">{metric.title}</span>
        <strong>{metric.value}</strong>
        <span className="metric-delta">+ {metric.delta}</span>
        <span className="metric-caption">{metric.caption}</span>
      </div>
      <div className="metric-visual">
        <span className="metric-icon">
          <Icon size={23} strokeWidth={2.2} />
        </span>
        <Sparkline data={metric.sparkline} accent={metric.accent} />
      </div>
    </button>
  );
}
