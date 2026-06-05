import { displayValue, isOnlineNe, isRecord, toNumber, type ApiRow } from '../shared';

export type TopologyStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type TopologyLinkKind = 'control' | 'user' | 'inactive';

export interface TopologyNodeSpec {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  plane?: 'management' | 'core' | 'service' | 'legacy';
}

export interface TopologyNodeView extends TopologyNodeSpec {
  rows: ApiRow[];
  online: number;
  total: number;
  status: TopologyStatus;
  name: string;
  ip: string;
  version: string;
}

export interface TopologyLinkSpec {
  id: string;
  label: string;
  kind: TopologyLinkKind;
  path: string;
  labelX: number;
  labelY: number;
  from: string;
  to: string;
}

export const TOPOLOGY_VIEWBOX = {
  width: 1000,
  height: 350,
};

export const CORE_FUNCTIONS = ['OMC', 'AMF', 'AUSF', 'UDM', 'IMS', 'PCF', 'SMF', 'UPF', 'MME', 'SMSC'] as const;

export const TOPOLOGY_NODES: TopologyNodeSpec[] = [
  { id: 'omc', label: 'OMC', x: 34, y: 52, width: 112, height: 46, plane: 'management' },
  { id: 'ausf', label: 'AUSF', x: 236, y: 52, width: 112, height: 46, plane: 'core' },
  { id: 'udm', label: 'UDM', x: 430, y: 52, width: 112, height: 46, plane: 'core' },
  { id: 'ims', label: 'IMS', x: 748, y: 52, width: 112, height: 46, plane: 'service' },
  { id: 'amf', label: 'AMF', x: 236, y: 144, width: 112, height: 46, plane: 'core' },
  { id: 'pcf', label: 'PCF', x: 624, y: 144, width: 112, height: 46, plane: 'core' },
  { id: 'smf', label: 'SMF', x: 430, y: 200, width: 126, height: 46, plane: 'core' },
  { id: 'smsc', label: 'SMSC', x: 236, y: 270, width: 112, height: 46, plane: 'service' },
  { id: 'upf', label: 'UPF', x: 430, y: 270, width: 126, height: 46, plane: 'core' },
  { id: 'mme', label: 'MME', x: 104, y: 144, width: 112, height: 46, plane: 'legacy' },
];

export const TOPOLOGY_LINKS: TopologyLinkSpec[] = [
  {
    id: 'oam-omc-amf',
    label: 'OAM',
    kind: 'inactive',
    path: 'M146 75 H176 V167 H236',
    labelX: 164,
    labelY: 67,
    from: 'omc',
    to: 'amf',
  },
  {
    id: 'sbi-ausf-udm',
    label: '',
    kind: 'control',
    path: 'M348 75 H430',
    labelX: 0,
    labelY: 0,
    from: 'ausf',
    to: 'udm',
  },
  {
    id: 'sbi-amf-ausf',
    label: '',
    kind: 'control',
    path: 'M292 98 V144',
    labelX: 0,
    labelY: 0,
    from: 'amf',
    to: 'ausf',
  },
  {
    id: 'sbi-amf-smf',
    label: 'SBI',
    kind: 'control',
    path: 'M348 167 H398 C420 167 430 181 430 200',
    labelX: 378,
    labelY: 158,
    from: 'amf',
    to: 'smf',
  },
  {
    id: 'sbi-smf-pcf',
    label: '',
    kind: 'control',
    path: 'M556 223 H624 V190',
    labelX: 0,
    labelY: 0,
    from: 'smf',
    to: 'pcf',
  },
  {
    id: 'sbi-pcf-udm',
    label: '',
    kind: 'control',
    path: 'M680 144 V75 H542',
    labelX: 0,
    labelY: 0,
    from: 'pcf',
    to: 'udm',
  },
  {
    id: 'ims-service',
    label: '',
    kind: 'inactive',
    path: 'M680 144 V75 H748',
    labelX: 0,
    labelY: 0,
    from: 'pcf',
    to: 'ims',
  },
  {
    id: 'n2',
    label: 'N2',
    kind: 'control',
    path: 'M96 236 V167 H236',
    labelX: 158,
    labelY: 158,
    from: 'gnb',
    to: 'amf',
  },
  {
    id: 'n26',
    label: '',
    kind: 'control',
    path: 'M216 167 H236',
    labelX: 0,
    labelY: 0,
    from: 'amf',
    to: 'mme',
  },
  {
    id: 'n3',
    label: 'N3',
    kind: 'user',
    path: 'M122 293 H430',
    labelX: 256,
    labelY: 283,
    from: 'gnb',
    to: 'upf',
  },
  {
    id: 'n4',
    label: 'N4',
    kind: 'control',
    path: 'M493 246 V270',
    labelX: 506,
    labelY: 262,
    from: 'smf',
    to: 'upf',
  },
  {
    id: 'n6',
    label: 'N6',
    kind: 'user',
    path: 'M556 293 H856',
    labelX: 810,
    labelY: 283,
    from: 'upf',
    to: 'dn',
  },
];

