import { Download } from 'lucide-react';
import {
  type PageProps,
  ENDPOINTS,
  PageHeader,
  PanelFrame,
  RiskBadge,
} from '../shared';

export function ReportsPage({ onOpenAction }: PageProps) {
  const exports = ENDPOINTS.filter((endpoint) => endpoint.risk === 'export');
  return (
    <div className="ops-page">
      <PageHeader title="Reports" detail="Explicit export center. Exports never run automatically during page load." icon={Download} count={exports.length} />
      <PanelFrame title="Export endpoints" icon={Download}>
        <div className="endpoint-grid">
          {exports.map((endpointMeta) => (
            <div key={endpointMeta.path} className="endpoint-card">
              <RiskBadge risk={endpointMeta.risk} />
              <code>{endpointMeta.method} {endpointMeta.path}</code>
              <span>{endpointMeta.summary}</span>
              <button type="button" onClick={() => onOpenAction({ title: endpointMeta.summary, method: endpointMeta.method, path: endpointMeta.path, summary: 'Exports live data. Use explicit filtered action only.', risk: endpointMeta.risk })}>
                Prepare export
              </button>
            </div>
          ))}
        </div>
      </PanelFrame>
    </div>
  );
}
