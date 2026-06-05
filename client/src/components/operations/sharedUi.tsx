import { Filter, Lock, X, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ApiResult, EndpointLiveStatus, EndpointRisk } from '../../api/netarApi';
import type { ApiRow, DataColumn } from './types';
import { displayValue, formatThroughput, getRowId, riskText, statusClass, statusText } from './dataUtils';

export function PanelFrame({ title, icon: Icon, action, children }: { title: string; icon?: LucideIcon; action?: ReactNode; children: ReactNode }) {
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

export function MetricTile({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string | number; detail: string; icon: LucideIcon; tone?: string }) {
  return (
    <div className={`ops-metric metric-${tone}`}>
      <span><Icon size={17} />{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function EndpointStatusBadge({ status }: { status: EndpointLiveStatus }) {
  return <span className={`status-badge endpoint-${statusClass(status)}`}>{statusText[status]}</span>;
}

export function RiskBadge({ risk }: { risk: EndpointRisk }) {
  return <span className={`risk-badge risk-${statusClass(risk)}`}>{riskText[risk]}</span>;
}

export function ApiNotice({ result, loading, fallback }: { result?: ApiResult; loading?: boolean; fallback?: string }) {
  if (loading) return <p className="api-notice is-loading">Loading live data...</p>;
  if (!result) return <p className="api-notice">Ready.</p>;
  if (result.ok) return <p className="api-notice is-ok">{result.envelope?.msg ?? 'Live data loaded.'}</p>;
  return <p className="api-notice is-warning">{result.envelope?.msg ?? result.error ?? fallback ?? 'The service returned a warning.'}</p>;
}

export function apiResultMessage(result?: ApiResult, fallback = 'The service returned a warning.') {
  return result?.envelope?.msg ?? result?.error ?? (result ? `HTTP ${result.status}` : fallback);
}

export function isApiError(result?: ApiResult) {
  return Boolean(result && !result.ok);
}

export function DataTable({
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

export function FilterStrip({ children }: { children: ReactNode }) {
  return <div className="filter-strip"><Filter size={15} />{children}</div>;
}

export function ActionButton({
  children,
  onClick,
  icon: Icon = Lock,
  variant = 'soft',
  disabled = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'soft' | 'danger' | 'primary';
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button className={`ops-action-button action-${variant}`} type="button" onClick={onClick} disabled={disabled} title={title}>
      <Icon size={14} />
      {children}
    </button>
  );
}

export function DetailDrawer({ row, onClose }: { row: ApiRow | null; onClose: () => void }) {
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

export function ThroughputTrend({ values, loading }: { values: number[]; loading: boolean }) {
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

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (value: string) => void }) {
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

export function PageHeader({ title, detail, icon: Icon, count }: { title: string; detail: string; icon: LucideIcon; count: number }) {
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
