import {
  AlertCircle,
  AlertTriangle,
  BellRing,
  ChevronRight,
  Info,
  Server,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import type { CSSProperties } from 'react';
import {
  buildSeverityCounts,
  formatFlowCounter,
  formatNumber,
  formatThroughput,
  severityTotal,
  type ApiRow,
} from '../../shared';
import { averageResourceMetric, functionMix } from '../model';

export interface ServiceMetric {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  state?: 'good' | 'warning' | 'critical' | 'neutral';
  loading?: boolean;
}

export function SkeletonLine({ width = '100%' }: { width?: string }) {
  return <span className="ref-skeleton-line" style={{ width }} aria-hidden="true" />;
}

export function Sparkline({ color = '#2563eb' }: { color?: string }) {
  return (
    <svg className="ref-sparkline" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points="0,25 8,22 15,23 23,18 31,20 38,13 46,16 54,10 62,14 70,9 78,15 86,12 94,17 100,11"
        style={{ stroke: color }}
      />
    </svg>
  );
}

export function NetworkHealthCard({ online, total, loading }: { online: number; total: number; loading?: boolean }) {
  const score = total > 0 ? Math.round((online / total) * 100) : 0;
  const offline = Math.max(0, total - online);
  const label = total === 0 ? 'No inventory' : score >= 80 ? 'Excellent' : score >= 60 ? 'Attention' : 'Critical';

  return (
    <section className={`ref-card ref-health-card ${loading ? 'is-loading' : ''}`} aria-labelledby="network-health-title">
      <header>
        <h2 id="network-health-title">Network Health Score</h2>
        <span>{loading ? 'Loading' : label}</span>
      </header>
      {loading ? (
        <div className="ref-health-loading">
          <SkeletonLine width="88px" />
          <div>
            <SkeletonLine width="74%" />
            <SkeletonLine width="58%" />
            <SkeletonLine width="92%" />
          </div>
        </div>
      ) : (
        <div className="ref-health-body is-compact">
          <div className="ref-health-ring" style={{ '--score': `${score}%` } as CSSProperties} aria-label={`Network health score ${score} out of 100`}>
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
              <Sparkline color={score >= 80 ? '#16a34a' : '#ea580c'} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export function AlarmSummaryCard({
  counts,
  loading,
  onNavigate,
}: {
  counts: ReturnType<typeof buildSeverityCounts>;
  loading?: boolean;
  onNavigate?: (page: string) => void;
}) {
  const items = [
    { label: 'Critical', value: counts.critical, className: 'critical', icon: ShieldAlert },
    { label: 'Major', value: counts.major, className: 'major', icon: AlertTriangle },
    { label: 'Minor', value: counts.minor, className: 'minor', icon: AlertCircle },
    { label: 'Warning', value: counts.warning, className: 'warning', icon: Info },
  ];

  return (
    <section className={`ref-card ref-alarm-summary ${loading ? 'is-loading' : ''}`} aria-labelledby="alarm-summary-title">
      <header>
        <span className="ref-card-title-icon is-alarm" aria-hidden="true"><BellRing size={15} /></span>
        <div>
          <h2 id="alarm-summary-title">Alarm Summary</h2>
          <span>{loading ? 'Checking alarm feed' : `${formatNumber(severityTotal(counts))} active alarms`}</span>
        </div>
        <button type="button" onClick={() => onNavigate?.('Alarms')} aria-label="Open alarm management">
          View alarms <ChevronRight size={13} />
        </button>
      </header>
      <div className="ref-alarm-items">
        {items.map((item) => (
          <div key={item.label} className={`ref-alarm-item is-${item.className}`}>
            <span><item.icon size={13} />{item.label}</span>
            <strong>{loading ? '—' : formatNumber(item.value)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActiveFunctionsCard({ online, total, loading }: { online: number; total: number; loading?: boolean }) {
  const percent = total > 0 ? Math.round((online / total) * 100) : 0;

  return (
    <section className={`ref-card ref-active-card ${loading ? 'is-loading' : ''}`} aria-labelledby="active-functions-title">
      <h2 id="active-functions-title">Active Network Functions</h2>
      <div>
        <span className="ref-active-icon"><Server size={20} /></span>
        <strong>{loading ? '—' : formatNumber(online)} <small>/ {loading ? '—' : formatNumber(total)}</small></strong>
        <em>{loading ? 'Loading inventory' : `${percent}% Online`}</em>
      </div>
    </section>
  );
}

export function FunctionMixCard({ rows, loading }: { rows: ApiRow[]; loading?: boolean }) {
  const items = functionMix(rows);

  return (
    <section className={`ref-card ref-slice-card ${loading ? 'is-loading' : ''}`} aria-labelledby="function-mix-title">
      <header>
        <h2 id="function-mix-title">Function Mix</h2>
        <button type="button" aria-label="Inventory data is loaded from live network elements">
          Live inventory <ChevronRight size={13} />
        </button>
      </header>
      {loading ? (
        <div className="ref-slice-loading">
          <SkeletonLine width="72px" />
          <div>
            <SkeletonLine width="86%" />
            <SkeletonLine width="68%" />
            <SkeletonLine width="74%" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <p className="ref-empty-state">No network functions are available from the live inventory.</p>
      ) : (
        <div className="ref-slice-body">
          <div
            className="ref-slice-donut"
            style={{
              background: `conic-gradient(${items.map((item, index) => {
                const start = items.slice(0, index).reduce((sum, entry) => sum + entry.percent, 0);
                return `${item.color} ${start}% ${Math.min(100, start + item.percent)}%`;
              }).join(', ')})`,
            }}
          />
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
      )}
    </section>
  );
}

export function ServiceMetricStrip({ metrics }: { metrics: ServiceMetric[] }) {
  return (
    <section className="ref-service-strip" aria-label="Live service metrics">
      {metrics.map((metric) => (
        <article key={metric.id} className={`ref-service-metric is-${metric.state ?? 'neutral'} ${metric.loading ? 'is-loading' : ''}`}>
          <span className="ref-service-icon"><metric.icon size={16} /></span>
          <div>
            <span>{metric.title}</span>
            <strong>{metric.loading ? '—' : metric.value}</strong>
            <small>{metric.detail}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

export function RefMetricCard({ title, value, delta, color }: { title: string; value: string; delta: string; color: string }) {
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

export function PerformanceTrendPanel({ up, down, loading }: { up: number | null; down: number | null; loading?: boolean }) {
  const dl = down && down > 0 ? formatFlowCounter(down) : '0 B';
  const ul = up && up > 0 ? formatFlowCounter(up) : '0 B';
  const hasTraffic = Boolean((up && up > 0) || (down && down > 0));

  return (
    <section className={`ref-card ref-trend-panel ${loading ? 'is-loading' : ''}`} aria-labelledby="performance-trend-title">
      <header>
        <h2 id="performance-trend-title">Performance Trends</h2>
        <div role="tablist" aria-label="Performance trend mode">
          <button type="button" className="is-active" role="tab" aria-selected="true">Throughput</button>
          <button type="button" role="tab" aria-selected="false">Connections</button>
          <button type="button" role="tab" aria-selected="false">Sessions</button>
        </div>
      </header>
      <div className={`ref-trend-chart ${!hasTraffic ? 'is-zero' : ''}`}>
        {loading ? (
          <div className="ref-trend-empty">
            <strong>Sampling UPF counters</strong>
            <span>Waiting for the latest throughput response.</span>
          </div>
        ) : hasTraffic ? (
          <svg viewBox="0 0 800 180" preserveAspectRatio="none" aria-label="Throughput trend">
            <polyline className="dl" points="0,110 45,94 90,116 135,78 180,88 225,66 270,96 315,82 360,102 405,74 450,91 495,84 540,105 585,78 630,96 675,88 720,104 765,82 800,92" />
            <polyline className="ul" points="0,142 45,132 90,145 135,120 180,136 225,126 270,144 315,132 360,145 405,128 450,141 495,136 540,150 585,130 630,142 675,137 720,149 765,134 800,139" />
          </svg>
        ) : (
          <div className="ref-trend-empty">
            <strong>No live throughput reported</strong>
            <span>The UPF API is reachable, but current uplink/downlink counters are zero.</span>
          </div>
        )}
      </div>
      <footer>
        <span><i className="dl" />DL Throughput {down !== null ? formatThroughput(down) : dl}</span>
        <span><i className="ul" />UL Throughput {up !== null ? formatThroughput(up) : ul}</span>
      </footer>
    </section>
  );
}

export function ResourcePanel({ rows, loading }: { rows: ApiRow[]; loading?: boolean }) {
  const items = [
    { label: 'CPU Utilization', value: averageResourceMetric(rows, 'cpu') },
    { label: 'Memory Utilization', value: averageResourceMetric(rows, 'memory') },
    { label: 'Disk Utilization', value: averageResourceMetric(rows, 'disk') },
  ];

  return (
    <section className={`ref-card ref-resource-panel ${loading ? 'is-loading' : ''}`} aria-labelledby="resource-utilization-title">
      <h2 id="resource-utilization-title">Resource Utilization</h2>
      {items.map((item) => {
        const value = item.value ?? 0;
        return (
          <div key={item.label}>
            <span>{item.label}</span>
            <strong>{loading ? '—' : item.value === null ? 'N/A' : `${value.toFixed(value >= 10 ? 0 : 1)}%`}</strong>
            <i><b style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></i>
            <small>{item.value === null && !loading ? 'No resource telemetry returned' : 'Live NE average'}</small>
          </div>
        );
      })}
    </section>
  );
}
