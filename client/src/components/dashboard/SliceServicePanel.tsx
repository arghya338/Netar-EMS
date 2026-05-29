import { Network } from 'lucide-react';
import { sliceFootStats, sliceKpis } from '../../data/dashboardData';
import { accentStroke } from '../charts/chartUtils';
import { Panel } from './Panel';

export function SliceServicePanel() {
  return (
    <Panel title="Slice & Service KPIs" icon={Network} action="View All" className="slice-panel">
      <div className="slice-head">
        <span>Slice</span>
        <span>Sessions</span>
        <span>Throughput</span>
      </div>
      <div className="slice-list">
        {sliceKpis.map((item) => (
          <div className="slice-row" key={item.name}>
            <strong>{item.name}</strong>
            <div className="slice-bar-wrap">
              <span>{item.sessions}</span>
              <div className="slice-bar">
                <i style={{ width: `${Math.min(item.percent + 12, 100)}%`, background: accentStroke[item.accent] }} />
              </div>
            </div>
            <span>{item.throughput}</span>
            <div
              className="slice-ring"
              style={{
                background: `conic-gradient(${accentStroke[item.accent]} ${item.percent * 3.6}deg, rgba(39,54,72,.75) 0deg)`,
              }}
            >
              <b>{item.percent}%</b>
            </div>
          </div>
        ))}
      </div>
      <div className="slice-foot-grid">
        {sliceFootStats.map((stat) => (
          <div className="slice-foot-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <em>+ {stat.delta}</em>
          </div>
        ))}
      </div>
    </Panel>
  );
}
