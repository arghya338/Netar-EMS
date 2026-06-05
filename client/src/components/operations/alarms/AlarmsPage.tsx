import {
  Activity,
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  Download,
  FileText,
  Filter,
  Gauge,
  HardDrive,
  Info,
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
import { useEffect, useState } from 'react';
import {
  type ApiRow,
  type DataColumn,
  type PageProps,
  apiResultMessage,
  buildSeverityCounts,
  displayValue,
  formatNumber,
  isApiError,
  readableDictionaryLabel,
  rowsFromResult,
  severityTotal,
  toNumber,
  totalFromResult,
  useServerApiQuery,
} from '../shared';

export const severityConfig = [
  { key: 'Critical' as const, label: 'Critical', countKey: 'critical' as const, colorClass: 'sev-critical', dotClass: 'sev-dot-critical' },
  { key: 'Major' as const, label: 'Major', countKey: 'major' as const, colorClass: 'sev-major', dotClass: 'sev-dot-major' },
  { key: 'Minor' as const, label: 'Minor', countKey: 'minor' as const, colorClass: 'sev-minor', dotClass: 'sev-dot-minor' },
  { key: 'Warning' as const, label: 'Warning', countKey: 'warning' as const, colorClass: 'sev-warning', dotClass: 'sev-dot-warning' },
];

export function AlarmSeverityBadge({ severity }: { severity: string }) {
  const label = readableDictionaryLabel(severity);
  const sev = label.toLowerCase();
  const cls = sev.includes('crit') ? 'sev-badge-critical'
    : sev.includes('major') ? 'sev-badge-major'
    : sev.includes('minor') ? 'sev-badge-minor'
    : sev.includes('warn') ? 'sev-badge-warning'
    : 'sev-badge-normal';
  return <span className={`sev-badge ${cls}`}>{label || 'Normal'}</span>;
}

export function AlarmStatusBadge({ status }: { status: string }) {
  const cls = String(status).toLowerCase() === 'active' ? 'alarm-status-active' : 'alarm-status-clear';
  return <span className={`alarm-status-badge ${cls}`}>{status || '—'}</span>;
}

export function AlarmsPage({ session, onOpenAction }: PageProps) {
  const [severityFilter, setSeverityFilter] = useState('');
  const [neTypeFilter, setNeTypeFilter] = useState('');
  const [showAlarmFilters, setShowAlarmFilters] = useState(false);
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alarmPage, setAlarmPage] = useState(1);
  const [alarmPageSize, setAlarmPageSize] = useState(10);

  useEffect(() => {
    setAlarmPage(1);
    setSelected(null);
  }, [severityFilter, neTypeFilter, alarmPageSize]);

  const activeAlarmQuery: Record<string, string | number | boolean> = {
    alarmStatus: 'Active',
    pageNum: alarmPage,
    pageSize: alarmPageSize,
    ...(severityFilter ? { origSeverity: severityFilter } : {}),
    ...(neTypeFilter ? { neType: neTypeFilter } : {}),
  };

  const alarms = useServerApiQuery(session, '/internal/alarm/list', activeAlarmQuery, true, refreshKey);
  const countSeverity = useServerApiQuery(session, '/internal/alarm/count/severity', { alarmStatus: 'Active' }, true, refreshKey);
  const countNe = useServerApiQuery(session, '/internal/alarm/count/ne', { alarmStatus: 'Active', top: 8 }, true, refreshKey);
  const countType = useServerApiQuery(session, '/internal/alarm/count/type', { alarmStatus: 'Active' }, true, refreshKey);

  const alarmRows = rowsFromResult(alarms.result);
  const severityRows = rowsFromResult(countSeverity.result);
  const neRows = rowsFromResult(countNe.result);
  const typeRows = rowsFromResult(countType.result);
  const selectedId = selected ? String(selected.id ?? '') : '';

  const alarmListFailed = isApiError(alarms.result);
  const countSeverityFailed = isApiError(countSeverity.result);
  const countNeFailed = isApiError(countNe.result);
  const countTypeFailed = isApiError(countType.result);

  const severityCountsFromList = buildSeverityCounts(alarmRows);
  const severityCountsFromSummary = countSeverity.result?.ok ? buildSeverityCounts(severityRows, true) : { critical: 0, major: 0, minor: 0, warning: 0, normal: 0 };
  const severityCounts = severityTotal(severityCountsFromSummary) > 0 ? severityCountsFromSummary : severityCountsFromList;
  const alarmMetricsUnavailable = alarmListFailed && countSeverityFailed && severityTotal(severityCounts) === 0;
  const totalActive = alarmMetricsUnavailable ? null : Math.max(alarms.result?.ok ? totalFromResult(alarms.result) : 0, severityTotal(severityCounts));
  const alarmPageCount = totalActive === null ? 1 : Math.max(1, Math.ceil(totalActive / alarmPageSize));
  const alarmFirstRow = alarmRows.length === 0 ? 0 : (alarmPage - 1) * alarmPageSize + 1;
  const alarmLastRow = alarmRows.length === 0 ? 0 : alarmFirstRow + alarmRows.length - 1;
  const canPageBack = alarmPage > 1 && !alarms.loading;
  const canPageForward = totalActive !== null && alarmPage < alarmPageCount && !alarms.loading;

  useEffect(() => {
    if (totalActive !== null && alarmPage > alarmPageCount) {
      setAlarmPage(alarmPageCount);
    }
  }, [alarmPage, alarmPageCount, totalActive]);

  // Get unique NE types for filter
  const neTypes = Array.from(new Set([...alarmRows, ...neRows].map((r) => String(r.neType ?? '')).filter(Boolean)));

  const alarmColumns: DataColumn[] = [
    { key: 'alarmTitle', label: 'Title' },
    { key: 'neType', label: 'NE Type' },
    { key: 'eventTime', label: 'Event Time' },
    { key: 'alarmCode', label: 'Alarm Code' },
  ];

  const refreshAlarmData = () => {
    setSelected(null);
    setRefreshKey((key) => key + 1);
  };

  const formatAlarmActionLabel = (row: ApiRow) => {
    const title = displayValue(row.alarmTitle);
    const id = displayValue(row.id);
    return title === '—' ? `Alarm #${id}` : `Alarm #${id} - ${title}`;
  };

  const openAlarmAck = (row: ApiRow) => {
    const id = toNumber(row.id);
    if (id === null) return;

    onOpenAction({
      intent: 'alarm-ack',
      title: 'Acknowledge alarm',
      method: 'PUT',
      path: '/neData/alarm/ack',
      summary: 'Marks the selected alarm as reviewed by an operator.',
      risk: 'mutation',
      body: { ids: [id], ackState: true },
      affectedLabel: formatAlarmActionLabel(row),
      onSuccess: refreshAlarmData,
    });
  };

  const openAlarmClear = (row: ApiRow) => {
    const id = toNumber(row.id);
    if (id === null) return;

    onOpenAction({
      intent: 'alarm-clear',
      title: 'Clear alarm',
      method: 'PUT',
      path: '/neData/alarm/clear',
      summary: 'Clears the selected alarm and removes it from the active alarm list.',
      risk: 'mutation',
      body: { ids: [id] },
      affectedLabel: formatAlarmActionLabel(row),
      onSuccess: refreshAlarmData,
    });
  };

  const selectedLabel = selected ? formatAlarmActionLabel(selected) : '';

  return (
    <div className="ops-page alarms-workbench-page">
      <div className="alarm-breadcrumb">
        <span>Monitor</span>
        <ChevronRight size={13} />
        <span>Alarm</span>
        <ChevronRight size={13} />
        <strong>Active Alarms</strong>
      </div>

      <section className="alarm-workbench-panel" aria-label="Active alarms workbench">
        <div className="alarm-workbench-toolbar">
          <div className="alarm-toolbar-main">
            <button
              type="button"
              className="alarm-toolbar-btn"
              disabled={!selected}
              title={selected ? `Acknowledge ${selectedLabel}` : 'Select an alarm to acknowledge'}
              onClick={() => selected && openAlarmAck(selected)}
            >
              <CheckCircle2 size={15} /> Acknowledge
            </button>
            <button type="button" className="alarm-toolbar-btn" onClick={() => setRefreshKey((k) => k + 1)}>
              <RefreshCw size={15} /> Sync
            </button>
            <button
              type="button"
              className="alarm-toolbar-btn is-danger"
              disabled={!selected}
              title={selected ? `Clear ${selectedLabel}` : 'Select an alarm to clear'}
              onClick={() => selected && openAlarmClear(selected)}
            >
              <X size={15} /> Clear
            </button>
            <button type="button" className="alarm-toolbar-btn" onClick={() => setShowAlarmFilters((open) => !open)}>
              <Settings size={15} /> Display Filters
            </button>
            <button type="button" className="alarm-toolbar-btn" onClick={() => onOpenAction({ title: 'Export alarms', method: 'GET', path: '/neData/alarm/export', summary: 'Exports filtered alarm list.', risk: 'export' })}>
              <Download size={15} /> Export All
            </button>
          </div>
          <div className="alarm-toolbar-tools">
            <span>{totalActive === null ? '0' : formatNumber(totalActive)} items</span>
            <button type="button" title="Refresh alarms" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={16} /></button>
            <button type="button" title="Table columns"><Boxes size={16} /></button>
          </div>
        </div>

        {showAlarmFilters && (
          <div className="alarm-workbench-filters">
            <label>
              Severity
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                <option value="">All severities</option>
                {severityConfig.map((cfg) => <option key={cfg.key} value={cfg.key}>{cfg.label}</option>)}
              </select>
            </label>
            <label>
              NE Type
              <select value={neTypeFilter} onChange={(e) => setNeTypeFilter(e.target.value)}>
                <option value="">All NE Types</option>
                {neTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
            {(severityFilter || neTypeFilter) && (
              <button type="button" onClick={() => { setSeverityFilter(''); setNeTypeFilter(''); }}>
                Clear filters
              </button>
            )}
          </div>
        )}

        {alarms.loading && <p className="alarm-loading-msg"><RefreshCw size={14} className="spinning" /> Loading alarm data...</p>}
        {!alarms.loading && alarmListFailed && <p className="alarm-empty-msg">Internal alarm data is unavailable. {apiResultMessage(alarms.result)}</p>}

        <div className="alarm-workbench-table-wrap">
          <table className="alarm-workbench-table">
            <thead>
              <tr>
                <th className="alarm-check-col">
                  <input type="checkbox" aria-label="Clear selected alarm row" checked={Boolean(selected)} onChange={() => setSelected(null)} />
                </th>
                {alarmColumns.map((column) => <th key={column.key}>{column.label}</th>)}
                <th>More Action</th>
              </tr>
            </thead>
            <tbody>
              {alarmListFailed && !alarms.loading && (
                <tr><td colSpan={alarmColumns.length + 2} className="alarm-empty-cell">The OMC internal alarm adapter returned: {apiResultMessage(alarms.result)}</td></tr>
              )}
              {alarmRows.length === 0 && !alarms.loading && !alarmListFailed && (
                <tr><td colSpan={alarmColumns.length + 2} className="alarm-empty-cell">No active alarms{severityFilter ? ` with severity "${severityFilter}"` : ''}.</td></tr>
              )}
              {alarmRows.map((row, index) => {
                const isSelected = String(row.id) === selectedId;
                const rowId = toNumber(row.id);
                return (
                  <tr
                    key={`${row.id}-${index}`}
                    className={isSelected ? 'is-selected' : ''}
                    onClick={() => setSelected(isSelected ? null : row)}
                  >
                    <td className="alarm-check-col" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select alarm ${displayValue(row.id)}`}
                        checked={isSelected}
                        onChange={() => setSelected(isSelected ? null : row)}
                      />
                    </td>
                    <td className="alarm-title-cell">
                      <span>{displayValue(row.alarmTitle)}</span>
                      <small>{displayValue(row.origSeverity)} / {displayValue(row.alarmType)}</small>
                    </td>
                    <td>{displayValue(row.neType)}</td>
                    <td>{displayValue(row.eventTime)}</td>
                    <td>{displayValue(row.alarmCode ?? row.id)}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div className="alarm-more-actions">
                        <button type="button" title={formatAlarmActionLabel(row)} aria-label={`View alarm ${displayValue(row.id)}`}>
                          <Info size={15} />
                        </button>
                        <button
                          type="button"
                          className="alarm-inline-clear"
                          title={rowId === null ? 'Alarm ID unavailable' : 'Clear this alarm'}
                          aria-label={`Clear alarm ${displayValue(row.id)}`}
                          disabled={rowId === null}
                          onClick={() => openAlarmClear(row)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="alarm-workbench-footer">
          <span>
            Showing {formatNumber(alarmFirstRow)}-{formatNumber(alarmLastRow)} of {formatNumber(totalActive ?? 0)} active alarms
          </span>
          <div className="alarm-pagination" aria-label="Alarm table pagination">
            <label className="alarm-page-size">
              Rows
              <select value={alarmPageSize} onChange={(e) => setAlarmPageSize(Number(e.target.value))}>
                {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <button type="button" className="alarm-page-btn" disabled={!canPageBack} onClick={() => setAlarmPage((page) => Math.max(1, page - 1))} title="Previous page">
              <ChevronLeft size={14} />
            </button>
            <span className="alarm-page-indicator">Page {formatNumber(alarmPage)} of {formatNumber(alarmPageCount)}</span>
            <button type="button" className="alarm-page-btn" disabled={!canPageForward} onClick={() => setAlarmPage((page) => Math.min(alarmPageCount, page + 1))} title="Next page">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
