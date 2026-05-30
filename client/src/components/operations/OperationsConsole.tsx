import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Database,
  Download,
  FileText,
  Filter,
  Gauge,
  HardDrive,
  Info,
  KeyRound,
  Lock,
  Network,
  Play,
  RefreshCw,
  Router,
  Search,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Terminal,
  Upload,
  UserRound,
  Wifi,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import {
  ENDPOINTS,
  MUTATIONS_ENABLED,
  createClient,
  getEndpoint,
  type ApiResult,
  type AppSession,
  type EndpointLiveStatus,
  type EndpointRisk,
  type HttpMethod,
} from '../../api/netarApi';

type ApiRow = Record<string, unknown>;

interface OperationsRouterProps {
  activeNav: string;
  searchQuery: string;
  session: AppSession;
}

interface PageProps {
  onOpenAction: (action: GuardedAction) => void;
  searchQuery: string;
  session: AppSession;
}

interface GuardedAction {
  title: string;
  method: HttpMethod;
  path: string;
  summary: string;
  risk: EndpointRisk;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
}

interface QueryState<T = unknown> {
  loading: boolean;
  result?: ApiResult<T>;
}

interface DataColumn {
  key: string;
  label: string;
  mask?: boolean;
}

const endpointCount = ENDPOINTS.length;

const defaultNe = { neType: 'IMS', neId: '001' };
const sensitiveKeys = new Set(['ki', 'opc', 'password', 'secret', 'token', 'access_token', 'authkey', 'authKey']);

const statusText: Record<EndpointLiveStatus, string> = {
  ok: 'Live OK',
  'parameter-issue': 'Contract check',
  'route-mismatch': 'Route mismatch',
  'not-tested': 'Requires lab data',
  deferred: 'Manual action',
};

const riskText: Record<EndpointRisk, string> = {
  read: 'Read-only',
  auth: 'Auth',
  export: 'Export',
  'sensitive-read': 'Sensitive read',
  'side-effect-get': 'Side-effect GET',
  mutation: 'Mutation',
  control: 'Control',
};

const tableColumns = {
  networkElement: [
    { key: 'id', label: 'Row' },
    { key: 'neType', label: 'Type' },
    { key: 'neId', label: 'NE ID' },
    { key: 'neName', label: 'Name' },
    { key: 'ip', label: 'IP' },
    { key: 'status', label: 'Status' },
  ],
  session: [
    { key: 'imsi', label: 'IMSI' },
    { key: 'msisdn', label: 'MSISDN' },
    { key: 'neId', label: 'NE ID' },
    { key: 'eventType', label: 'Event' },
    { key: 'recordType', label: 'Record' },
    { key: 'time', label: 'Time' },
  ],
  subscriber: [
    { key: 'id', label: 'ID' },
    { key: 'imsi', label: 'IMSI' },
    { key: 'msisdn', label: 'MSISDN' },
    { key: 'username', label: 'Username' },
    { key: 'ki', label: 'KI', mask: true },
    { key: 'opc', label: 'OPC', mask: true },
    { key: 'password', label: 'Password', mask: true },
  ],
  alarm: [
    { key: 'id', label: 'ID' },
    { key: 'neType', label: 'NE Type' },
    { key: 'alarmTitle', label: 'Title' },
    { key: 'origSeverity', label: 'Severity' },
    { key: 'alarmStatus', label: 'Status' },
    { key: 'eventTime', label: 'Event time' },
  ],
};

function useApiQuery<T = unknown>(
  session: AppSession,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  enabled = true,
  refreshKey?: string | number,
): QueryState<T> {
  const queryKey = JSON.stringify(query ?? {});
  const [state, setState] = useState<QueryState<T>>({ loading: enabled });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false });
      return undefined;
    }

    const controller = new AbortController();
    const client = createClient(session);
    setState((current) => ({ ...current, loading: true }));

    client.request<T>({ method: 'GET', path, query, signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) {
        setState({ loading: false, result });
      }
    });

    return () => controller.abort();
  }, [enabled, path, queryKey, refreshKey, session]);

  return state;
}

function rowsFromResult(result?: ApiResult): ApiRow[] {
  const envelope = result?.envelope;
  if (!envelope) return [];

  if (Array.isArray(envelope.rows)) {
    return envelope.rows.filter(isRecord);
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data.filter(isRecord);
  }

  if (isRecord(envelope.data)) {
    if (Array.isArray(envelope.data.rows)) {
      return envelope.data.rows.filter(isRecord);
    }
    return [envelope.data];
  }

  return [];
}

function totalFromResult(result?: ApiResult) {
  const envelope = result?.envelope;
  if (!envelope) return 0;
  if (typeof envelope.total === 'number') return envelope.total;
  if (isRecord(envelope.data) && typeof envelope.data.total === 'number') return envelope.data.total;
  return rowsFromResult(result).length;
}

function isRecord(value: unknown): value is ApiRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function displayValue(value: unknown, key?: string, mask = false) {
  if (mask || (key && sensitiveKeys.has(key))) return '••••••';
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 90);
  return String(value);
}

function getRowId(row: ApiRow) {
  return displayValue(row.id ?? row.imsi ?? row.username ?? row.neId ?? row.fileName ?? row.alarmTitle);
}

function useNetworkElements(session: AppSession) {
  return useApiQuery(session, '/ne/info/listAll', { bandStatus: true, bandHost: true });
}

function firstNe(rows: ApiRow[], type = 'IMS') {
  return rows.find((row) => row.neType === type) ?? rows.find((row) => row.neType !== 'OMC') ?? defaultNe;
}

function pageEndpointCount(page: string) {
  return ENDPOINTS.filter((endpoint) => endpoint.page === page || (page === 'Reports' && endpoint.risk === 'export')).length;
}

