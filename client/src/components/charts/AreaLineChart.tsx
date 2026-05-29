import type { Accent } from '../../types/dashboard';
import { accentStroke } from './chartUtils';

interface Series {
  label: string;
  accent: Accent;
  values: number[];
}

interface AreaLineChartProps {
  labels: string[];
  series: Series[];
}

const yLabels = ['200K', '150K', '100K', '50K', '0'];

export function AreaLineChart({ labels, series }: AreaLineChartProps) {
  const width = 560;
  const height = 170;
  const chartTop = 6;
  const chartHeight = 132;
  const chartLeft = 46;
  const chartWidth = 498;
  const maxValue = 200;
  const scaledPath = (values: number[]) =>
    values
      .map((value, index) => {
        const x = (chartWidth / Math.max(values.length - 1, 1)) * index;
        const y = chartHeight - (Math.max(0, Math.min(value, maxValue)) / maxValue) * chartHeight;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  const scaledArea = (values: number[]) => `${scaledPath(values)} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

  return (
    <div className="area-chart">
      <svg viewBox={`0 0 ${width} ${height}`} aria-label="Active users trend chart">
        <defs>
          {series.map((item) => (
            <linearGradient key={item.label} id={`area-${item.accent}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accentStroke[item.accent]} stopOpacity="0.28" />
              <stop offset="100%" stopColor={accentStroke[item.accent]} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {yLabels.map((label, index) => {
          const y = chartTop + (chartHeight / (yLabels.length - 1)) * index;
          return (
            <g key={label}>
              <text x="8" y={y + 4} className="chart-axis">
                {label}
              </text>
              <line x1={chartLeft} x2={chartLeft + chartWidth} y1={y} y2={y} className="chart-grid-line" />
            </g>
          );
        })}
        {labels.map((label, index) => {
          const x = chartLeft + (chartWidth / (labels.length - 1)) * index;
          return (
            <g key={label}>
              <line x1={x} x2={x} y1={chartTop} y2={chartTop + chartHeight} className="chart-grid-line chart-grid-vertical" />
              <text x={x - 16} y={chartTop + chartHeight + 28} className="chart-axis">
                {label}
              </text>
            </g>
          );
        })}
        <line x1={chartLeft} x2={chartLeft} y1={chartTop} y2={chartTop + chartHeight} className="chart-axis-line" />
        <line x1={chartLeft} x2={chartLeft + chartWidth} y1={chartTop + chartHeight} y2={chartTop + chartHeight} className="chart-axis-line" />
        {series.map((item, index) => {
          const color = accentStroke[item.accent];
          const area = scaledArea(item.values);
          const path = scaledPath(item.values);
          return (
            <g key={item.label} transform={`translate(${chartLeft} ${chartTop})`}>
              {index < 2 && <path d={area} fill={`url(#area-${item.accent})`} opacity={index === 0 ? 1 : 0.65} />}
              <path d={path} fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.label}>
            <i className={`legend-line accent-${item.accent}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
