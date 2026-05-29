import { ChevronDown } from 'lucide-react';
import { activeUsersSeries } from '../../data/dashboardData';
import { AreaLineChart } from '../charts/AreaLineChart';
import { Panel } from './Panel';

export function ActiveTrendPanel() {
  return (
    <Panel title="Active Users Trend" className="trend-panel">
      <button className="panel-select" type="button">
        Last 15 Minutes
        <ChevronDown size={14} />
      </button>
      <AreaLineChart labels={activeUsersSeries.labels} series={activeUsersSeries.series} />
    </Panel>
  );
}
