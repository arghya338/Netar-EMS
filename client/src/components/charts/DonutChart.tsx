import type { RanStatus } from '../../types/dashboard';
import { accentStroke } from './chartUtils';

interface DonutChartProps {
  statuses: RanStatus[];
}

export function DonutChart({ statuses }: DonutChartProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg className="donut-chart" viewBox="0 0 112 112" aria-label="RAN site health chart">
        <circle cx="56" cy="56" r={radius} className="donut-track" />
        {statuses.map((status) => {
          const value = Number.parseInt(status.share.replace(/\D/g, ''), 10);
          const dash = (value / 100) * circumference;
          const segment = (
            <circle
              key={status.label}
              cx="56"
              cy="56"
              r={radius}
              className="donut-segment"
              stroke={accentStroke[status.accent]}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash + 3;
          return segment;
        })}
      </svg>
      <div className="donut-center">
        <span>Total Sites</span>
        <strong>20</strong>
      </div>
    </div>
  );
}
