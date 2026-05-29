import { Activity } from 'lucide-react';
import { networkFunctions } from '../../data/dashboardData';
import { Sparkline } from '../charts/Sparkline';
import { Panel } from './Panel';

export function NetworkHealthPanel() {
  return (
    <Panel title="Network Function Health" icon={Activity} action="View All" className="network-health-panel">
      <table className="compact-table health-table">
        <thead>
          <tr>
            <th>Network Function</th>
            <th>Instances</th>
            <th>Health</th>
            <th>CPU</th>
            <th>Mem</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {networkFunctions.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.instances}</td>
              <td className="healthy-cell"><span />{row.health}</td>
              <td>{row.cpu}</td>
              <td>{row.memory}</td>
              <td><Sparkline data={row.trend} accent="green" width={58} height={20} muted /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
