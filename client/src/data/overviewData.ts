import {
  BarChart3,
  Bell,
  Boxes,
  CircleDot,
  Home,
  LineChart,
  Network,
  Router,
  Settings,
  ShieldAlert,
  UserRound,
  Wrench,
  Terminal,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  ActiveFunctionSummary,
  AlarmSummaryItem,
  HealthScoreData,
  IncidentItem,
  LiveAlert,
  NavigationItem,
  PerformanceTrendData,
  QuickMetric,
  ResourceMetric,
  SliceStatusItem,
  TopologyLink,
  TopologyNode,
} from '../types/dashboard';

export const overviewNavigation: NavigationItem[] = [
  { label: 'Overview', icon: Home },
  { label: 'Topology', icon: CircleDot },
  { label: 'Network Elements', icon: Boxes },
  { label: 'NE Configuration', icon: SlidersHorizontal },
  { label: 'Maintenance', icon: Wrench },
  { label: 'Performance', icon: LineChart },
  { label: 'Sessions', icon: Network },
  { label: 'Subscribers', icon: UserRound },
  { label: 'Policy', icon: Router },
  { label: 'Alarms', icon: ShieldAlert },
  { label: 'Diagnostics', icon: Terminal },
  { label: 'Reports', icon: Bell },
  { label: 'Settings', icon: Settings },
];

export const healthScore: HealthScoreData = {
  score: 92,
  label: 'Excellent',
  caption: 'All systems operational',
  trend: [18, 20, 19, 21, 24, 22, 20, 25, 27, 23, 24, 28],
};

export const alarmSummary: AlarmSummaryItem[] = [
  { label: 'Critical', value: 3, accent: 'red' },
  { label: 'Major', value: 12, accent: 'orange' },
  { label: 'Minor', value: 24, accent: 'yellow' },
  { label: 'Warning', value: 18, accent: 'blue' },
];

export const activeFunctionSummary: ActiveFunctionSummary = {
  online: 20,
  total: 20,
  caption: '100% Online',
};

export const sliceStatus: SliceStatusItem[] = [
  { name: 'eMBB', count: 3, percent: 60, accent: 'green' },
  { name: 'URLLC', count: 1, percent: 20, accent: 'orange' },
  { name: 'mMTC', count: 1, percent: 20, accent: 'blue' },
];

