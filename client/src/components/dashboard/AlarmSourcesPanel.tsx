import { Siren } from 'lucide-react';
import { alarmSources } from '../../data/dashboardData';
import { Sparkline } from '../charts/Sparkline';
import { Panel } from './Panel';

export function AlarmSourcesPanel() {
  return (
    <Panel title="Top Alarm Sources" icon={Siren} action="View All" className="alarm-panel">
      <table className="compact-table alarm-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Alarms</th>
            <th>Critical</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {alarmSources.map((row) => (
            <tr key={row.source}>
              <td>{row.source}</td>
              <td>{row.alarms}</td>
              <td className="critical-count">{row.critical}</td>
              <td><Sparkline data={row.trend} accent="orange" width={68} height={22} muted /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
