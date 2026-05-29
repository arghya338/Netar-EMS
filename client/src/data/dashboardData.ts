import {
  Activity,
  BarChart3,
  BadgeCheck,
  Bell,
  Boxes,
  ClipboardList,
  Database,
  Gauge,
  Home,
  LayoutDashboard,
  LockKeyhole,
  Network,
  Phone,
  RadioTower,
  Settings,
  SlidersHorizontal,
  Users,
  UserRound,
  Wrench,
} from 'lucide-react';
import type {
  ActivityLogItem,
  AlarmSource,
  MetricCardData,
  NavigationItem,
  NetworkFunctionRow,
  RanMetric,
  RanStatus,
  ResourceUsage,
  SliceFootStat,
  SliceKpi,
  TopSite,
} from '../types/dashboard';

export const navigationItems: NavigationItem[] = [
  { label: 'Overview', icon: Home },
  { label: 'Topology', icon: RadioTower },
  { label: 'Network Functions', icon: Boxes },
  { label: 'Alarms & Events', icon: Bell },
  { label: 'Performance', icon: Gauge },
  { label: 'Slices', icon: Network },
  { label: 'Subscribers', icon: Users },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Reports', icon: ClipboardList },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Settings', icon: Settings },
];

export const metricCards: MetricCardData[] = [
  {
    title: 'Active Users (5G)',
    value: '128.7K',
    delta: '12.4%',
    caption: 'vs last 15 min',
    accent: 'blue',
    icon: UserRound,
    sparkline: [34, 26, 42, 48, 31, 52, 56, 30, 24, 36, 39, 58, 62, 41, 38],
  },
  {
    title: 'Active Users (4G)',
    value: '45.3K',
    delta: '8.7%',
    caption: 'vs last 15 min',
    accent: 'green',
    icon: BadgeCheck,
    sparkline: [18, 20, 30, 56, 38, 61, 48, 52, 35, 31, 24, 28, 47, 19, 18],
  },
  {
    title: 'Registered Users',
    value: '2.34M',
    delta: '3.1%',
    caption: 'vs last 15 min',
    accent: 'purple',
    icon: Users,
    sparkline: [24, 36, 32, 58, 67, 35, 25, 38, 30, 34, 55, 61, 43, 48, 35],
  },
  {
    title: 'VoIP Users',
    value: '12.6K',
    delta: '6.3%',
    caption: 'vs last 15 min',
    accent: 'orange',
    icon: Phone,
    sparkline: [48, 31, 29, 43, 55, 26, 34, 44, 28, 22, 34, 20, 27, 22, 28],
  },
  {
    title: 'Total Throughput',
    value: '1.82 Tbps',
    delta: '15.6%',
    caption: 'vs last 15 min',
    accent: 'cyan',
    icon: Activity,
    sparkline: [41, 57, 48, 61, 52, 66, 47, 50, 68, 54, 43, 49, 64, 58, 71],
  },
  {
    title: 'Total Sessions',
    value: '316.5K',
    delta: '9.8%',
    caption: 'vs last 15 min',
    accent: 'cyan',
    icon: Database,
    sparkline: [15, 17, 24, 28, 43, 21, 18, 26, 31, 22, 28, 47, 35, 18, 19],
  },
];

export const networkFunctions: NetworkFunctionRow[] = [
  { name: 'AMF', instances: '6 / 6', health: '100%', cpu: '28%', memory: '42%', trend: [20, 34, 29, 51, 36, 61, 38] },
  { name: 'SMF', instances: '6 / 6', health: '100%', cpu: '31%', memory: '45%', trend: [16, 30, 24, 58, 39, 70, 46] },
  { name: 'UPF', instances: '8 / 8', health: '100%', cpu: '36%', memory: '48%', trend: [24, 41, 32, 62, 43, 69, 52] },
  { name: 'UDM', instances: '4 / 4', health: '100%', cpu: '22%', memory: '40%', trend: [20, 31, 25, 45, 35, 57, 42] },
  { name: 'PCF', instances: '4 / 4', health: '100%', cpu: '24%', memory: '41%', trend: [18, 29, 24, 42, 30, 54, 35] },
  { name: 'NRF', instances: '3 / 3', health: '100%', cpu: '18%', memory: '37%', trend: [15, 26, 20, 38, 24, 42, 31] },
  { name: 'AUSF', instances: '3 / 3', health: '100%', cpu: '17%', memory: '36%', trend: [16, 22, 18, 33, 25, 45, 34] },
  { name: 'NSSF', instances: '2 / 2', health: '100%', cpu: '15%', memory: '34%', trend: [12, 21, 18, 30, 20, 39, 27] },
];