export function neType(row: ApiRow) {
  return displayValue(row.neType).toUpperCase();
}

export function rowsForType(rows: ApiRow[], type: string) {
  return rows.filter((row) => neType(row) === type);
}

export function topologyStatus(total: number, online: number): TopologyStatus {
  if (total === 0) return 'unknown';
  if (online === 0) return 'critical';
  if (online < total) return 'warning';
  return 'healthy';
}

export function buildTopologyNodes(rows: ApiRow[]): TopologyNodeView[] {
  return TOPOLOGY_NODES.flatMap((spec) => {
    const matches = rowsForType(rows, spec.label);
    if (matches.length === 0) return [];

    const primary = matches[0];
    const serverState = isRecord(primary?.serverState) ? primary.serverState : {};
    const online = matches.filter(isOnlineNe).length;

    return [{
      ...spec,
      rows: matches,
      online,
      total: matches.length,
      status: topologyStatus(matches.length, online),
      name: displayValue(primary?.neName ?? serverState.neName ?? spec.label),
      ip: displayValue(primary?.ip ?? serverState.neIP),
      version: displayValue(serverState.version ?? primary?.neVersion ?? primary?.version),
    }];
  });
}

export function hasTopologyEndpoint(endpoint: string, nodes: TopologyNodeView[]) {
  if (endpoint === 'gnb' || endpoint === 'dn') return true;
  return nodes.some((node) => node.id === endpoint);
}

export function isLinkRenderable(link: TopologyLinkSpec, nodes: TopologyNodeView[]) {
  return hasTopologyEndpoint(link.from, nodes) && hasTopologyEndpoint(link.to, nodes);
}

export function isLinkLive(link: TopologyLinkSpec, nodes: TopologyNodeView[], gnbCount: number, hasUserPlaneSignal: boolean) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const fromOnline = link.from === 'gnb' ? gnbCount > 0 : link.from === 'dn' ? true : (byId.get(link.from)?.online ?? 0) > 0;
  const toOnline = link.to === 'dn' ? true : link.to === 'gnb' ? gnbCount > 0 : (byId.get(link.to)?.online ?? 0) > 0;

  if (link.kind === 'user') {
    return fromOnline && toOnline && hasUserPlaneSignal;
  }

  if (link.kind === 'inactive') {
    return false;
  }

  return fromOnline && toOnline;
}

export function resourceMetric(row: ApiRow, metric: 'cpu' | 'memory' | 'disk') {
  const state = isRecord(row.serverState) ? row.serverState : {};
  const cpu = isRecord(state.cpu) ? state.cpu : {};
  const mem = isRecord(state.mem) ? state.mem : {};

  if (metric === 'cpu') {
    return toNumber(row.sysCpuUsage ?? state.sysCpuUsage ?? cpu.nfCpuUsage ?? cpu.sysCpuUsage);
  }

  if (metric === 'memory') {
    return toNumber(row.sysMemUsage ?? state.sysMemUsage ?? mem.sysMemUsage ?? mem.nfMemUsage);
  }

  return toNumber(row.sysDiskUsage ?? state.sysDiskUsage ?? state.diskUsage);
}

export function averageResourceMetric(rows: ApiRow[], metric: 'cpu' | 'memory' | 'disk') {
  const values = rows
    .map((row) => resourceMetric(row, metric))
    .filter((value): value is number => value !== null);

  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function functionMix(rows: ApiRow[]) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const type = neType(row);
    if (type && type !== '—') {
      acc[type] = (acc[type] ?? 0) + 1;
    }
    return acc;
  }, {});

  const total = Math.max(1, rows.length);
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([label, value], index) => ({
      label,
      value,
      percent: Math.round((value / total) * 100),
      color: ['#16a34a', '#ea580c', '#2563eb', '#7c3aed'][index] ?? '#64748b',
    }));
}
