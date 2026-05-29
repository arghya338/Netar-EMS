import { CalendarDays } from 'lucide-react';
import { performanceTrend, quickMetrics, resourceUtilization } from '../../data/overviewData';
import { accentStroke } from '../charts/chartUtils';
import { Sparkline } from '../charts/Sparkline';

function linePath(values: number[], width: number, height: number, padding = 12) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + index * step;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function MetricStrip() {
  return (
    <section className="quick-metric-grid" aria-label="Network performance summary">
      {quickMetrics.map((metric) => (
        <article className="quick-metric-card" key={metric.label}>
          <div>
            <span>{metric.label}</span>
            <strong>{metric.value} <small>{metric.unit}</small></strong>
            <em>{metric.delta}</em>
          </div>
          <Sparkline data={metric.trend} accent={metric.accent} width={112} height={42} muted />
        </article>
      ))}
    </section>
  );
}

export function PerformanceTrendsPanel() {
  const width = 790;
  const height = 190;
  const chartTop = 24;
  const chartLeft = 52;
  const chartWidth = 705;
  const chartHeight = 116;

  return (
    <section className="panel performance-panel">
      <header className="panel-header performance-header">
        <h2>Performance Trends</h2>
        <div className="trend-tabs" aria-label="Trend metric tabs">
          {['Throughput', 'Latency', 'Packet Drop', 'Connections', 'Active UEs'].map((tab, index) => (
            <button className={index === 0 ? 'is-active' : ''} key={tab} type="button">{tab}</button>
          ))}
        </div>
        <div className="time-tabs" aria-label="Trend time range">
          {['1H', '6H', '12H', '24H'].map((tab, index) => (
            <button className={index === 0 ? 'is-active' : ''} key={tab} type="button">{tab}</button>
          ))}
          <button type="button" aria-label="Pick date"><CalendarDays size={13} /></button>
        </div>
      </header>
      <div className="trend-chart">
        <svg viewBox={`0 0 ${width} ${height}`} aria-label="Throughput trend chart" preserveAspectRatio="none">
          {['2 Gbps', '1.5 Gbps', '1 Gbps', '500 Mbps', '0'].map((label, index) => {
            const y = chartTop + (chartHeight / 4) * index;
            return (
              <g key={label}>
                <text x="16" y={y + 4} className="chart-axis">{label}</text>
                <line x1={chartLeft} x2={chartLeft + chartWidth} y1={y} y2={y} className="chart-grid-line" />
              </g>
            );
          })}
          {performanceTrend.labels.map((label, index) => {
            const x = chartLeft + (chartWidth / (performanceTrend.labels.length - 1)) * index;
            return (
              <text key={label} x={x - 14} y={chartTop + chartHeight + 30} className="chart-axis">{label}</text>
            );
          })}
          {performanceTrend.series.map((series) => (
            <path
              key={series.label}
              d={linePath(series.values, chartWidth, chartHeight, 0)}
              transform={`translate(${chartLeft} ${chartTop})`}
              fill="none"
              stroke={accentStroke[series.accent]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        <div className="chart-legend">
          {performanceTrend.series.map((series) => (
            <span key={series.label}>
              <i className={`legend-line accent-${series.accent}`} />
              {series.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResourceUtilizationPanel() {
  return (
    <section className="panel resource-panel">
      <header className="panel-header">
        <h2>Resource Utilization (Avg)</h2>
      </header>
      <div className="resource-list">
        {resourceUtilization.map((item) => (
          <div className="resource-row" key={item.label}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <small>{item.delta}</small>
            <i>
              <b style={{ width: `${item.percent}%` }} />
            </i>
          </div>
        ))}
      </div>
    </section>
  );
}
