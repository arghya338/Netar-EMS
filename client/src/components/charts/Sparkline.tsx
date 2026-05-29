import type { Accent } from '../../types/dashboard';
import { accentStroke, linePath } from './chartUtils';

interface SparklineProps {
  data: number[];
  accent: Accent;
  className?: string;
  width?: number;
  height?: number;
  muted?: boolean;
}

export function Sparkline({ data, accent, className = '', width = 126, height = 54, muted = false }: SparklineProps) {
  const path = linePath(data, width, height, 3);
  const color = accentStroke[accent];

  return (
    <svg
      className={`sparkline ${className}`}
      style={{ width, height }}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path d={path} fill="none" stroke={color} strokeWidth={muted ? 1.4 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
      {!muted && <path d={path} fill="none" stroke={color} strokeOpacity="0.16" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}