export const topologyNodes: TopologyNode[] = [
  {
    id: 'NSSF',
    label: 'NSSF',
    role: 'Network Slice Selection Function',
    status: 'healthy',
    x: 340,
    y: 37,
    width: 92,
    height: 32,
    metrics: {
      cpu: '15%',
      memory: '34%',
      sessions: '18.2K',
      lastEvent: 'Slice policy sync completed 2m ago',
      interfaces: ['Nnssf', 'Namf'],
      relatedAlerts: ['No active alerts'],
    },
  },
  {
    id: 'NRF',
    label: 'NRF',
    role: 'Network Repository Function',
    status: 'healthy',
    x: 525,
    y: 37,
    width: 92,
    height: 32,
    metrics: {
      cpu: '18%',
      memory: '37%',
      sessions: '21.8K',
      lastEvent: 'Registration cache refreshed just now',
      interfaces: ['Nnrf', 'Nservice'],
      relatedAlerts: ['No active alerts'],
    },
  },
  {
    id: 'UDR',
    label: 'UDR',
    role: 'Unified Data Repository',
    status: 'healthy',
    x: 695,
    y: 37,
    width: 92,
    height: 32,
    metrics: {
      cpu: '22%',
      memory: '40%',
      sessions: '33.4K',
      lastEvent: 'Database replication healthy 1m ago',
      interfaces: ['Nudr', 'Nudm'],
      relatedAlerts: ['UDM Database Replication Lag'],
    },
  },
  {
    id: 'AUSF',
    label: 'AUSF',
    role: 'Authentication Server Function',
    status: 'healthy',
    x: 270,
    y: 126,
    width: 92,
    height: 32,
    metrics: {
      cpu: '17%',
      memory: '36%',
      sessions: '44.1K',
      lastEvent: 'Authentication challenge rate normal',
      interfaces: ['Nausf', 'Namf'],
      relatedAlerts: ['Authentication Fail AUSF-01'],
    },
  },
  {
    id: 'AMF',
    label: 'AMF',
    role: 'Access and Mobility Management Function',
    status: 'warning',
    x: 475,
    y: 126,
    width: 92,
    height: 32,
    metrics: {
      cpu: '94%',
      memory: '67%',
      sessions: '162.3K',
      lastEvent: 'High CPU utilization for 5m',
      interfaces: ['Namf', 'N1', 'N2', 'Nsmf'],
      relatedAlerts: ['AMF High CPU Utilization', 'SMF Association Failure'],
    },
  },
  {
    id: 'UDM',
    label: 'UDM',
    role: 'Unified Data Management',
    status: 'healthy',
    x: 695,
    y: 126,
    width: 92,
    height: 32,
    metrics: {
      cpu: '22%',
      memory: '40%',
      sessions: '59.7K',
      lastEvent: 'Subscriber profile lookup stable',
      interfaces: ['Nudm', 'Nudr'],
      relatedAlerts: ['UDM Database Replication Lag'],
    },
  },
  {
    id: 'PCF',
    label: 'PCF',
    role: 'Policy Control Function',
    status: 'healthy',
    x: 850,
    y: 126,
    width: 92,
    height: 32,
    metrics: {
      cpu: '24%',
      memory: '41%',
      sessions: '28.9K',
      lastEvent: 'Policy decision latency nominal',
      interfaces: ['Npcf', 'Nsmf'],
      relatedAlerts: ['No active alerts'],
    },
  },
  {
    id: 'SMF',
    label: 'SMF',
    role: 'Session Management Function',
    status: 'healthy',
    x: 445,
    y: 205,
    width: 140,
    height: 38,
    metrics: {
      cpu: '31%',
      memory: '45%',
      sessions: '316.5K',
      lastEvent: 'PDU sessions steady',
      interfaces: ['Nsmf', 'N4', 'N6'],
      relatedAlerts: ['SMF Association Failure'],
    },
  },
];

export const topologyLinks: TopologyLink[] = [
  { id: 'nssf-amf', type: 'control', points: '385,69 385,98 520,98 520,126', label: 'Nnssf', labelX: 392, labelY: 84 },
  { id: 'nrf-amf', type: 'control', points: '571,69 571,98 520,98 520,126', label: 'Nnrf', labelX: 579, labelY: 84 },
  { id: 'udr-udm', type: 'control', points: '741,69 741,126', label: 'Nudr', labelX: 752, labelY: 92 },
  { id: 'ausf-amf', type: 'control', points: '362,142 475,142', label: 'Nausf', labelX: 310, labelY: 178 },
  { id: 'amf-udm', type: 'control', points: '567,142 695,142', label: 'Nudm', labelX: 742, labelY: 176 },
  { id: 'pcf-smf', type: 'control', points: '896,158 896,226 585,226', label: 'Npcf', labelX: 884, labelY: 178 },
  { id: 'amf-smf', type: 'control', points: '521,158 521,205', label: 'Namf', labelX: 532, labelY: 192 },
  { id: 'nssf-pcf', type: 'control', points: '385,69 385,101 896,101 896,126' },
  { id: 'gnb-smf', type: 'user', points: '110,226 445,226', label: 'N3', labelX: 285, labelY: 214 },
  { id: 'smf-dn', type: 'user', points: '585,226 954,226', label: 'N6', labelX: 910, labelY: 214 },
];