export const sliceKpis: SliceKpi[] = [
  { name: 'eMBB', sessions: '162.3K', throughput: '952 Gbps', percent: 68, accent: 'blue' },
  { name: 'URLLC', sessions: '23.8K', throughput: '212 Gbps', percent: 15, accent: 'purple' },
  { name: 'mMTC', sessions: '98.7K', throughput: '134 Gbps', percent: 9, accent: 'cyan' },
  { name: 'VoIP / IMS', sessions: '31.7K', throughput: '84 Gbps', percent: 6, accent: 'orange' },
];

export const sliceFootStats: SliceFootStat[] = [
  { label: 'PDU Sessions', value: '316.5K', delta: '9.8%' },
  { label: 'Session Setup', value: '2.41K/s', delta: '7.6%' },
  { label: 'Avg. Session Time', value: '18m 32s', delta: '4.3%' },
  { label: 'SMF Rule Usage', value: '78%', delta: '6.1%' },
];

export const ranStatuses: RanStatus[] = [
  { label: 'Healthy', count: '17', share: '(85%)', accent: 'green' },
  { label: 'Degraded', count: '2', share: '(10%)', accent: 'yellow' },
  { label: 'Critical', count: '1', share: '(5%)', accent: 'red' },
];

export const ranMetrics: RanMetric[] = [
  { label: '5G gNB Sites', value: '12', delta: '1' },
  { label: '4G eNB Sites', value: '8', delta: '-' },
  { label: 'Capacity Utilization', value: '72%', delta: '5%' },
];

export const alarmSources: AlarmSource[] = [
  { source: 'gNB-Site-107', alarms: 24, critical: 5, trend: [28, 20, 36, 24, 38, 26, 42] },
  { source: 'UPF-Cluster-2', alarms: 19, critical: 3, trend: [18, 30, 22, 34, 27, 41, 32] },
  { source: 'AMF-Cluster-1', alarms: 14, critical: 2, trend: [16, 22, 18, 31, 23, 35, 27] },
  { source: 'eNB-Site-103', alarms: 12, critical: 1, trend: [12, 25, 18, 30, 20, 32, 24] },
  { source: 'SMF-Cluster-1', alarms: 9, critical: 2, trend: [10, 21, 14, 28, 16, 29, 20] },
];

export const activityLog: ActivityLogItem[] = [
  { time: '15:02:21', userId: '001010123456789', activity: 'Registered', source: 'AMF-01', status: 'Success' },
  { time: '15:01:18', userId: '001010987654321', activity: 'PDU Session Created', source: 'SMF-02', status: 'Success' },
  { time: '15:01:05', userId: '001010112233445', activity: 'VoIP Call Setup', source: 'IMS-01', status: 'Success' },
  { time: '15:00:12', userId: '00101055667889', activity: 'PDU Session Released', source: 'SMF-03', status: 'Info' },
  { time: '15:00:09', userId: '001010998877665', activity: 'Deregistered', source: 'AMF-02', status: 'Success' },
  { time: '15:00:05', userId: '001010443322110', activity: 'Authentication Fail', source: 'AUSF-01', status: 'Warning', danger: true },
];

export const topSites: TopSite[] = [
  { site: 'gNB-Site-101', users: '22.6K', percent: 88 },
  { site: 'gNB-Site-107', users: '18.3K', percent: 70 },
  { site: 'gNB-Site-103', users: '15.7K', percent: 54 },
  { site: 'gNB-Site-112', users: '12.9K', percent: 41 },
  { site: 'gNB-Site-105', users: '11.4K', percent: 36 },
];

export const activeUsersSeries = {
  labels: ['14:45', '14:48', '14:51', '14:54', '14:57', '15:00'],
  series: [
    {
      label: '5G Active Users',
      accent: 'blue' as const,
      values: [130, 132, 137, 134, 142, 155, 170, 151, 173, 174, 140, 132, 150, 153, 133, 145, 168, 159, 166, 183, 175, 171, 178, 170, 188, 179, 181, 172, 175],
    },
    {
      label: '4G Active Users',
      accent: 'green' as const,
      values: [78, 75, 83, 85, 92, 86, 99, 88, 96, 91, 94, 87, 91, 94, 91, 96, 105, 103, 92, 112, 104, 107, 98, 101, 116, 108, 106, 99, 105],
    },
    {
      label: 'VoIP Users',
      accent: 'orange' as const,
      values: [18, 14, 12, 19, 13, 16, 24, 17, 21, 19, 26, 24, 31, 23, 21, 28, 34, 29, 32, 35, 31, 36, 32, 38, 36, 41, 34, 39, 44],
    },
  ],
};

export const resources: ResourceUsage[] = [
  { label: 'CPU Usage', value: '32%', accent: 'green', percent: 32 },
  { label: 'Memory Usage', value: '48%', accent: 'blue', percent: 48 },
  { label: 'Disk Usage', value: '36%', accent: 'blue', percent: 36 },
];
