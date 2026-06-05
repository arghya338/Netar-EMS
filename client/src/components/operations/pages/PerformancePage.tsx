import { Activity, AlertTriangle, BarChart3, Gauge } from 'lucide-react';
import { useMemo } from 'react';
import {
  type PageProps,
  ApiNotice,
  DataTable,
  PageHeader,
  PanelFrame,
  ThroughputTrend,
  collectNumbers,
  pageEndpointCount,
  rowsFromResult,
  useApiQuery,
} from '../shared';

export function PerformancePage({ session }: PageProps) {
  const titles = useApiQuery(session, '/neData/kpi/title', { neType: 'AMF' });
  const upfFlow = useApiQuery(session, '/neData/upf/totalFlow', { neId: '001', day: 0 });
  const now = useMemo(() => Date.now(), []);
  const kpiData = useApiQuery(session, '/neData/kpi/data', {
    neType: 'AMF',
    neId: '001',
    beginTime: now - 24 * 60 * 60 * 1000,
    endTime: now,
    interval: 300,
  });

  return (
    <div className="ops-page">
      <PageHeader title="Performance" detail="KPI catalog and UPF flow summary with visible contract warnings." icon={BarChart3} count={pageEndpointCount('Performance')} />
      <div className="ops-grid one-one">
        <PanelFrame title="KPI catalog" icon={Gauge}>
          <ApiNotice result={titles.result} loading={titles.loading} />
          <DataTable rows={rowsFromResult(titles.result).slice(0, 20)} columns={[{ key: 'kpiId', label: 'KPI' }, { key: 'enTitle', label: 'Title' }, { key: 'unit', label: 'Unit' }]} />
        </PanelFrame>
        <PanelFrame title="KPI data contract" icon={AlertTriangle}>
          <ApiNotice result={kpiData.result} loading={kpiData.loading} fallback="KPI data currently returns a parameter error on the live system." />
          <div className="contract-card">
            <strong>Parameter contract pending</strong>
            <span>The KPI service is connected, but the live system still rejects the selected time and interval combination.</span>
          </div>
        </PanelFrame>
        <PanelFrame title="UPF total flow" icon={Activity}>
          <ApiNotice result={upfFlow.result} loading={upfFlow.loading} fallback="UPF flow summary is unavailable for the selected NE." />
          <ThroughputTrend values={collectNumbers(upfFlow.result?.envelope?.data ?? upfFlow.result?.envelope?.rows ?? [])} loading={upfFlow.loading} />
        </PanelFrame>
      </div>
    </div>
  );
}