export const liveAlerts: LiveAlert[] = [
  {
    id: 'alert-amf-cpu',
    title: 'AMF High CPU Utilization',
    severity: 'Critical',
    source: 'AMF-01',
    description: 'CPU usage above 90% for 5m',
    timestamp: '10:24:31',
    age: 'Just now',
    accent: 'red',
  },
  {
    id: 'alert-upf-loss',
    title: 'UPF Packet Loss Detected',
    severity: 'Major',
    source: 'UPF-02',
    description: 'Packet loss above 2% on interface N6',
    timestamp: '10:22:18',
    age: '2m ago',
    accent: 'orange',
  },
  {
    id: 'alert-smf-association',
    title: 'SMF Association Failure',
    severity: 'Major',
    source: 'SMF-01',
    description: 'Association with UPF-03 failed',
    timestamp: '10:20:05',
    age: '4m ago',
    accent: 'orange',
  },
  {
    id: 'alert-latency',
    title: 'High Latency Detected',
    severity: 'Minor',
    source: 'UPF-01',
    description: 'Latency above 50ms on N6 interface',
    timestamp: '10:18:42',
    age: '5m ago',
    accent: 'yellow',
  },
  {
    id: 'alert-udm-lag',
    title: 'UDM Database Replication Lag',
    severity: 'Warning',
    source: 'UDM-01',
    description: 'Replication lag above threshold',
    timestamp: '10:15:33',
    age: '8m ago',
    accent: 'blue',
  },
];

export const incidents: IncidentItem[] = [
  {
    id: 'maintenance-upf',
    title: 'Planned Maintenance',
    detail: 'UPF-02 Maintenance May 25, 02:00 - 04:00 UTC',
    status: 'Upcoming',
    accent: 'blue',
  },
  {
    id: 'inc-3487',
    title: 'Incident #INC-3487',
    detail: 'High packet loss in UPF-02 Opened: 10:22 UTC',
    status: 'Open',
    accent: 'red',
  },
  {
    id: 'inc-3481',
    title: 'Incident #INC-3481',
    detail: 'SMF-01 intermittent failures Opened: May 24, 21:15 UTC',
    status: 'In Progress',
    accent: 'yellow',
  },
];

export const quickMetrics: QuickMetric[] = [
  { label: 'Throughput (DL)', value: '1.25', unit: 'Gbps', delta: '12.5% vs 1h ago', trend: [20, 28, 34, 29, 38, 41, 36, 45, 39, 44, 30], accent: 'blue' },
  { label: 'Throughput (UL)', value: '642', unit: 'Mbps', delta: '8.3% vs 1h ago', trend: [18, 23, 22, 30, 28, 35, 31, 38, 36, 34, 26], accent: 'purple' },
  { label: 'Latency (Avg)', value: '18.7', unit: 'ms', delta: '15.4% vs 1h ago', trend: [22, 21, 25, 30, 28, 34, 31, 36, 29, 33, 27], accent: 'green' },
  { label: 'Packet Drop Rate', value: '0.08', unit: '%', delta: '27.1% vs 1h ago', trend: [17, 25, 20, 28, 22, 24, 19, 26, 23, 27, 18], accent: 'yellow' },
];

export const performanceTrend: PerformanceTrendData = {
  labels: ['09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15'],
  series: [
    {
      label: 'DL Throughput',
      accent: 'blue',
      values: [112, 124, 118, 151, 139, 130, 156, 148, 166, 161, 141, 132, 120, 136, 144, 133, 128, 141, 149, 135, 131, 140, 151, 143, 136, 132, 145, 158, 139, 134, 146, 152],
    },
    {
      label: 'UL Throughput',
      accent: 'purple',
      values: [48, 54, 44, 62, 58, 66, 52, 71, 69, 53, 49, 45, 56, 61, 50, 48, 57, 64, 59, 55, 51, 63, 68, 58, 54, 49, 56, 62, 52, 50, 58, 61],
    },
  ],
};

export const resourceUtilization: ResourceMetric[] = [
  { label: 'CPU Utilization', value: '28%', percent: 28, delta: '6% vs 1h ago' },
  { label: 'Memory Utilization', value: '41%', percent: 41, delta: '3% vs 1h ago' },
  { label: 'Disk Utilization', value: '35%', percent: 35, delta: '2% vs 1h ago' },
];

export const topologyToolbar = {
  layout: 'Service Flow',
  view: 'View Options',
};
