import { resources } from '../../data/dashboardData';

export function BottomStatusBar() {
  return (
    <footer className="bottom-status">
      <span>EMS Version:</span>
      <strong>2.4.1</strong>
      <div className="resource-strip">
        {resources.map((resource) => (
          <div className="resource-item" key={resource.label}>
            <span>{resource.label}</span>
            <i>
              <b className={`accent-bg-${resource.accent}`} style={{ width: `${resource.percent}%` }} />
            </i>
            <strong>{resource.value}</strong>
          </div>
        ))}
      </div>
      <span className="uptime">Uptime: <strong>15d 07:42:11</strong></span>
    </footer>
  );
}
