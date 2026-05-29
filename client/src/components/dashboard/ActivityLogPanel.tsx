import { Activity } from 'lucide-react';
import { activityLog } from '../../data/dashboardData';
import { Panel } from './Panel';

export function ActivityLogPanel() {
  return (
    <Panel title="User Activity Log" icon={Activity} action="View All" className="activity-panel">
      <table className="compact-table activity-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>User / ID</th>
            <th>Activity</th>
            <th>Source</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {activityLog.map((item) => (
            <tr key={`${item.time}-${item.userId}`} className={item.danger ? 'danger-row' : undefined}>
              <td>{item.time}</td>
              <td>{item.userId}</td>
              <td>{item.activity}</td>
              <td>{item.source}</td>
              <td className={`status-text status-${item.status.toLowerCase()}`}>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}
