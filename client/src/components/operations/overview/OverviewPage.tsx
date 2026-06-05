import { Database, RefreshCw, RadioTower, Signal, Smartphone, Wifi } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  type PageProps,
  buildSeverityCounts,
  extractCount,
  extractFlowValues,
  formatNumber,
  formatThroughput,
  isOnlineNe,
  liveCountText,
  rowsFromResult,
  severityTotal,
  useApiQuery,
  useNetworkElements,
  useServerApiQuery,
} from '../shared';
import {
  ActiveFunctionsCard,
  AlarmSummaryCard,
  FunctionMixCard,
  NetworkHealthCard,
  PerformanceTrendPanel,
  RefMetricCard,
  ResourcePanel,
  ServiceMetricStrip,
  type ServiceMetric,
} from './components/OverviewCards';
import { NetworkServiceFlow } from './components/NetworkServiceFlow';
import { useFlowHistory } from './hooks';

const OVERVIEW_PAGE_SIZE = 1;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function OverviewPage(props: PageProps) {
  const { session } = props;
  const [selectedTopologyType, setSelectedTopologyType] = useState<string | null>('UPF');
  const [flowRefresh, setFlowRefresh] = useState(0);
  const now = useMemo(() => Date.now(), []);
  const dayWindow = useMemo(() => ({
    beginTime: now - ONE_DAY_MS,
    endTime: now,
  }), [now]);

  const neQuery = useNetworkElements(session);
  const alarms = useServerApiQuery(session, '/internal/alarm/list', { alarmStatus: 'Active', pageNum: 1, pageSize: 100 });
  const alarmSeverity = useServerApiQuery(session, '/internal/alarm/count/severity', { alarmStatus: 'Active' });
  const imsSessions = useApiQuery(session, '/neData/ims/session/num', { neId: '001' });
  const smfSessions = useApiQuery(session, '/neData/smf/sub/num', { neId: '001' });
  const amfUe = useApiQuery(session, '/neData/amf/ue/list', { neType: 'AMF', neId: '001', ...dayWindow, pageNum: 1, pageSize: OVERVIEW_PAGE_SIZE });
  const mmeUe = useApiQuery(session, '/neData/mme/ue/list', { neType: 'MME', neId: '001', ...dayWindow, pageNum: 1, pageSize: OVERVIEW_PAGE_SIZE });
  const amfBaseStations = useApiQuery(session, '/neData/amf/nb/list', { neType: 'AMF', neId: '001', pageNum: 1, pageSize: 50 });
  const mmeBaseStations = useApiQuery(session, '/neData/mme/nb/list', { neType: 'MME', neId: '001', pageNum: 1, pageSize: 50 });
  const flow = useApiQuery(session, '/neData/upf/totalFlow', { neId: '001', day: 0 }, true, flowRefresh);

  const rows = rowsFromResult(neQuery.result);
  const alarmRows = rowsFromResult(alarms.result);
  const alarmSeverityRows = rowsFromResult(alarmSeverity.result);
  const online = rows.filter(isOnlineNe).length;
  const offline = Math.max(0, rows.length - online);
  const severityCountsFromList = buildSeverityCounts(alarmRows);
  const severityCountsFromSummary = buildSeverityCounts(alarmSeverityRows, true);
  const severityCounts = severityTotal(severityCountsFromSummary) > 0
    ? severityCountsFromSummary
    : severityTotal(severityCountsFromList) > 0
      ? severityCountsFromList
      : { critical: 0, major: 0, minor: 0, warning: 0, normal: 0 };
  const alarmLoading = alarms.loading || alarmSeverity.loading;
  const inventoryLoading = neQuery.loading;
  const registeredUe = extractCount(amfUe.result) + extractCount(mmeUe.result);
  const activeVoiceSessions = extractCount(imsSessions.result);
  const activeDataSessions = extractCount(smfSessions.result);
  const activeBaseStations = extractCount(amfBaseStations.result) + extractCount(mmeBaseStations.result);
  const flowValues = extractFlowValues(flow.result);
  const upFlow = flowValues.up;
  const downFlow = flowValues.down;
  const flowHistory = useFlowHistory(upFlow, downFlow);

  useEffect(() => {
    const id = window.setInterval(() => setFlowRefresh((value) => value + 1), 15000);
    return () => window.clearInterval(id);
  }, []);

  const serviceMetrics: ServiceMetric[] = [
    {
      id: 'registered-ue',
      title: 'Registered UE',
      value: formatNumber(registeredUe),
      detail: `AMF ${liveCountText(amfUe.result)} · MME ${liveCountText(mmeUe.result)}`,
      icon: Smartphone,
      state: registeredUe > 0 ? 'good' : 'neutral',
      loading: amfUe.loading || mmeUe.loading,
    },
    {
      id: 'voice-sessions',
      title: 'Voice Sessions',
      value: formatNumber(activeVoiceSessions),
      detail: 'IMS online users',
      icon: Signal,
      state: activeVoiceSessions > 0 ? 'good' : 'neutral',
      loading: imsSessions.loading,
    },
    {
      id: 'data-sessions',
      title: 'Data Sessions',
      value: formatNumber(activeDataSessions),
      detail: 'SMF online users',
      icon: Database,
      state: activeDataSessions > 0 ? 'good' : 'neutral',
      loading: smfSessions.loading,
    },
    {
      id: 'base-stations',
      title: 'Base Stations',
      value: formatNumber(activeBaseStations),
      detail: `AMF ${liveCountText(amfBaseStations.result)} · MME ${liveCountText(mmeBaseStations.result)}`,
      icon: RadioTower,
      state: activeBaseStations > 0 ? 'good' : 'warning',
      loading: amfBaseStations.loading || mmeBaseStations.loading,
    },
    {
      id: 'upf-flow',
      title: 'UPF Flow',
      value: downFlow !== null || upFlow !== null ? formatThroughput(Math.max(0, downFlow ?? 0) + Math.max(0, upFlow ?? 0)) : '—',
      detail: `DL ${downFlow !== null ? formatThroughput(downFlow) : '—'} · UL ${upFlow !== null ? formatThroughput(upFlow) : '—'}`,
      icon: Wifi,
      state: (downFlow ?? 0) > 0 || (upFlow ?? 0) > 0 ? 'good' : 'neutral',
      loading: flow.loading,
    },
  ];

  return (
    <div className="ops-page overview-dashboard ref-dashboard">
      <div className="overview-title-row">
        <div>
          <h1>5G Core Network</h1>
          <span>Live operations dashboard</span>
        </div>
        <div className="overview-title-actions" aria-label="Overview status">
          <span className="overview-live-chip"><span />Live System</span>
          <button type="button" className="panel-link-button" onClick={() => window.location.reload()}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="ref-main-grid">
        <div className="ref-content">
          <div className="ref-top-grid">
            <NetworkHealthCard online={online} total={rows.length} loading={inventoryLoading} />
            <AlarmSummaryCard counts={severityCounts} loading={alarmLoading} onNavigate={props.onNavigate} />
            <ActiveFunctionsCard online={online} total={rows.length} loading={inventoryLoading} />
            <FunctionMixCard rows={rows} loading={inventoryLoading} />
          </div>

          <ServiceMetricStrip metrics={serviceMetrics} />

          <NetworkServiceFlow
            rows={rows}
            selectedType={selectedTopologyType}
            onSelectType={setSelectedTopologyType}
            baseStationCount={activeBaseStations}
            upFlow={upFlow}
            downFlow={downFlow}
            loading={inventoryLoading || flow.loading}
          />

          <div className="ref-metric-strip">
            <RefMetricCard title="Throughput (DL)" value={downFlow !== null ? formatThroughput(downFlow) : '—'} delta="Live N6 user-plane downlink" color="#2563eb" />
            <RefMetricCard title="Throughput (UL)" value={upFlow !== null ? formatThroughput(upFlow) : '—'} delta="Live N3/N6 uplink counter" color="#7c3aed" />
            <RefMetricCard title="Online Sessions" value={formatNumber(activeVoiceSessions + activeDataSessions)} delta={`IMS ${liveCountText(imsSessions.result)} · Data ${liveCountText(smfSessions.result)}`} color="#16a34a" />
            <RefMetricCard title="Offline Functions" value={formatNumber(offline)} delta={`${formatNumber(online)} currently online`} color="#ea580c" />
          </div>

          <div className="ref-bottom-grid">
            <PerformanceTrendPanel up={flowHistory[flowHistory.length - 1] ?? upFlow} down={downFlow} loading={flow.loading} />
            <ResourcePanel rows={rows} loading={inventoryLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