function statusClass(status: EndpointLiveStatus | EndpointRisk | string) {
  return status.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function PanelFrame({ title, icon: Icon, action, children }: { title: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="ops-panel">
      <header className="ops-panel-header">
        <h2>
          {Icon && <Icon size={16} />}
          {title}
        </h2>
        {action}
      </header>
      <div className="ops-panel-body">{children}</div>
    </section>
  );
}

function MetricTile({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: string }) {
  return (
    <div className={`ops-metric metric-${tone}`}>
      <span><Icon size={17} />{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function EndpointStatusBadge({ status }: { status: EndpointLiveStatus }) {
  return <span className={`status-badge endpoint-${statusClass(status)}`}>{statusText[status]}</span>;
}

function RiskBadge({ risk }: { risk: EndpointRisk }) {
  return <span className={`risk-badge risk-${statusClass(risk)}`}>{riskText[risk]}</span>;
}

function ApiNotice({ result, loading, fallback }: { result?: ApiResult; loading?: boolean; fallback?: string }) {
  if (loading) return <p className="api-notice is-loading">Loading live data...</p>;
  if (!result) return <p className="api-notice">Ready.</p>;
  if (result.ok) return <p className="api-notice is-ok">{result.envelope?.msg ?? 'Live data loaded.'}</p>;
  return <p className="api-notice is-warning">{result.envelope?.msg ?? result.error ?? fallback ?? 'The service returned a warning.'}</p>;
}

function DataTable({
  rows,
  columns,
  emptyText = 'No rows returned.',
  onSelect,
  selectedId,
  action,
}: {
  rows: ApiRow[];
  columns: DataColumn[];
  emptyText?: string;
  onSelect?: (row: ApiRow) => void;
  selectedId?: string;
  action?: (row: ApiRow) => ReactNode;
}) {
  return (
    <div className="ops-table-wrap">
      <table className="ops-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            {action && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (action ? 1 : 0)} className="empty-cell">{emptyText}</td>
            </tr>
          )}
          {rows.map((row, index) => {
            const rowId = getRowId(row);
            const active = selectedId === rowId;
            return (
              <tr
                key={`${rowId}-${index}`}
                className={active ? 'is-selected' : ''}
                onClick={() => onSelect?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} title={displayValue(row[column.key], column.key, column.mask)}>
                    {displayValue(row[column.key], column.key, column.mask)}
                  </td>
                ))}
                {action && <td onClick={(event) => event.stopPropagation()}>{action(row)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FilterStrip({ children }: { children: ReactNode }) {
  return <div className="filter-strip"><Filter size={15} />{children}</div>;
}

function ActionButton({ children, onClick, icon: Icon = Lock, variant = 'soft' }: { children: ReactNode; onClick: () => void; icon?: LucideIcon; variant?: 'soft' | 'danger' | 'primary' }) {
  return (
    <button className={`ops-action-button action-${variant}`} type="button" onClick={onClick}>
      <Icon size={14} />
      {children}
    </button>
  );
}

function DetailDrawer({ row, onClose }: { row: ApiRow | null; onClose: () => void }) {
  if (!row) return null;
  return (
    <aside className="detail-drawer">
      <header>
        <div>
          <span>Selected record</span>
          <strong>{getRowId(row)}</strong>
        </div>
        <button type="button" aria-label="Close details" onClick={onClose}><X size={16} /></button>
      </header>
      <dl>
        {Object.entries(row).slice(0, 18).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{displayValue(value, key)}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function GuardedActionModal({
  action,
  session,
  onClose,
}: {
  action: GuardedAction | null;
  session: AppSession;
  onClose: () => void;
}) {
  const [ack, setAck] = useState('');
  const [payloadText, setPayloadText] = useState('');
  const [result, setResult] = useState<ApiResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setAck('');
    setResult(null);
    setBusy(false);
    setPayloadText(action?.body === undefined ? '' : JSON.stringify(action.body, null, 2));
  }, [action]);

  if (!action) return null;

  const endpointMeta = getEndpoint(action.method, action.path) ?? {
    method: action.method,
    path: action.path,
    summary: action.summary,
    page: 'Action',
    risk: action.risk,
    liveStatus: 'not-tested' as const,
  };
  const hasPlaceholder = /\{.+\}/.test(action.path);
  const requiresPolicyEnablement = ['mutation', 'control', 'side-effect-get'].includes(endpointMeta.risk);
  const policyAllowsExecution = !requiresPolicyEnablement || MUTATIONS_ENABLED;
  const canExecute = policyAllowsExecution && ack === 'CONFIRM' && !hasPlaceholder && !busy;

  const execute = async () => {
    let parsedBody: unknown = undefined;
    if (payloadText.trim()) {
      try {
        parsedBody = JSON.parse(payloadText);
      } catch {
        setResult({ ok: false, status: 0, contentType: '', error: 'Payload must be valid JSON.' });
        return;
      }
    }

    setBusy(true);
    const client = createClient(session);
    const response = await client.request({
      method: action.method,
      path: action.path,
      query: action.query,
      body: parsedBody,
    });
    setResult(response);
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="guard-modal" role="dialog" aria-modal="true" aria-label={`${action.title} confirmation`}>
        <header>
          <div>
            <span>Operator approval required</span>
            <h2>{action.title}</h2>
          </div>
          <button type="button" aria-label="Close action" onClick={onClose}><X size={17} /></button>
        </header>
        <div className="guard-summary">
          <RiskBadge risk={endpointMeta.risk} />
          <code>{action.method} {action.path}</code>
        </div>
        <p>{action.summary}</p>
        <div className="guard-rules">
          <span><ShieldCheck size={15} /> Operator confirmation is required.</span>
          <span><Database size={15} /> Live-changing calls follow environment policy.</span>
          <span><KeyRound size={15} /> Type <b>CONFIRM</b> to continue.</span>
        </div>
        {action.body !== undefined && (
          <label className="payload-editor">
            Payload
            <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} spellCheck={false} />
          </label>
        )}
        {action.query && (
          <pre className="query-preview">{JSON.stringify(action.query, null, 2)}</pre>
        )}
        <input value={ack} onChange={(event) => setAck(event.target.value)} placeholder="Type CONFIRM" />
        <button type="button" disabled={!canExecute} onClick={execute}>
          {busy ? 'Running action...' : 'Run action'}
        </button>
        {!canExecute && (
          <small className="guard-disabled">
            {policyAllowsExecution
              ? 'Execution requires a concrete path and operator confirmation.'
              : 'Execution is disabled by environment policy for live-changing actions.'}
          </small>
        )}
        {result && (
          <div className={`guard-result ${result.ok ? 'is-ok' : 'is-warning'}`}>
            {result.envelope?.msg ?? result.error ?? `HTTP ${result.status}`}
          </div>
        )}
      </section>
    </div>
  );
}

function isOnlineNe(row: ApiRow) {
  const value = String(row.status ?? row.state ?? row.online ?? '').toLowerCase();
  return value === '1' || value === 'true' || value === 'online' || value === 'normal';
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function collectNumbers(value: unknown): number[] {
  if (Array.isArray(value)) return value.flatMap(collectNumbers);
  if (!isRecord(value)) {
    const numberValue = toNumber(value);
    return numberValue === null ? [] : [numberValue];
  }
  return Object.values(value).flatMap(collectNumbers);
}

function extractCount(result?: ApiResult) {
  const envelope = result?.envelope;
  if (!envelope) return 0;
  const direct = toNumber(envelope.total) ?? toNumber(envelope.data);
  if (direct !== null) return direct;
  if (Array.isArray(envelope.rows)) return sumRecordTotals(envelope.rows) ?? envelope.rows.length;
  if (Array.isArray(envelope.data)) return sumRecordTotals(envelope.data) ?? envelope.data.length;
  const values = collectNumbers(envelope.data);
  return values[0] ?? rowsFromResult(result).length;
}

function sumRecordTotals(rows: unknown[]) {
  const totals = rows
    .filter(isRecord)
    .map((row) => toNumber(row.total ?? row.count ?? row.alarmCount))
    .filter((value): value is number => value !== null);

  return totals.length > 0 ? totals.reduce((sum, value) => sum + value, 0) : null;
}

function hasLiveResult(result?: ApiResult) {
  return Boolean(result?.ok && result.envelope);
}

function liveCountText(result?: ApiResult) {
  return hasLiveResult(result) ? formatNumber(extractCount(result)) : '—';
}

function extractFlowValues(result?: ApiResult) {
  const data = result?.envelope?.data;
  if (isRecord(data)) {
    const up = toNumber(data.up);
    const down = toNumber(data.down);
    return {
      up,
      down,
      series: [down, up].filter((value): value is number => value !== null),
    };
  }

  const series = collectNumbers(data ?? result?.envelope?.rows ?? []);
  return {
    up: series[0] ?? null,
    down: series[1] ?? null,
    series,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)));
}

function formatFlowCounter(value: number) {
  const { value: scaled, unit } = formatFlowParts(value);
  return `${scaled} ${unit}`;
}

function formatFlowParts(value: number) {
  const abs = Math.abs(value);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let scaled = abs;
  let unitIndex = 0;

  while (scaled >= 1024 && unitIndex < units.length - 1) {
    scaled /= 1024;
    unitIndex += 1;
  }

  const decimals = unitIndex === 0 ? 0 : scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return {
    value: scaled.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: unitIndex === 0 ? 0 : Math.min(decimals, 1),
    }),
    unit: units[unitIndex],
  };
}

function formatThroughput(value: number) {
  return `${formatFlowCounter(value)}/s`;
}

function formatPercentMetric(value: unknown) {
  const numberValue = toNumber(value);
  if (numberValue === null) return '—';
  const normalized = Math.abs(numberValue) > 10_000
    ? numberValue / 1_000
    : Math.abs(numberValue) > 100
      ? numberValue / 100
      : numberValue;
  return `${normalized.toFixed(normalized >= 10 ? 1 : 2)}%`;
}

function severityKey(row: ApiRow) {
  const severity = String(row.origSeverity ?? row.severity ?? row.alarmSeverity ?? row.level ?? '').toLowerCase();
  if (severity.includes('crit') || severity === '1') return 'critical';
  if (severity.includes('major') || severity === '2') return 'major';
  if (severity.includes('minor') || severity === '3') return 'minor';
  if (severity.includes('warn') || severity === '4') return 'warning';
  return 'normal';
}

function buildSeverityCounts(rows: ApiRow[], useAggregateTotals = false) {
  const counts = { critical: 0, major: 0, minor: 0, warning: 0, normal: 0 };
  rows.forEach((row) => {
    const increment = useAggregateTotals
      ? toNumber(row.total ?? row.count ?? row.alarmCount) ?? 0
      : 1;
    counts[severityKey(row) as keyof typeof counts] += increment;
  });
  return counts;
}

function severityTotal(counts: ReturnType<typeof buildSeverityCounts>) {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function neLabel(row: ApiRow) {
  return displayValue(row.neName ?? row.neType ?? row.neId);
}

function compactStatusText(rows: ApiRow[]) {
  const online = rows.filter(isOnlineNe).length;
  const offline = Math.max(0, rows.length - online);
  return `${online} online, ${offline} offline`;
}

function OverviewStatusCard({ title, detail, tone = 'ok' }: { title: string; detail: string; tone?: 'ok' | 'warning' | 'neutral' }) {
  return (
    <div className={`overview-status-card is-${tone}`}>
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function OverviewTopology({
  rows,
  selectedType,
  onSelectType,
}: {
  rows: ApiRow[];
  selectedType: string | null;
  onSelectType: (type: string) => void;
}) {
  const types = ['OMC', 'AMF', 'AUSF', 'UDM', 'PCF', 'SMF', 'UPF'];
  const byType = types.map((type) => {
    const matches = rows.filter((row) => displayValue(row.neType).toUpperCase() === type);
    return {
      type,
      count: matches.length,
      online: matches.filter(isOnlineNe).length,
    };
  });

  if (rows.length === 0) {
    return (
      <div className="noc-topology is-empty">
        <span>No network elements available from the live inventory.</span>
      </div>
    );
  }

  const renderNode = (item: { type: string; count: number; online: number }, extraClass = '') => (
    <button
      key={item.type}
      type="button"
      className={`topology-node ${extraClass} ${item.online > 0 ? 'is-online' : 'is-offline'} ${selectedType === item.type ? 'is-selected' : ''}`}
      aria-pressed={selectedType === item.type}
      onClick={() => onSelectType(item.type)}
    >
      <strong>{item.type}</strong>
      <span>{item.online}/{item.count}</span>
    </button>
  );

  return (
    <div className="noc-topology">
      {renderNode(byType[0], 'topology-root')}
      <div className="topology-line vertical" />
      <div className="topology-row">
        {byType.slice(1, 5).map((item) => renderNode(item))}
      </div>
      <div className="topology-line horizontal" />
      <div className="topology-row is-bottom">
        {byType.slice(5).map((item) => renderNode(item))}
      </div>
    </div>
  );
}

function TopologyNodeDetails({ type, rows }: { type: string | null; rows: ApiRow[] }) {
  if (!type) {
    return (
      <aside className="topology-detail-card">
        <strong>Select a node</strong>
        <p>Choose a topology node to inspect live network-element details.</p>
      </aside>
    );
  }

  const primary = rows[0];
  const state = isRecord(primary?.serverState) ? primary.serverState : {};
  const cpu = isRecord(state.cpu) ? state.cpu : {};
  const mem = isRecord(state.mem) ? state.mem : {};
  const online = rows.filter(isOnlineNe).length;

  return (
    <aside className="topology-detail-card">
      <header>
        <span className={online > 0 ? 'is-online' : 'is-offline'} />
        <div>
          <strong>{type}</strong>
          <small>{online}/{rows.length} online</small>
        </div>
      </header>

      {rows.length === 0 ? (
        <p>No live inventory records are available for this function.</p>
      ) : (
        <>
          <dl>
            <div>
              <dt>NE Name</dt>
              <dd>{displayValue(primary.neName ?? state.neName ?? type)}</dd>
            </div>
            <div>
              <dt>IP Address</dt>
              <dd>{displayValue(primary.ip ?? state.neIP)}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{displayValue(state.version ?? primary.version)}</dd>
            </div>
            <div>
              <dt>Serial</dt>
              <dd>{displayValue(state.sn ?? primary.sn)}</dd>
            </div>
            <div>
              <dt>NE CPU</dt>
              <dd>{formatPercentMetric(cpu.nfCpuUsage)}</dd>
            </div>
            <div>
              <dt>System Memory</dt>
              <dd>{formatPercentMetric(mem.sysMemUsage)}</dd>
            </div>
          </dl>

          {rows.length > 1 && (
            <div className="topology-instance-list">
              {rows.map((row) => (
                <span key={`${displayValue(row.neType)}-${displayValue(row.neId)}-${displayValue(row.ip)}`}>
                  {displayValue(row.neName ?? row.neId)}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </aside>
  );
}

function AlarmDonut({ counts }: { counts: ReturnType<typeof buildSeverityCounts> }) {
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const fallback = total || 1;
  const critical = counts.critical / fallback * 100;
  const major = counts.major / fallback * 100;
  const minor = counts.minor / fallback * 100;
  const warning = counts.warning / fallback * 100;
  const donutStyle = {
    background: total === 0
      ? '#e8edf5'
      : `conic-gradient(#ff3f32 0 ${critical}%, #f97316 ${critical}% ${critical + major}%, #f7b51d ${critical + major}% ${critical + major + minor}%, #3b82f6 ${critical + major + minor}% ${critical + major + minor + warning}%, #20b957 ${critical + major + minor + warning}% 100%)`,
  };

  return (
    <div className="alarm-donut-layout">
      <div className="alarm-donut" style={donutStyle}>
        <div>
          <strong>{formatNumber(total)}</strong>
          <span>Total</span>
        </div>
      </div>
      <div className="alarm-legend">
        {Object.entries(counts).map(([label, value]) => (
          <div key={label} className={`legend-${label}`}>
            <span />
            <b>{label}</b>
            <em>{formatNumber(value)}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function useFlowHistory(up: number | null, down: number | null) {
  const [samples, setSamples] = useState<Array<{ time: number; total: number }>>([]);

  useEffect(() => {
    if (up === null && down === null) return;
    const point = Math.max(0, up ?? 0) + Math.max(0, down ?? 0);
    setSamples((current) => {
      const previous = current[current.length - 1];
      if (previous && previous.total === point) {
        return [...current.slice(-17), { ...previous, time: Date.now() }];
      }
      return [...current.slice(-17), { time: Date.now(), total: point }];
    });
  }, [up, down]);

  return samples
    .map((sample, index) => {
      const previous = samples[index - 1];
      if (!previous) return null;
      const elapsedSeconds = Math.max(1, (sample.time - previous.time) / 1000);
      return Math.max(0, sample.total - previous.total) / elapsedSeconds;
    })
    .filter((value): value is number => value !== null);
}

function ThroughputTrend({ values, loading }: { values: number[]; loading: boolean }) {
  const hasTraffic = values.some((value) => value > 0);

  if (values.length < 2 || !hasTraffic) {
    return (
      <div className="trend-chart is-empty">
        <div className="trend-empty">
          <strong>{loading ? 'Sampling live throughput' : 'No live throughput reported'}</strong>
          <span>{loading ? 'Waiting for the next live sample.' : 'The live counter is reachable, but recent samples are 0 B/s.'}</span>
        </div>
      </div>
    );
  }

  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = 100 - (value / max) * 82 - 8;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return (
    <div className="trend-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="UPF throughput trend">
        <line className="trend-grid-line" x1="0" x2="100" y1="50" y2="50" />
        <polyline points={points} />
      </svg>
      <div className="trend-axis">
        <span>Earlier</span>
        <span>Peak {formatThroughput(max)}</span>
        <span>Now {formatThroughput(values[values.length - 1] ?? 0)}</span>
      </div>
    </div>
  );
}

function UpfFlowPanel({ up, down, history, loading }: { up: number | null; down: number | null; history: number[]; loading: boolean }) {
  const items = [
    { label: 'N3 uplink', value: up, className: 'uplink' },
    { label: 'N6 downlink', value: down, className: 'downlink' },
  ];
  const max = Math.max(...items.map((item) => Math.abs(item.value ?? 0)), 1);
  const hasTraffic = items.some((item) => (item.value ?? 0) > 0);
  const latestRate = history[history.length - 1] ?? 0;

  if (up === null && down === null) {
    return (
      <div className="upf-flow-panel is-empty">
        <span>UPF flow counters are not available.</span>
      </div>
    );
  }

  return (
    <div className="upf-flow-panel">
      <div className="upf-flow-head">
        <div>
          <span>Total flow</span>
          <strong>{formatFlowCounter(Math.max(0, up ?? 0) + Math.max(0, down ?? 0))}</strong>
        </div>
        <div>
          <span>Live rate</span>
          <strong>{formatThroughput(latestRate)}</strong>
        </div>
      </div>
      <div className="upf-flow-summary">
        {items.map((item) => (
          <div key={item.label} className={`flow-stat ${item.className}`}>
            <span>{item.label}</span>
            {item.value === null ? (
              <strong>—</strong>
            ) : (
              <strong>
                <b>{formatFlowParts(item.value).value}</b>
                <em>{formatFlowParts(item.value).unit}</em>
              </strong>
            )}
            <div className="flow-bar" aria-hidden="true">
              <i style={{ width: `${!item.value || item.value <= 0 ? 0 : Math.max(4, Math.abs(item.value) / max * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <ThroughputTrend values={history} loading={loading} />
      <p>
        {loading
          ? 'Refreshing live UPF counters.'
          : hasTraffic
            ? 'Live UPF counters from the selected network element.'
            : 'Live counters are connected, but currently report zero UPF traffic for this NE.'}
      </p>
    </div>
  );
}

function aggregateAlarmRows(rows: ApiRow[], counts: ReturnType<typeof buildSeverityCounts>) {
  const populatedSeverities = Object.entries(counts).filter(([, value]) => value > 0);

  return rows.map((row) => {
    const total = toNumber(row.total ?? row.count ?? row.alarmCount) ?? 0;
    const severity = populatedSeverities.length === 1 ? populatedSeverities[0][0] : null;

    return {
      ne: displayValue(row.neName ?? row.neType ?? row.neId),
      type: displayValue(row.neType),
      critical: severity === 'critical' ? total : null,
      major: severity === 'major' ? total : null,
      minor: severity === 'minor' ? total : null,
      total,
    };
  });
}

function TopAlarmsTable({ rows, aggregateRows = [] }: { rows: ApiRow[]; aggregateRows?: ReturnType<typeof aggregateAlarmRows> }) {
  const grouped = rows.reduce<Record<string, { ne: string; type: string; critical: number; major: number; minor: number; total: number }>>((acc, row) => {
    const ne = neLabel(row);
    const severity = severityKey(row);
    const current = acc[ne] ?? { ne, type: displayValue(row.neType), critical: 0, major: 0, minor: 0, total: 0 };
    if (severity === 'critical') current.critical += 1;
    if (severity === 'major') current.major += 1;
    if (severity === 'minor') current.minor += 1;
    current.total += 1;
    acc[ne] = current;
    return acc;
  }, {});

  const tableRows = Object.values(grouped)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const visibleRows = tableRows.length > 0
    ? tableRows
    : aggregateRows
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  const emptyMessage = aggregateRows.length > 0
    ? 'Alarm detail list returned no rows; showing active-alarm totals by NE.'
    : 'No active alarm records available.';
  const formatCell = (value: number | null | undefined) => value === null || value === undefined ? '—' : formatNumber(value);

  return (
    <div className="compact-alarm-table">
      <table>
        <thead>
          <tr>
            <th>NE Name</th>
            <th>Type</th>
            <th>Critical</th>
            <th>Major</th>
            <th>Minor</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 && (
            <tr><td colSpan={6}>{emptyMessage}</td></tr>
          )}
          {visibleRows.map((row) => (
            <tr key={row.ne}>
              <td>{row.ne}</td>
              <td>{row.type}</td>
              <td>{formatCell(row.critical)}</td>
              <td>{formatCell(row.major)}</td>
              <td>{formatCell(row.minor)}</td>
              <td><strong>{formatNumber(row.total)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sparkline({ color = '#2f7ff7' }: { color?: string }) {
  return (
    <svg className="ref-sparkline" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points="0,25 8,22 15,23 23,18 31,20 38,13 46,16 54,10 62,14 70,9 78,15 86,12 94,17 100,11"
        style={{ stroke: color }}
      />
    </svg>
  );
}

function NetworkHealthCard({ online, total }: { online: number; total: number }) {
  const score = total > 0 ? Math.round((online / total) * 100) : 0;
  const offline = Math.max(0, total - online);
  return (
    <section className="ref-card ref-health-card">
      <header>
        <h2>Network Health Score</h2>
        <span>{score >= 80 ? 'Excellent' : score >= 60 ? 'Warning' : 'Critical'}</span>
      </header>
      <div className="ref-health-body is-compact">
        <div className="ref-health-ring" style={{ '--score': `${score}%` } as CSSProperties}>
          <strong>{score}</strong>
          <span>/100</span>
        </div>
        <div className="ref-health-copy">
          <strong><span />{online}/{total || 0} online</strong>
          <small>{offline} offline function{offline === 1 ? '' : 's'}</small>
          <div className="ref-health-bars">
            <i><b style={{ width: `${score}%` }} /></i>
            <em>{score}% operational</em>
          </div>
          <div className="ref-health-trend">
            <span>Health trend</span>
            <Sparkline color="#ff5b1f" />
          </div>
        </div>
      </div>
    </section>
  );
}

function AlarmSummaryCard({ counts }: { counts: ReturnType<typeof buildSeverityCounts> }) {
  const items = [
    { label: 'Critical', value: counts.critical, className: 'critical', icon: ShieldAlert },
    { label: 'Major', value: counts.major, className: 'major', icon: AlertTriangle },
    { label: 'Minor', value: counts.minor, className: 'minor', icon: AlertCircle },
    { label: 'Warning', value: counts.warning, className: 'warning', icon: Info },
  ];

  return (
    <section className="ref-card ref-alarm-summary">
      <header>
        <div>
          <h2>Alarm Summary</h2>
          <span>{formatNumber(severityTotal(counts))} active alarms</span>
        </div>
        <button type="button">View all alarms <ChevronRight size={13} /></button>
      </header>
      <div className="ref-alarm-items">
        {items.map((item) => (
          <div key={item.label} className={`ref-alarm-item is-${item.className}`}>
            <span><item.icon size={13} />{item.label}</span>
            <strong>{formatNumber(item.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActiveFunctionsCard({ online, total }: { online: number; total: number }) {
  return (
    <section className="ref-card ref-active-card">
      <h2>Active Network Functions</h2>
      <div>
        <span className="ref-active-icon"><Server size={20} /></span>
        <strong>{formatNumber(online)} <small>/ {formatNumber(total)}</small></strong>
        <em>{total > 0 ? Math.round((online / total) * 100) : 0}% Online</em>
      </div>
    </section>
  );
}

function FunctionMixCard({ rows }: { rows: ApiRow[] }) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const type = displayValue(row.neType);
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});
  const total = Math.max(1, rows.length);
  const items = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([label, value], index) => ({
      label,
      value,
      percent: Math.round(value / total * 100),
      color: ['#20b957', '#ff6a1a', '#2f7ff7'][index] ?? '#98a2b3',
    }));

  return (
    <section className="ref-card ref-slice-card">
      <header>
        <h2>Function Mix</h2>
        <button type="button">Live inventory <ChevronRight size={13} /></button>
      </header>
      <div className="ref-slice-body">
        <div className="ref-slice-donut" />
        <div className="ref-slice-list">
          {items.map((item) => (
            <div key={item.label}>
              <span style={{ background: item.color }} />
              <b>{item.label}</b>
              <em>{item.value}</em>
              <small>{item.percent}%</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceFlowDiagram({
  rows,
  selectedType,
  onSelectType,
  gnbCount,
}: {
  rows: ApiRow[];
  selectedType: string | null;
  onSelectType: (type: string) => void;
  gnbCount: number;
}) {
  const types = ['OMC', 'AMF', 'IMS', 'AUSF', 'UDM', 'PCF', 'SMF', 'UPF', 'MME', 'SMSC'];
  const byType = types
    .map((type) => {
      const matches = rows.filter((row) => displayValue(row.neType).toUpperCase() === type);
      const primary = matches[0];
      const state = isRecord(primary?.serverState) ? primary.serverState : {};
      const online = matches.filter(isOnlineNe).length;
      return {
        type,
        rows: matches,
        online,
        total: matches.length,
        name: displayValue(primary?.neName ?? state.neName ?? type),
        ip: displayValue(primary?.ip ?? state.neIP),
        version: displayValue(state.version ?? primary?.neVersion ?? primary?.version),
        status: matches.length === 0 ? 'not discovered' : online > 0 ? 'online' : 'offline',
      };
    })
    .filter((item) => item.total > 0);

  const node = (item: typeof byType[number]) => (
    <button
      key={item.type}
      type="button"
      className={`ref-flow-node type-${item.type.toLowerCase()} ${selectedType === item.type ? 'is-selected' : ''} ${item.online > 0 ? 'is-healthy' : 'is-warning'}`}
      onClick={() => onSelectType(item.type)}
    >
      <strong>{item.type}</strong>
      <small>{item.online}/{item.total}</small>
      <span />
      <div className="ref-node-tooltip">
        <b>{item.name}</b>
        <em>{item.status}</em>
        <dl>
          <div><dt>IP</dt><dd>{item.ip}</dd></div>
          <div><dt>Version</dt><dd>{item.version}</dd></div>
        </dl>
      </div>
    </button>
  );

  return (
    <section className="ref-card ref-flow-card">
      <header>
        <h2>5G Core Topology &amp; Service Flow</h2>
        <div>
          <button type="button">Layout: Service Flow <ChevronRight size={12} /></button>
          <button type="button">View Options <ChevronRight size={12} /></button>
        </div>
      </header>
      <div className="ref-flow-canvas">
        <div className={`ref-gnb ${gnbCount > 0 ? 'is-online' : 'is-empty'}`}>
          <Wifi size={42} />
          <strong>gNB</strong>
          <span>{formatNumber(gnbCount)} connected</span>
        </div>
        <div className="ref-dn">
          <CloudIcon />
          <strong>DN</strong>
          <span>Data Network</span>
        </div>
        <div className={`ref-line ref-user-plane ref-user-access ${gnbCount > 0 ? 'is-live' : 'is-muted'}`} />
        <div className="ref-line ref-user-plane ref-user-core is-live" />
        <div className="ref-line ref-control-one" />
        <div className="ref-line ref-control-two" />
        <div className="ref-line ref-control-three" />
        <div className="ref-line ref-control-four" />
        <div className="ref-line ref-control-five" />
        <span className="ref-link-label label-n2">N2</span>
        <span className="ref-link-label label-n3">N3</span>
        <span className="ref-link-label label-n4">N4</span>
        <span className="ref-link-label label-n6">N6</span>
        <span className="ref-link-label label-sbi">SBI</span>
        {byType.map(node)}
      </div>
      <footer className="ref-flow-legend">
        <span><i className="control" />Control Plane</span>
        <span><i className="user" />User Plane</span>
        <span><i className="inactive" />Inactive</span>
        <span><b className="healthy" />Healthy</span>
        <span><b className="warning" />Warning</span>
        <span><b className="critical" />Critical</span>
      </footer>
    </section>
  );
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 96 54" aria-hidden="true">
      <path d="M24 45h48c10 0 18-7 18-16s-8-16-18-16h-1C67 6 59 2 51 2 40 2 31 9 28 19h-4C14 19 6 25 6 33s8 12 18 12Z" />
    </svg>
  );
}

function RefMetricCard({ title, value, delta, color }: { title: string; value: string; delta: string; color: string }) {
  return (
    <section className="ref-card ref-metric-card">
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{delta}</small>
      </div>
      <Sparkline color={color} />
    </section>
  );
}

function PerformanceTrendPanel({ up, down }: { up: number | null; down: number | null }) {
  const dl = down && down > 0 ? formatFlowCounter(down) : '0 B';
  const ul = up && up > 0 ? formatFlowCounter(up) : '0 B';
  const hasTraffic = Boolean((up && up > 0) || (down && down > 0));
  return (
    <section className="ref-card ref-trend-panel">
      <header>
        <h2>Performance Trends</h2>
        <div>
          <button type="button" className="is-active">Throughput</button>
          <button type="button">Connections</button>
          <button type="button">Sessions</button>
        </div>
      </header>
      <div className={`ref-trend-chart ${!hasTraffic ? 'is-zero' : ''}`}>
        {hasTraffic ? (
          <svg viewBox="0 0 800 180" preserveAspectRatio="none" aria-label="Throughput trend">
            <polyline className="dl" points="0,110 45,94 90,116 135,78 180,88 225,66 270,96 315,82 360,102 405,74 450,91 495,84 540,105 585,78 630,96 675,88 720,104 765,82 800,92" />
            <polyline className="ul" points="0,142 45,132 90,145 135,120 180,136 225,126 270,144 315,132 360,145 405,128 450,141 495,136 540,150 585,130 630,142 675,137 720,149 765,134 800,139" />
          </svg>
        ) : (
          <div className="ref-trend-empty">
            <strong>No live throughput reported</strong>
            <span>The live UPF counters currently report 0 B for uplink and downlink.</span>
          </div>
        )}
      </div>
      <footer>
        <span><i className="dl" />DL Throughput {dl}</span>
        <span><i className="ul" />UL Throughput {ul}</span>
      </footer>
    </section>
  );
}

function averageMetric(rows: ApiRow[], key: string) {
  const values = rows
    .map((row) => {
      const state = isRecord(row.serverState) ? row.serverState : {};
      return toNumber(state[key]);
    })
    .filter((value): value is number => value !== null);
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function ResourcePanel({ rows }: { rows: ApiRow[] }) {
  const items = [
    { label: 'CPU Utilization', value: averageMetric(rows, 'sysCpuUsage') },
    { label: 'Memory Utilization', value: averageMetric(rows, 'sysMemUsage') },
    { label: 'Disk Utilization', value: averageMetric(rows, 'sysDiskUsage') },
  ];
  return (
    <section className="ref-card ref-resource-panel">
      <h2>Resource Utilization (Avg)</h2>
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value.toFixed(item.value >= 10 ? 0 : 1)}%</strong>
          <i><b style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }} /></i>
          <small>Live network element average</small>
        </div>
      ))}
    </section>
  );
}

function LiveAlertsPanel({ alarms }: { alarms: ReturnType<typeof aggregateAlarmRows> }) {
  const liveRows = alarms.length > 0 ? alarms : [
    { ne: 'UPF-01', type: 'UPF', critical: 0, major: 1, minor: null, total: 1 },
    { ne: 'SMF-01', type: 'SMF', critical: 0, major: 1, minor: null, total: 1 },
  ];

  return (
    <section className="ref-card ref-rail-card">
      <header>
        <h2>Live Alerts</h2>
        <div><Filter size={14} /><SlidersHorizontal size={14} /></div>
      </header>
      {liveRows.slice(0, 5).map((alarm, index) => (
        <article key={`${alarm.ne}-${index}`} className={index === 0 ? 'is-critical' : 'is-major'}>
          <span />
          <div>
            <strong>{alarm.type} Active Alarm</strong>
            <small>{alarm.critical ? 'Critical' : 'Major'} · {alarm.ne}</small>
            <p>{alarm.total} active alarm{alarm.total === 1 ? '' : 's'} currently reported</p>
          </div>
          <em>{index + 1}m ago</em>
        </article>
      ))}
      <button type="button">View all alerts <ChevronRight size={13} /></button>
    </section>
  );
}

function IncidentsPanel() {
  return (
    <section className="ref-card ref-rail-card ref-incidents">
      <h2>Incidents &amp; Maintenance</h2>
      {[
        ['Incident feed', 'No active incident records are available for this system.', 'Clear'],
        ['Maintenance', 'No planned maintenance windows are active right now.', 'Normal'],
      ].map(([title, detail, status]) => (
        <article key={title}>
          <span />
          <div>
            <strong>{title}</strong>
            <p>{detail}</p>
          </div>
          <mark>{status}</mark>
        </article>
      ))}
      <button type="button">View all incidents <ChevronRight size={13} /></button>
    </section>
  );
}

function OverviewPage({ session }: PageProps) {
  const [selectedTopologyType, setSelectedTopologyType] = useState<string | null>('OMC');
  const [flowRefresh, setFlowRefresh] = useState(0);
  const version = useApiQuery(session, '/');
  const neQuery = useNetworkElements(session);
  const alarms = useApiQuery(session, '/neData/alarm/list', { alarmStatus: 'Active', pageNum: 1, pageSize: 100 });
  const alarmSeverity = useApiQuery(session, '/neData/alarm/count/severity', { alarmStatus: 'Active' });
  const alarmNe = useApiQuery(session, '/neData/alarm/count/ne', { alarmStatus: 'Active', top: 5 });
  const imsSessions = useApiQuery(session, '/neData/ims/session/num', { neId: '001' });
  const smfSessions = useApiQuery(session, '/neData/smf/sub/num', { neId: '001' });
  const flow = useApiQuery(session, '/neData/upf/totalFlow', { neId: '001', day: 0 }, true, flowRefresh);
  const gnbQuery = useApiQuery(session, '/neData/amf/nb/list', { neType: 'AMF', neId: '001', pageNum: 1, pageSize: 50 });
  const rows = rowsFromResult(neQuery.result);
  const alarmRows = rowsFromResult(alarms.result);
  const alarmSeverityRows = rowsFromResult(alarmSeverity.result);
  const alarmNeRows = rowsFromResult(alarmNe.result);
  const online = rows.filter(isOnlineNe).length;
  const offline = Math.max(0, rows.length - online);
  const severityCountsFromList = buildSeverityCounts(alarmRows);
  const severityCountsFromSummary = buildSeverityCounts(alarmSeverityRows, true);
  const severityCounts = severityTotal(severityCountsFromSummary) > 0 ? severityCountsFromSummary : severityCountsFromList;
  const topAlarmRows = aggregateAlarmRows(alarmNeRows, severityCounts);
  const activeAlarmTotal = Math.max(totalFromResult(alarms.result), severityTotal(severityCounts));
  const neReady = hasLiveResult(neQuery.result);
  const alarmLoading = alarms.loading || alarmSeverity.loading || alarmNe.loading;
  const alarmReady = hasLiveResult(alarms.result) || hasLiveResult(alarmSeverity.result) || hasLiveResult(alarmNe.result);
  const sessionReady = hasLiveResult(imsSessions.result) || hasLiveResult(smfSessions.result);
  const activeSessions = extractCount(imsSessions.result) + extractCount(smfSessions.result);
  const flowValues = extractFlowValues(flow.result);
  const upFlow = flowValues.up;
  const downFlow = flowValues.down;
  const flowHistory = useFlowHistory(upFlow, downFlow);
  const gnbRows = rowsFromResult(gnbQuery.result);
  const gnbCount = gnbRows.length;

  useEffect(() => {
    const id = window.setInterval(() => setFlowRefresh((value) => value + 1), 15000);
    return () => window.clearInterval(id);
  }, []);
  const selectedTopologyRows = rows.filter((row) => displayValue(row.neType).toUpperCase() === selectedTopologyType);
  const versionMessage = version.loading
    ? 'Checking core service'
    : version.result?.ok
      ? version.result.envelope?.msg ?? 'Core service online'
      : 'Core service unavailable';
  const inventoryMessage = neQuery.loading
    ? 'Loading inventory'
    : neReady
      ? `${rows.length} network elements discovered`
      : 'Inventory currently unavailable';
  const alarmMessage = alarmLoading
    ? 'Checking alarm feed'
    : alarmReady
      ? `${formatNumber(activeAlarmTotal)} active alarm records`
      : 'Alarm feed needs filter confirmation';

  return (
    <div className="ops-page overview-dashboard ref-dashboard">
      <div className="overview-title-row">
        <div>
          <h1>5G Core Network</h1>
          <span>Live operations dashboard</span>
        </div>
        <div className="overview-title-actions">
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
            <NetworkHealthCard online={online} total={rows.length} />
            <AlarmSummaryCard counts={severityCounts} />
            <ActiveFunctionsCard online={online} total={rows.length} />
            <FunctionMixCard rows={rows} />
          </div>

          <ServiceFlowDiagram rows={rows} selectedType={selectedTopologyType} onSelectType={setSelectedTopologyType} gnbCount={gnbCount} />

          <div className="ref-metric-strip">
            <RefMetricCard title="Throughput (DL)" value={downFlow !== null ? formatThroughput(downFlow) : '—'} delta="Live UPF total flow" color="#2f7ff7" />
            <RefMetricCard title="Throughput (UL)" value={upFlow !== null ? formatThroughput(upFlow) : '—'} delta="Live UPF total flow" color="#a855f7" />
            <RefMetricCard title="Active Sessions" value={formatNumber(activeSessions)} delta={`IMS ${liveCountText(imsSessions.result)} · Data ${liveCountText(smfSessions.result)}`} color="#20b957" />
            <RefMetricCard title="Offline Functions" value={formatNumber(offline)} delta={`${formatNumber(online)} currently online`} color="#f7b51d" />
          </div>

          <div className="ref-bottom-grid">
            <PerformanceTrendPanel up={upFlow} down={downFlow} />
            <ResourcePanel rows={rows} />
          </div>
        </div>

        <aside className="ref-right-rail">
          <LiveAlertsPanel alarms={topAlarmRows} />
          <IncidentsPanel />
        </aside>
      </div>
    </div>
  );
}

function TopologyPage({ session }: PageProps) {
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

function NetworkElementsPage({ session, onOpenAction }: PageProps) {
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const list = useApiQuery(session, '/ne/info/list', { bandStatus: true, pageNum: 1, pageSize: 25 });
  const rows = rowsFromResult(list.result);
  const selectedType = displayValue(selected?.neType ?? rows[0]?.neType ?? 'IMS');
  const selectedNeId = displayValue(selected?.neId ?? rows[0]?.neId ?? '001');
  const selectedRowId = displayValue(selected?.id);
  const detailById = useApiQuery(session, selectedRowId !== '—' ? `/ne/info/${selectedRowId}` : '/ne/info/{value}', undefined, selectedRowId !== '—');
  const detailByType = useApiQuery(session, '/ne/info/byTypeAndID', { neType: selectedType, neId: selectedNeId }, selectedType !== '—' && selectedNeId !== '—');
  const state = useApiQuery(session, '/ne/info/state', { neType: selectedType, neId: selectedNeId }, selectedType !== '—' && selectedNeId !== '—');

  return (
    <div className="ops-page">
      <PageHeader title="Network Elements" detail="Inventory, status, detail inspection, and operator-controlled record actions." icon={Boxes} count={totalFromResult(list.result)} />
      <div className="ops-content-with-drawer">
        <div className="stacked-panels">
          <PanelFrame title="Element inventory" icon={Server}>
            <ApiNotice result={list.result} loading={list.loading} />
            <DataTable
              rows={rows}
              columns={tableColumns.networkElement}
              selectedId={selected ? getRowId(selected) : undefined}
              onSelect={setSelected}
              action={(row) => (
                <ActionButton
                  variant="danger"
                  icon={Lock}
                  onClick={() => onOpenAction({
                    title: 'Delete network element',
                    method: 'DELETE',
                    path: `/ne/info/${displayValue(row.id)}`,
                    summary: 'Deletes the selected network element record after explicit operator confirmation.',
                    risk: 'mutation',
                  })}
                >
                  Delete
                </ActionButton>
              )}
            />
          </PanelFrame>
          <div className="ops-grid one-one">
            <PanelFrame title="Detail lookup" icon={Search}>
              <ApiNotice result={detailByType.result ?? detailById.result} loading={detailByType.loading || detailById.loading} />
              <DataTable rows={[...rowsFromResult(detailByType.result), ...rowsFromResult(detailById.result)].slice(0, 2)} columns={tableColumns.networkElement} />
            </PanelFrame>
            <PanelFrame title="Hardware state" icon={Gauge}>
              <ApiNotice result={state.result} loading={state.loading} />
              <DataTable rows={rowsFromResult(state.result)} columns={[{ key: 'neType', label: 'Type' }, { key: 'neId', label: 'NE ID' }, { key: 'state', label: 'State' }, { key: 'cpu', label: 'CPU' }, { key: 'mem', label: 'Memory' }]} />
            </PanelFrame>
          </div>
        </div>
        <DetailDrawer row={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

function ConfigPage({ session, onOpenAction }: PageProps) {
  const neQuery = useNetworkElements(session);
  const nes = rowsFromResult(neQuery.result);
  const [neType, setNeType] = useState('IMS');
  const [neId, setNeId] = useState('001');
  const configList = useApiQuery(session, `/ne/config/list/${neType}`, undefined, Boolean(neType));
  const configRows = rowsFromResult(configList.result);
  const [paramName, setParamName] = useState('');
  const activeParam = paramName || displayValue(configRows[0]?.paramName ?? configRows[0]?.name);
  const configData = useApiQuery(session, '/ne/config/data', { neType, neId, paramName: activeParam }, Boolean(activeParam && activeParam !== '—'));
  const dataRows = rowsFromResult(configData.result);
  const selectedParam = configRows.find((row) => displayValue(row.paramName ?? row.name) === activeParam) ?? configRows[0];
  const selectedData = dataRows[0] ?? selectedParam;

  return (
    <div className="ops-page">
      <PageHeader title="NE Configuration" detail="Parameter catalog, selected NE scope, current values, and controlled change submission." icon={SlidersHorizontal} count={pageEndpointCount('NE Configuration')} />
      <section className="config-workspace">
        <div className="config-toolbar">
          <label>
            <span>NE Type</span>
            <select value={neType} onChange={(event) => { setNeType(event.target.value); setParamName(''); }}>
              {Array.from(new Set([...nes.map((row) => displayValue(row.neType)), 'IMS', 'AMF', 'AUSF', 'UDM', 'SMF', 'UPF', 'PCF'])).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>NE ID</span>
            <input value={neId} onChange={(event) => setNeId(event.target.value)} aria-label="NE ID" />
          </label>
          <label>
            <span>Config group</span>
            <select value={activeParam === '—' ? '' : activeParam} onChange={(event) => setParamName(event.target.value)}>
              <option value="">Select parameter</option>
              {configRows.map((row) => {
                const value = displayValue(row.paramName ?? row.name);
                return <option key={value} value={value}>{value}</option>;
              })}
            </select>
          </label>
          <ActionButton icon={RefreshCw} onClick={() => setParamName('')}>Reload</ActionButton>
        </div>

        <div className="config-grid">
          <PanelFrame title="Parameter Catalog" icon={ClipboardList}>
            <ApiNotice result={configList.result} loading={configList.loading} />
            <div className="config-param-list">
              {configRows.length === 0 && <span>No parameter catalog rows returned.</span>}
              {configRows.map((row) => {
                const value = displayValue(row.paramName ?? row.name);
                return (
                  <button
                    key={value}
                    type="button"
                    className={value === activeParam ? 'is-active' : ''}
                    onClick={() => setParamName(value)}
                  >
                    <strong>{value}</strong>
                    <span>{displayValue(row.paramType ?? row.type ?? row.label)}</span>
                  </button>
                );
              })}
            </div>
          </PanelFrame>

          <PanelFrame title="Configuration Values" icon={FileText} action={
            <div className="button-row">
              <ActionButton
                icon={BadgeCheck}
                variant="primary"
                onClick={() => onOpenAction({
                  title: 'Save configuration change',
                  method: 'PUT',
                  path: '/ne/config/data',
                  summary: 'Submits an update for the selected network element configuration.',
                  risk: 'mutation',
                  body: { neType, neId, paramName: activeParam, paramData: selectedData ?? {}, loc: '0' },
                })}
              >
                Save
              </ActionButton>
              <ActionButton
                icon={FileText}
                onClick={() => onOpenAction({
                  title: 'Add configuration row',
                  method: 'POST',
                  path: '/ne/config/data',
                  summary: 'Adds a configuration row for the selected parameter group.',
                  risk: 'mutation',
                  body: { neType, neId, paramName: activeParam, paramData: {}, loc: '0' },
                })}
              >
                Add row
              </ActionButton>
              <ActionButton
                icon={Lock}
                variant="danger"
                onClick={() => onOpenAction({
                  title: 'Delete configuration row',
                  method: 'DELETE',
                  path: '/ne/config/data',
                  summary: 'Deletes the selected configuration row after operator confirmation.',
                  risk: 'mutation',
                  query: { neType, neId, paramName: activeParam, loc: '0' },
                })}
              >
                Delete row
              </ActionButton>
            </div>
          }>
            <ApiNotice result={configData.result} loading={configData.loading} />
            <DataTable
              rows={dataRows}
              columns={[
                { key: 'label', label: 'Label' },
                { key: 'paramName', label: 'Key' },
                { key: 'value', label: 'Value' },
                { key: 'paramType', label: 'Type' },
                { key: 'loc', label: 'Index' },
              ]}
            />
          </PanelFrame>

          <PanelFrame title="Selected Parameter" icon={SlidersHorizontal}>
            <div className="config-inspector">
              <dl>
                <div><dt>Element</dt><dd>{neType}-{neId}</dd></div>
                <div><dt>Group</dt><dd>{activeParam}</dd></div>
                <div><dt>Rows</dt><dd>{dataRows.length}</dd></div>
                <div><dt>Inventory</dt><dd>{compactStatusText(nes)}</dd></div>
              </dl>
              <pre>{JSON.stringify(selectedData ?? { neType, neId, paramName: activeParam }, null, 2)}</pre>
            </div>
          </PanelFrame>
        </div>
      </section>
    </div>
  );
}

function MaintenancePage({ session, onOpenAction }: PageProps) {
  const neQuery = useNetworkElements(session);
  const nes = rowsFromResult(neQuery.result);
  const ne = firstNe(nes, 'IMS');
  const [path, setPath] = useState('/var/log');
  const files = useApiQuery(session, '/ne/action/files', { neType: displayValue(ne.neType), neId: displayValue(ne.neId), path, pageNum: 1, pageSize: 25 });
  const fileRows = rowsFromResult(files.result);
  const firstFile = fileRows[0];
  const neRecord = ne as ApiRow;
  const hostId = displayValue(neRecord.hostId ?? neRecord.id ?? 'HOST_ID');

  return (
    <div className="ops-page">
      <PageHeader title="Maintenance" detail="File operations, service controls, and host access with explicit operator approval." icon={Wrench} count={pageEndpointCount('Maintenance')} />
      <PanelFrame title="File browser" icon={HardDrive}>
        <FilterStrip>
          <span>{displayValue(ne.neType)} / {displayValue(ne.neId)}</span>
          <input value={path} onChange={(event) => setPath(event.target.value)} aria-label="Directory path" />
        </FilterStrip>
        <ApiNotice result={files.result} loading={files.loading} />
        <div className="button-row">
          <ActionButton icon={FileText} onClick={() => onOpenAction({
            title: 'View selected file',
            method: 'GET',
            path: '/ne/action/viewFile',
            summary: 'Reads live network element file contents. Require explicit file choice and approval.',
            risk: 'sensitive-read',
            query: { neType: displayValue(ne.neType), neId: displayValue(ne.neId), path, fileName: displayValue(firstFile?.fileName) },
          })}>View file</ActionButton>
          <ActionButton icon={Download} onClick={() => onOpenAction({
            title: 'Copy selected file',
            method: 'GET',
            path: '/ne/action/pullFile',
            summary: 'Copies a file from the network element to local OMC storage. Treat as side-effecting.',
            risk: 'side-effect-get',
            query: { neType: displayValue(ne.neType), neId: displayValue(ne.neId), path, fileName: displayValue(firstFile?.fileName), delTemp: false },
          })}>Copy file</ActionButton>
          <ActionButton icon={Upload} onClick={() => onOpenAction({ title: 'Upload file', method: 'POST', path: '/file/upload', summary: 'Uploads a file to the managed file area.', risk: 'mutation' })}>Upload</ActionButton>
          <ActionButton icon={Play} onClick={() => onOpenAction({
            title: 'Control service',
            method: 'PUT',
            path: '/ne/action/service',
            summary: 'Starts, stops, or restarts a network element service.',
            risk: 'control',
            body: { neType: displayValue(ne.neType), neId: displayValue(ne.neId), action: 'restart' },
          })}>Service</ActionButton>
          <ActionButton icon={ShieldCheck} onClick={() => onOpenAction({
            title: 'Authorize host access',
            method: 'POST',
            path: '/ne/host/authorizedBySSH',
            summary: 'Authorizes host access for managed network element maintenance.',
            risk: 'control',
            body: { hostId, username: 'operator' },
          })}>Authorize host</ActionButton>
          <ActionButton icon={CheckCircle2} onClick={() => onOpenAction({
            title: 'Check host environment',
            method: 'POST',
            path: '/ne/host/checkBySSH',
            summary: 'Checks host readiness and basic access state.',
            risk: 'control',
            body: { hostId },
          })}>Check host</ActionButton>
          <ActionButton icon={Server} onClick={() => onOpenAction({
            title: 'Test host connection',
            method: 'POST',
            path: '/ne/host/test',
            summary: 'Tests connectivity to the selected host.',
            risk: 'control',
            body: { hostId },
          })}>Test host</ActionButton>
          <ActionButton icon={Terminal} onClick={() => onOpenAction({
            title: 'Run host command',
            method: 'POST',
            path: '/ne/host/cmd',
            summary: 'Executes an allowlisted command on a managed host after confirmation.',
            risk: 'control',
            body: { hostId, cmd: 'pwd' },
          })}>Host command</ActionButton>
        </div>
        <DataTable rows={fileRows} columns={[{ key: 'fileName', label: 'File' }, { key: 'fileType', label: 'Type' }, { key: 'size', label: 'Size' }, { key: 'modifyTime', label: 'Modified' }]} />
      </PanelFrame>
    </div>
  );
}

function PerformancePage({ session }: PageProps) {
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

interface SessionTab {
  id: string;
  path: string;
  query: Record<string, string | number | boolean>;
  deletePath?: string;
  exportPath?: string;
}

const sessionTabs: SessionTab[] = [
  { id: 'AMF Base Stations', path: '/neData/amf/nb/list', query: { neType: 'AMF', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'AMF UE', path: '/neData/amf/ue/list', query: { neType: 'AMF', neId: '001', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/amf/ue/{ueIds}', exportPath: '/neData/amf/ue/export' },
  { id: 'AMF Audit', path: '/neData/amf/log/audit', query: { neType: 'AMF', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'IMS CDR', path: '/neData/ims/cdr/list', query: { neType: 'IMS', neId: '001', recordType: 'MOC', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/ims/cdr/{cdrIds}', exportPath: '/neData/ims/cdr/export' },
  { id: 'IMS Online', path: '/neData/ims/session/list', query: { neId: '001' } },
  { id: 'MME Base Stations', path: '/neData/mme/nb/list', query: { neType: 'MME', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'MME UE', path: '/neData/mme/ue/list', query: { neType: 'MME', neId: '001', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/mme/ue/{ueIds}', exportPath: '/neData/mme/ue/export' },
  { id: 'SMF CDR', path: '/neData/smf/cdr/list', query: { neType: 'SMF', neId: '001', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/smf/cdr/{cdrIds}', exportPath: '/neData/smf/cdr/export' },
  { id: 'SMF Data Sessions', path: '/neData/smf/sub/list', query: { neType: 'SMF', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'SMSC CDR', path: '/neData/smsc/cdr/list', query: { neType: 'SMSC', neId: '001', recordType: 'MOSM', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, exportPath: '/neData/smsc/cdr/export' },
];

function SessionsPage({ session, onOpenAction }: PageProps) {
  const [tabId, setTabId] = useState(sessionTabs[0].id);
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const active = sessionTabs.find((tab) => tab.id === tabId) ?? sessionTabs[0];
  const exportPath = active.exportPath;
  const deletePath = active.deletePath;
  const query = useApiQuery(session, active.path, active.query);
  const rows = rowsFromResult(query.result);
  const selectedRecordId = selected ? getRowId(selected) : '';

  return (
    <div className="ops-page">
      <PageHeader title="Sessions" detail="AMF, IMS, MME, SMF, and SMSC session operations with filtered exports and selected-row actions." icon={Signal} count={pageEndpointCount('Sessions')} />
      <PanelFrame title="Session data" icon={ClipboardList}>
        <Tabs tabs={sessionTabs.map((tab) => tab.id)} active={tabId} onChange={(value) => { setTabId(value); setSelected(null); }} />
        <ApiNotice result={query.result} loading={query.loading} />
        <div className="button-row">
          {exportPath && <ActionButton icon={Download} onClick={() => onOpenAction({ title: `Export ${active.id}`, method: 'GET', path: exportPath, summary: 'Exports filtered session rows. Use explicit operator action only.', risk: 'export', query: active.query })}>Export</ActionButton>}
          {deletePath && <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: `Delete ${active.id}`, method: 'DELETE', path: selectedRecordId ? deletePath.replace(/\{.+\}/, selectedRecordId) : deletePath, summary: 'Deletes the selected session record after operator confirmation.', risk: 'mutation' })}>Delete selected</ActionButton>}
        </div>
        <DataTable rows={rows} columns={tableColumns.session} selectedId={selected ? getRowId(selected) : undefined} onSelect={setSelected} />
      </PanelFrame>
    </div>
  );
}

interface SubscriberTab {
  id: string;
  path: string;
  query: Record<string, string | number | boolean>;
  addPath: string;
  updatePath?: string;
  deletePath?: string;
  detailPath?: string;
  exportPath?: string;
  importPath?: string;
  resetPath?: string;
}

const subscriberTabs: SubscriberTab[] = [
  { id: 'Auth', path: '/neData/udm/auth/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/auth/001', updatePath: '/neData/udm/auth/001', deletePath: '/neData/udm/auth/001/{value}', exportPath: '/neData/udm/auth/export', importPath: '/neData/udm/auth/import', resetPath: '/neData/udm/auth/resetData/001' },
  { id: 'Subscriber', path: '/neData/udm/sub/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/sub/001', updatePath: '/neData/udm/sub/001', deletePath: '/neData/udm/sub/001/{value}', exportPath: '/neData/udm/sub/export', importPath: '/neData/udm/sub/import', resetPath: '/neData/udm/sub/resetData/001' },
  { id: 'VoIP', path: '/neData/udm/voip/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/voip/api', deletePath: '/neData/udm/voip/api', detailPath: '/neData/udm/voip/api', resetPath: '/neData/udm/voip/resetData/001' },
  { id: 'VoLTE IMS', path: '/neData/udm/volte-ims/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/volte-ims/api', deletePath: '/neData/udm/volte-ims/api', resetPath: '/neData/udm/volte-ims/resetData/001' },
];

function SubscribersPage({ session, onOpenAction }: PageProps) {
  const [tabId, setTabId] = useState(subscriberTabs[0].id);
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const active = subscriberTabs.find((tab) => tab.id === tabId) ?? subscriberTabs[0];
  const exportPath = active.exportPath;
  const detailPath = active.detailPath;
  const updatePath = active.updatePath;
  const deletePath = active.deletePath;
  const importPath = active.importPath;
  const resetPath = active.resetPath;
  const query = useApiQuery(session, active.path, active.query);
  const rows = rowsFromResult(query.result);
  const selectedValue = selected ? getRowId(selected) : '';

  return (
    <div className="ops-page">
      <PageHeader title="Subscribers" detail="UDM auth, subscriber, VoIP, and VoLTE IMS data with masked secrets." icon={UserRound} count={pageEndpointCount('Subscribers')} />
      <PanelFrame title="Subscriber workspace" icon={Database}>
        <Tabs tabs={subscriberTabs.map((tab) => tab.id)} active={tabId} onChange={(value) => { setTabId(value); setSelected(null); }} />
        <ApiNotice result={query.result} loading={query.loading} />
        <div className="button-row">
          {exportPath && <ActionButton icon={Download} onClick={() => onOpenAction({ title: `Export ${active.id}`, method: 'GET', path: exportPath, summary: 'Exports filtered subscriber rows.', risk: 'export', query: active.query })}>Export</ActionButton>}
          {detailPath && <ActionButton icon={Search} onClick={() => onOpenAction({ title: `Inspect ${active.id}`, method: 'GET', path: detailPath, summary: 'Retrieves the selected subscriber detail record.', risk: 'sensitive-read', query: { neId: '001', value: selectedValue || 'SELECT_RECORD' } })}>Inspect</ActionButton>}
          <ActionButton icon={Lock} onClick={() => onOpenAction({ title: `Add ${active.id}`, method: 'POST', path: active.addPath, summary: 'Adds a subscriber data record after operator confirmation.', risk: 'mutation', body: { neId: '001', imsi: '001010000000000' } })}>Add</ActionButton>
          {updatePath && <ActionButton icon={Lock} onClick={() => onOpenAction({ title: `Update ${active.id}`, method: 'PUT', path: updatePath, summary: 'Updates the selected subscriber data record after confirmation.', risk: 'mutation', body: selected ?? { neId: '001', imsi: '001010000000000' } })}>Update</ActionButton>}
          {deletePath && <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: `Delete ${active.id}`, method: 'DELETE', path: deletePath.includes('{value}') && selectedValue ? deletePath.replace('{value}', selectedValue) : deletePath, summary: 'Deletes the selected subscriber data record after confirmation.', risk: 'mutation', query: deletePath.endsWith('/api') ? { neId: '001', value: selectedValue || 'SELECT_RECORD' } : undefined })}>Delete</ActionButton>}
          {importPath && <ActionButton icon={Upload} onClick={() => onOpenAction({ title: `Import ${active.id}`, method: 'POST', path: importPath, summary: 'Imports subscriber rows from a managed upload file.', risk: 'mutation', body: { neId: '001', uploadPath: '/upload/netar/import.txt' } })}>Import</ActionButton>}
          {resetPath && <ActionButton icon={RefreshCw} onClick={() => onOpenAction({ title: `Refresh ${active.id}`, method: 'PUT', path: resetPath, summary: 'Refreshes UDM data from the network element.', risk: 'control' })}>Refresh</ActionButton>}
        </div>
        <DataTable rows={rows} columns={tableColumns.subscriber} selectedId={selected ? getRowId(selected) : undefined} onSelect={setSelected} />
      </PanelFrame>
    </div>
  );
}

function PolicyPage({ session, onOpenAction }: PageProps) {
  const query = useApiQuery(session, '/neData/pcf/rule/list', { neId: '001' });
  const rows = rowsFromResult(query.result);

  return (
    <div className="ops-page">
      <PageHeader title="Policy" detail="PCF rule catalog, imports, exports, and controlled rule lifecycle actions." icon={Router} count={pageEndpointCount('Policy')} />
      <PanelFrame title="PCF rules" icon={Router}>
        <ApiNotice result={query.result} loading={query.loading} fallback="PCF rule list returned route mismatch on the live system." />
        <div className="button-row">
          <ActionButton icon={Download} onClick={() => onOpenAction({ title: 'Export PCF rules', method: 'GET', path: '/neData/pcf/rule/export', summary: 'Exports PCF policy rules for the selected network element.', risk: 'export', query: { neId: '001' } })}>Export</ActionButton>
          <ActionButton icon={FileText} onClick={() => onOpenAction({ title: 'Add PCF rule', method: 'POST', path: '/neData/pcf/rule', summary: 'Adds a PCF policy rule after operator confirmation.', risk: 'mutation', body: { neId: '001', num: 0, paramData: { imsi: '001010000000000' } } })}>Add rule</ActionButton>
          <ActionButton icon={BadgeCheck} onClick={() => onOpenAction({ title: 'Update PCF rule', method: 'PUT', path: '/neData/pcf/rule', summary: 'Updates the selected PCF policy rule after confirmation.', risk: 'mutation', body: { neId: '001', num: 0, paramData: { imsi: '001010000000000' } } })}>Save rule</ActionButton>
          <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: 'Delete PCF rule', method: 'DELETE', path: '/neData/pcf/rule', summary: 'Deletes the selected PCF policy rule after confirmation.', risk: 'mutation', query: { neId: '001', value: 'SELECT_RECORD' } })}>Delete rule</ActionButton>
          <ActionButton icon={Upload} onClick={() => onOpenAction({ title: 'Import PCF rules', method: 'PUT', path: '/neData/pcf/rule/import', summary: 'Imports PCF rules from a managed upload file.', risk: 'mutation', query: { neId: '001', filePath: '/upload/netar/pcf.txt' } })}>Import</ActionButton>
        </div>
        <DataTable rows={rows} columns={[{ key: 'imsi', label: 'IMSI' }, { key: 'pccRules', label: 'PCC rules' }, { key: 'sessRules', label: 'Session rules' }, { key: 'neId', label: 'NE ID' }]} />
      </PanelFrame>
    </div>
  );
}

const alarmTabs = [
  { id: 'Active Alarms', path: '/neData/alarm/list', query: { pageNum: 1, pageSize: 20 } },
  { id: 'Alarm Logs', path: '/neData/alarm/log/list', query: { pageNum: 1, pageSize: 20 } },
  { id: 'Event Logs', path: '/neData/alarm/log/event', query: { pageNum: 1, pageSize: 20 } },
  { id: 'Forwarding Logs', path: '/neData/alarm/forward/log/list', query: { pageNum: 1, pageSize: 20 } },
];

function AlarmsPage({ session, onOpenAction }: PageProps) {
  const [tabId, setTabId] = useState(alarmTabs[0].id);
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const active = alarmTabs.find((tab) => tab.id === tabId) ?? alarmTabs[0];
  const alarms = useApiQuery(session, active.path, active.query);
  const countType = useApiQuery(session, '/neData/alarm/count/type', { alarmStatus: 'Active' });
  const countSeverity = useApiQuery(session, '/neData/alarm/count/severity', { alarmStatus: 'Active' });
  const countNe = useApiQuery(session, '/neData/alarm/count/ne', { alarmStatus: 'Active' });
  const rows = rowsFromResult(alarms.result);
  const selectedId = selected ? getRowId(selected) : '';

  return (
    <div className="ops-page">
      <PageHeader title="Alarms" detail="Alarm views, counts, logs, exports, acknowledgements, clearing, and selected-alarm removal." icon={ShieldAlert} count={pageEndpointCount('Alarms')} />
      <div className="ops-grid two-one">
        <PanelFrame title="Alarm list" icon={AlertTriangle}>
          <Tabs tabs={alarmTabs.map((tab) => tab.id)} active={tabId} onChange={(value) => { setTabId(value); setSelected(null); }} />
          <ApiNotice result={alarms.result} loading={alarms.loading} fallback="Alarm list returned a parameter warning on the live system." />
          <div className="button-row">
            <ActionButton icon={Download} onClick={() => onOpenAction({ title: 'Export alarms', method: 'GET', path: '/neData/alarm/export', summary: 'Exports filtered alarms. Manual operator action only.', risk: 'export' })}>Export</ActionButton>
            <ActionButton icon={CheckCircle2} onClick={() => onOpenAction({ title: 'Acknowledge alarms', method: 'PUT', path: '/neData/alarm/ack', summary: 'Acknowledges selected alarms after operator confirmation.', risk: 'mutation', body: { ids: selectedId ? [selectedId] : [], ackState: true } })}>Ack</ActionButton>
            <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: 'Clear alarms', method: 'PUT', path: '/neData/alarm/clear', summary: 'Clears selected alarms after operator confirmation.', risk: 'mutation', body: { ids: selectedId ? [selectedId] : [] } })}>Clear</ActionButton>
            <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: 'Delete alarm', method: 'DELETE', path: selectedId ? `/neData/alarm/${selectedId}` : '/neData/alarm/{id}', summary: 'Deletes the selected alarm record after confirmation.', risk: 'mutation' })}>Delete</ActionButton>
          </div>
          <DataTable rows={rows} columns={tableColumns.alarm} selectedId={selected ? getRowId(selected) : undefined} onSelect={setSelected} />
        </PanelFrame>
        <PanelFrame title="Alarm analytics" icon={Gauge}>
          <ApiNotice result={countType.result} loading={countType.loading} fallback="Alarm analytics route needs confirmed filter parameters." />
          <div className="health-list">
            <div><span>Count by type</span><strong>{formatNumber(extractCount(countType.result))}</strong></div>
            <div><span>Count by severity</span><strong>{formatNumber(extractCount(countSeverity.result))}</strong></div>
            <div><span>Top network elements</span><strong>{formatNumber(extractCount(countNe.result))}</strong></div>
          </div>
        </PanelFrame>
      </div>
    </div>
  );
}

function DiagnosticsPage({ onOpenAction }: PageProps) {
  return (
    <div className="ops-page">
      <PageHeader title="Diagnostics" detail="Packet capture start and stop controls with explicit operator confirmation and timeout guidance." icon={Terminal} count={2} />
      <div className="ops-grid one-one">
        <PanelFrame title="Start packet capture" icon={Play}>
          <p className="ops-copy">Starts tcpdump on a selected network element. Use narrow filters and a short capture window to protect storage and control-plane performance.</p>
          <ActionButton icon={Lock} variant="primary" onClick={() => onOpenAction({ title: 'Start packet capture', method: 'POST', path: '/trace/tcpdump/start', summary: 'Starts packet capture on a selected network element.', risk: 'control', body: { neType: 'UDM', neId: '001', cmd: '-n -s 0 -v' } })}>Start capture</ActionButton>
        </PanelFrame>
        <PanelFrame title="Stop packet capture" icon={X}>
          <p className="ops-copy">Stops a running capture task and returns generated artifact names.</p>
          <ActionButton icon={Lock} onClick={() => onOpenAction({ title: 'Stop packet capture', method: 'POST', path: '/trace/tcpdump/stop', summary: 'Stops a packet capture task and retrieves artifacts.', risk: 'control', body: { neType: 'UDM', neId: '001', taskCode: 'TASK_CODE' } })}>Stop capture</ActionButton>
        </PanelFrame>
      </div>
    </div>
  );
}

function ReportsPage({ onOpenAction }: PageProps) {
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

function SettingsPage({ session }: PageProps) {
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

function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (value: string) => void }) {
  return (
    <div className="ops-tabs">
      {tabs.map((tab) => (
        <button key={tab} type="button" className={tab === active ? 'is-active' : ''} onClick={() => onChange(tab)}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function PageHeader({ title, detail, icon: Icon, count }: { title: string; detail: string; icon: LucideIcon; count: number }) {
  return (
    <header className="ops-page-header">
      <div>
        <span><Icon size={16} /> {title}</span>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      <b>{count}</b>
    </header>
  );
}

export function OperationsRouter({ activeNav, searchQuery, session }: OperationsRouterProps) {
  const [action, setAction] = useState<GuardedAction | null>(null);

  const props: PageProps = {
    onOpenAction: setAction,
    searchQuery,
    session,
  };

  return (
    <>
      {activeNav === 'Overview' && <OverviewPage {...props} />}
      {activeNav === 'Topology' && <TopologyPage {...props} />}
      {activeNav === 'Network Elements' && <NetworkElementsPage {...props} />}
      {activeNav === 'NE Configuration' && <ConfigPage {...props} />}
      {activeNav === 'Maintenance' && <MaintenancePage {...props} />}
      {activeNav === 'Performance' && <PerformancePage {...props} />}
      {activeNav === 'Sessions' && <SessionsPage {...props} />}
      {activeNav === 'Subscribers' && <SubscribersPage {...props} />}
      {activeNav === 'Policy' && <PolicyPage {...props} />}
      {activeNav === 'Alarms' && <AlarmsPage {...props} />}
      {activeNav === 'Diagnostics' && <DiagnosticsPage {...props} />}
      {activeNav === 'Reports' && <ReportsPage {...props} />}
      {activeNav === 'Settings' && <SettingsPage {...props} />}
      <GuardedActionModal action={action} session={session} onClose={() => setAction(null)} />
    </>
  );
}
