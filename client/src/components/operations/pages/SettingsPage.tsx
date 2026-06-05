import { ClipboardList, Server, Settings } from 'lucide-react';
import {
  type PageProps,
  ENDPOINTS,
  EndpointStatusBadge,
  MUTATIONS_ENABLED,
  PageHeader,
  PanelFrame,
  RiskBadge,
  endpointCount,
} from '../shared';

export function SettingsPage({ session }: PageProps) {
  return (
    <div className="ops-page">
      <PageHeader title="Settings" detail="Environment configuration, service health, feature flags, and action safety labels." icon={Settings} count={endpointCount} />
      <div className="ops-grid one-one">
        <PanelFrame title="Environment" icon={Server}>
          <div className="settings-stack">
            <label>
              Service base URL
              <input value={session.baseUrl} readOnly />
            </label>
            <div className="settings-policy-card">
              <span>Live-changing actions</span>
              <strong>{MUTATIONS_ENABLED ? 'Enabled by environment' : 'Disabled by environment'}</strong>
              <p>Set <code>VITE_NETAR_ENABLE_MUTATIONS</code> only for an approved maintenance window or lab environment.</p>
            </div>
          </div>
        </PanelFrame>
        <PanelFrame title="Endpoint matrix" icon={ClipboardList}>
          <div className="endpoint-matrix">
            {ENDPOINTS.map((endpointMeta) => (
              <div key={`${endpointMeta.method}-${endpointMeta.path}`}>
                <code>{endpointMeta.method} {endpointMeta.path}</code>
                <RiskBadge risk={endpointMeta.risk} />
                <EndpointStatusBadge status={endpointMeta.liveStatus} />
              </div>
            ))}
          </div>
        </PanelFrame>
      </div>
    </div>
  );
}
