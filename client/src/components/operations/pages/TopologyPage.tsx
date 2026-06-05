import { Network, Wifi } from 'lucide-react';
import {
  type PageProps,
  ApiNotice,
  PageHeader,
  PanelFrame,
  displayValue,
  rowsFromResult,
  useNetworkElements,
} from '../shared';

export function TopologyPage({ session }: PageProps) {
  const neQuery = useNetworkElements(session);
  const rows = rowsFromResult(neQuery.result);

  return (
    <div className="ops-page">
      <PageHeader title="Topology" detail="Live network element status arranged for NOC scanning." icon={Network} count={rows.length} />
      <PanelFrame title="Network topology" icon={Wifi}>
        <ApiNotice result={neQuery.result} loading={neQuery.loading} />
        <div className="live-topology">
          {rows.map((row) => (
            <div key={`${row.neType}-${row.neId}`} className={`topology-pill ${String(row.status) === '1' ? 'is-online' : 'is-warning'}`}>
              <strong>{displayValue(row.neType)}</strong>
              <span>{displayValue(row.neName ?? row.neId)}</span>
              <small>{displayValue(row.ip)}</small>
            </div>
          ))}
        </div>
      </PanelFrame>
    </div>
  );
}

