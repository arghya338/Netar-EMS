import type { Accent } from '../../types/dashboard';

export const accentStroke: Record<Accent, string> = {
  blue: '#3b82f6',
  green: '#20b957',
  purple: '#a855f7',
  orange: '#ff5a1f',
  cyan: '#06b6d4',
  red: '#ff3f32',
  yellow: '#f7b51d',
};

export function linePath(values: number[], width: number, height: number, padding = 2) {
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

export function areaPath(values: number[], width: number, height: number, padding = 2) {
  const path = linePath(values, width, height, padding);
  return `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;
}
