import { ExternalLink, Filter, X } from 'lucide-react';
import { incidents, liveAlerts } from '../../data/overviewData';
import type { TopologyNode } from '../../types/dashboard';

interface RightRailProps {
  selectedNode: TopologyNode | null;
  mode: 'alerts' | 'node';
  onCloseNode: () => void;
}

export function RightRail({ selectedNode, mode, onCloseNode }: RightRailProps) {
  return (
    <aside className="right-rail" aria-label="Operational details">
      {mode === 'node' && selectedNode ? (
        <section className="rail-card node-detail-rail">
          <header className="rail-header">
            <h2>Node Details</h2>
            <button type="button" aria-label="Close node details" onClick={onCloseNode}>
              <X size={15} />
            </button>
          </header>
          <div className="node-detail-summary">
            <span className={`node-status-badge ${selectedNode.status}`}>{selectedNode.status}</span>
            <strong>{selectedNode.label}</strong>
            <small>{selectedNode.role}</small>
          </div>
          <dl className="node-detail-grid">
            <div>
              <dt>CPU</dt>
              <dd>{selectedNode.metrics.cpu}</dd>
            </div>
            <div>
              <dt>Memory</dt>
              <dd>{selectedNode.metrics.memory}</dd>
            </div>
            <div>
              <dt>Sessions</dt>
              <dd>{selectedNode.metrics.sessions}</dd>
            </div>
            <div>
              <dt>Interfaces</dt>
              <dd>{selectedNode.metrics.interfaces.join(', ')}</dd>
            </div>
          </dl>
          <div className="node-detail-section">
            <span>Last Event</span>
            <p>{selectedNode.metrics.lastEvent}</p>
          </div>
          <div className="node-detail-section">
            <span>Related Alerts</span>
            {selectedNode.metrics.relatedAlerts.map((alert) => (
              <p key={alert}>{alert}</p>
            ))}
          </div>
        </section>
      ) : (
        <section className="rail-card live-alerts-card">
          <header className="rail-header">
            <h2>Live Alerts</h2>
            <div>
              <button type="button" aria-label="Filter alerts"><Filter size={15} /></button>
              <button type="button" aria-label="Open alerts"><ExternalLink size={15} /></button>
            </div>
          </header>
          <div className="alert-list">
            {liveAlerts.map((alert) => (
              <article className="alert-row" key={alert.id}>
                <i className={`status-dot ${alert.accent}`} />
                <div>
                  <strong>{alert.title}</strong>
                  <span><b className={`text-${alert.accent}`}>{alert.severity}</b> · {alert.source}</span>
                  <p>{alert.description}</p>
                  <small>{alert.timestamp}</small>
                </div>
                <time>{alert.age}</time>
              </article>
            ))}
          </div>
          <button className="rail-link-button" type="button">View all alerts</button>
        </section>
      )}

      <section className="rail-card incidents-card">
        <header className="rail-header">
          <h2>Incidents & Maintenance</h2>
        </header>
        <div className="incident-list">
          {incidents.map((incident) => (
            <article className="incident-row" key={incident.id}>
              <i className={`status-dot ${incident.accent}`} />
              <div>
                <strong>{incident.title}</strong>
                <p>{incident.detail}</p>
              </div>
              <span className={`incident-status status-${incident.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {incident.status}
              </span>
            </article>
          ))}
        </div>
        <button className="rail-link-button" type="button">View all incidents</button>
      </section>
    </aside>
  );
}
