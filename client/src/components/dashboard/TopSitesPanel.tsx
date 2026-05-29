import { topSites } from '../../data/dashboardData';

export function TopSitesPanel() {
  return (
    <section className="panel top-sites-panel">
      <header className="panel-header">
        <h2>Top 5 gNB Sites by Active Users (5G)</h2>
      </header>
      <div className="panel-body">
        <div className="top-sites-head">
          <span>Site</span>
          <span>Active Users</span>
        </div>
        <div className="top-sites-list">
          {topSites.map((site) => (
            <div className="top-site-row" key={site.site}>
              <span>{site.site}</span>
              <div>
                <i><b style={{ width: `${site.percent}%` }} /></i>
              </div>
              <strong>{site.users}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
