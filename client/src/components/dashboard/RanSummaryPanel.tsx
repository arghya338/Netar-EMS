import { RadioTower } from 'lucide-react';
import { ranMetrics, ranStatuses } from '../../data/dashboardData';
import { DonutChart } from '../charts/DonutChart';
import { Panel } from './Panel';

export function RanSummaryPanel() {
  return (
    <Panel title="RAN / Site Summary" icon={RadioTower} className="ran-panel">
      <div className="ran-content">
        <DonutChart statuses={ranStatuses} />
        <div className="ran-status-list">
          {ranStatuses.map((status) => (
            <div className="ran-status-row" key={status.label}>
              <span><i className={`status-dot ${status.accent}`} />{status.label}</span>
              <strong>{status.count} {status.share}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="ran-metrics">
        {ranMetrics.map((metric) => (
          <div className="ran-metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.delta === '-' ? '-' : `+ ${metric.delta}`}</em>
            <small>vs last 15 min</small>
          </div>
        ))}
      </div>
    </Panel>
  );
}
