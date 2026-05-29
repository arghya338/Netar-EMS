import type { LucideIcon } from 'lucide-react';

export type Accent = 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'red' | 'yellow';
export type TopologyStatus = 'healthy' | 'warning' | 'critical' | 'unknown' | 'inactive';

export interface NavigationItem {
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface MetricCardData {
  title: string;
  value: string;
  delta: string;
  caption: string;
  accent: Accent;
  sparkline: number[];
  icon: LucideIcon;
}

export interface NetworkFunctionRow {
  name: string;
  instances: string;
  health: string;
  cpu: string;
  memory: string;
  trend: number[];
}

export interface SliceKpi {
  name: string;
  sessions: string;
  throughput: string;
  percent: number;
  accent: Accent;
}

export interface SliceFootStat {
  label: string;
  value: string;
  delta: string;
}

export interface RanStatus {
  label: string;
  count: string;
  share: string;
  accent: Accent;
}

export interface RanMetric {
  label: string;
  value: string;
  delta: string;
}

export interface AlarmSource {
  source: string;
  alarms: number;
  critical: number;
  trend: number[];
}

export interface ActivityLogItem {
  time: string;
  userId: string;
  activity: string;
  source: string;
  status: 'Success' | 'Info' | 'Warning';
  danger?: boolean;
}

export interface TopSite {
  site: string;
  users: string;
  percent: number;
}

export interface ResourceUsage {
  label: string;
  value: string;
  accent: Accent;
  percent: number;
}

export interface HealthScoreData {
  score: number;
  label: string;
  caption: string;
  trend: number[];
}

export interface AlarmSummaryItem {
  label: string;
  value: number;
  accent: Accent;
}

export interface ActiveFunctionSummary {
  online: number;
  total: number;
  caption: string;
}

export interface SliceStatusItem {
  name: string;
  count: number;
  percent: number;
  accent: Accent;
}

export interface TopologyNodeMetrics {
  cpu: string;
  memory: string;
  sessions: string;
  lastEvent: string;
  interfaces: string[];
  relatedAlerts: string[];
}

export interface TopologyNode {
  id: string;
  label: string;
  role: string;
  status: TopologyStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  metrics: TopologyNodeMetrics;
}

export interface TopologyLink {
  id: string;
  points: string;
  type: 'control' | 'user' | 'inactive';
  label?: string;
  labelX?: number;
  labelY?: number;
}

export interface LiveAlert {
  id: string;
  title: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Warning';
  source: string;
  description: string;
  timestamp: string;
  age: string;
  accent: Accent;
}

export interface IncidentItem {
  id: string;
  title: string;
  detail: string;
  status: 'Upcoming' | 'Open' | 'In Progress';
  accent: Accent;
}

export interface QuickMetric {
  label: string;
  value: string;
  unit?: string;
  delta: string;
  trend: number[];
  accent: Accent;
}

export interface PerformanceSeries {
  label: string;
  accent: Accent;
  values: number[];
}

export interface PerformanceTrendData {
  labels: string[];
  series: PerformanceSeries[];
}

export interface ResourceMetric {
  label: string;
  value: string;
  percent: number;
  delta: string;
}
