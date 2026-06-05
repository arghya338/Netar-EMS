import { ENDPOINTS, type ApiResult, type EndpointLiveStatus, type EndpointRisk } from '../../api/netarApi';
import type { ApiRow } from './types';

export const endpointCount = ENDPOINTS.length;

export const defaultNe = { neType: 'IMS', neId: '001' };
export const sensitiveKeys = new Set(['ki', 'opc', 'password', 'secret', 'token', 'access_token', 'authkey', 'authKey']);

export const statusText: Record<EndpointLiveStatus, string> = {
  ok: 'Live OK',
  'parameter-issue': 'Contract check',
  'route-mismatch': 'Route mismatch',
  'not-tested': 'Requires lab data',
  deferred: 'Manual action',
};

export const riskText: Record<EndpointRisk, string> = {
  read: 'Read-only',
  auth: 'Auth',
  export: 'Export',
  'sensitive-read': 'Sensitive read',
  'side-effect-get': 'Side-effect GET',
  mutation: 'Mutation',
  control: 'Control',
};

export const tableColumns = {
  networkElement: [
    { key: 'id', label: 'Row' },
    { key: 'neType', label: 'Type' },
    { key: 'neId', label: 'NE ID' },
    { key: 'neName', label: 'Name' },
    { key: 'ip', label: 'IP' },
    { key: 'status', label: 'Status' },
  ],
  session: [
    { key: 'imsi', label: 'IMSI' },
    { key: 'msisdn', label: 'MSISDN' },
    { key: 'neId', label: 'NE ID' },
    { key: 'eventType', label: 'Event' },
    { key: 'recordType', label: 'Record' },
    { key: 'time', label: 'Time' },
  ],
  subscriber: [
    { key: 'id', label: 'ID' },
    { key: 'imsi', label: 'IMSI' },
    { key: 'msisdn', label: 'MSISDN' },
    { key: 'username', label: 'Username' },
    { key: 'ki', label: 'KI', mask: true },
    { key: 'opc', label: 'OPC', mask: true },
    { key: 'password', label: 'Password', mask: true },
  ],
  alarm: [
    { key: 'id', label: 'ID' },
    { key: 'neType', label: 'NE Type' },
    { key: 'alarmTitle', label: 'Title' },
    { key: 'origSeverity', label: 'Severity' },
    { key: 'alarmStatus', label: 'Status' },
    { key: 'eventTime', label: 'Event time' },
  ],
};

export function rowsFromResult(result?: ApiResult): ApiRow[] {
  const envelope = result?.envelope;
  if (!envelope) return [];

  if (Array.isArray(envelope.rows)) {
    return envelope.rows.filter(isRecord);
  }

  if (Array.isArray(envelope.data)) {
    return envelope.data.filter(isRecord);
  }

  if (isRecord(envelope.data)) {
    if (Array.isArray(envelope.data.rows)) {
      return envelope.data.rows.filter(isRecord);
    }
    return [envelope.data];
  }

  return [];
}

export function totalFromResult(result?: ApiResult) {
  const envelope = result?.envelope;
  if (!envelope) return 0;
  if (typeof envelope.total === 'number') return envelope.total;
  if (isRecord(envelope.data) && typeof envelope.data.total === 'number') return envelope.data.total;
  return rowsFromResult(result).length;
}

export function isRecord(value: unknown): value is ApiRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const dictionaryLabelFallbacks: Record<string, string> = {
  'dictData.active_alarm_severity.critical': 'Critical',
  'dictData.active_alarm_severity.major': 'Major',
  'dictData.active_alarm_severity.minor': 'Minor',
  'dictData.active_alarm_severity.warning': 'Warning',
  'dictData.active_alarm_severity.event': 'Event',
  'dictData.active_alarm_type.communication': 'Communication Alarm',
  'dictData.active_alarm_type.equipment': 'Equipment Alarm',
  'dictData.active_alarm_type.processingFailure': 'Processing Failure Alarm',
  'dictData.active_alarm_type.processing_failure': 'Processing Failure Alarm',
  'dictData.active_alarm_type.environmental': 'Environmental Alarm',
  'dictData.active_alarm_type.qualityOfService': 'Quality of Service Alarm',
  'dictData.active_alarm_type.quality_of_service': 'Quality of Service Alarm',
};

export function readableDictionaryLabel(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text.startsWith('dictData.')) return text;
  const fallback = dictionaryLabelFallbacks[text];
  if (fallback) return fallback;

  const tail = text.split('.').pop() ?? text;
  return tail
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function displayValue(value: unknown, key?: string, mask = false) {
  if (mask || (key && sensitiveKeys.has(key))) return '••••••';
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 90);
  return readableDictionaryLabel(value);
}

export function getRowId(row: ApiRow) {
  return displayValue(row.id ?? row.imsi ?? row.username ?? row.neId ?? row.fileName ?? row.alarmTitle);
}

export function firstNe(rows: ApiRow[], type = 'IMS') {
  return rows.find((row) => row.neType === type) ?? rows.find((row) => row.neType !== 'OMC') ?? defaultNe;
}

export function pageEndpointCount(page: string) {
  return ENDPOINTS.filter((endpoint) => endpoint.page === page || (page === 'Reports' && endpoint.risk === 'export')).length;
}

export function statusClass(status: EndpointLiveStatus | EndpointRisk | string) {
  return status.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export function isOnlineNe(row: ApiRow) {
  const value = String(row.status ?? row.state ?? row.online ?? '').toLowerCase();
  return value === '1' || value === 'true' || value === 'online' || value === 'normal';
}

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function collectNumbers(value: unknown): number[] {
  if (Array.isArray(value)) return value.flatMap(collectNumbers);
  if (!isRecord(value)) {
    const numberValue = toNumber(value);
    return numberValue === null ? [] : [numberValue];
  }
  return Object.values(value).flatMap(collectNumbers);
}

export function extractCount(result?: ApiResult) {
  const envelope = result?.envelope;
  if (!envelope) return 0;
  const direct = toNumber(envelope.total) ?? toNumber(envelope.data);
  if (direct !== null) return direct;
  if (Array.isArray(envelope.rows)) return sumRecordTotals(envelope.rows) ?? envelope.rows.length;
  if (Array.isArray(envelope.data)) return sumRecordTotals(envelope.data) ?? envelope.data.length;
  const values = collectNumbers(envelope.data);
  return values[0] ?? rowsFromResult(result).length;
}

export function sumRecordTotals(rows: unknown[]) {
  const totals = rows
    .filter(isRecord)
    .map((row) => toNumber(row.total ?? row.count ?? row.alarmCount))
    .filter((value): value is number => value !== null);

  return totals.length > 0 ? totals.reduce((sum, value) => sum + value, 0) : null;
}

export function hasLiveResult(result?: ApiResult) {
  return Boolean(result?.ok && result.envelope);
}

export function liveCountText(result?: ApiResult) {
  return hasLiveResult(result) ? formatNumber(extractCount(result)) : '—';
}

export function extractFlowValues(result?: ApiResult) {
  const data = result?.envelope?.data;
  if (isRecord(data)) {
    const up = toNumber(data.up);
    const down = toNumber(data.down);
    return {
      up,
      down,
      series: [down, up].filter((value): value is number => value !== null),
    };
  }

  const series = collectNumbers(data ?? result?.envelope?.rows ?? []);
  return {
    up: series[0] ?? null,
    down: series[1] ?? null,
    series,
  };
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(value)));
}

export function formatFlowCounter(value: number) {
  const { value: scaled, unit } = formatFlowParts(value);
  return `${scaled} ${unit}`;
}

export function formatFlowParts(value: number) {
  const abs = Math.abs(value);
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let scaled = abs;
  let unitIndex = 0;

  while (scaled >= 1024 && unitIndex < units.length - 1) {
    scaled /= 1024;
    unitIndex += 1;
  }

  const decimals = unitIndex === 0 ? 0 : scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return {
    value: scaled.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: unitIndex === 0 ? 0 : Math.min(decimals, 1),
    }),
    unit: units[unitIndex],
  };
}

export function formatThroughput(value: number) {
  return `${formatFlowCounter(value)}/s`;
}

export function formatPercentMetric(value: unknown) {
  const numberValue = toNumber(value);
  if (numberValue === null) return '—';
  const normalized = Math.abs(numberValue) > 10_000
    ? numberValue / 1_000
    : Math.abs(numberValue) > 100
      ? numberValue / 100
      : numberValue;
  return `${normalized.toFixed(normalized >= 10 ? 1 : 2)}%`;
}

export function severityKey(row: ApiRow) {
  const severity = String(row.origSeverity ?? row.severity ?? row.alarmSeverity ?? row.level ?? '').toLowerCase();
  if (severity.includes('crit') || severity === '1') return 'critical';
  if (severity.includes('major') || severity === '2') return 'major';
  if (severity.includes('minor') || severity === '3') return 'minor';
  if (severity.includes('warn') || severity === '4') return 'warning';
  return 'normal';
}

export function buildSeverityCounts(rows: ApiRow[], useAggregateTotals = false) {
  const counts = { critical: 0, major: 0, minor: 0, warning: 0, normal: 0 };
  rows.forEach((row) => {
    const increment = useAggregateTotals
      ? toNumber(row.total ?? row.count ?? row.alarmCount) ?? 0
      : 1;
    counts[severityKey(row) as keyof typeof counts] += increment;
  });
  return counts;
}

export function severityTotal(counts: ReturnType<typeof buildSeverityCounts>) {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

export function neLabel(row: ApiRow) {
  return displayValue(row.neName ?? row.neType ?? row.neId);
}

export function compactStatusText(rows: ApiRow[]) {
  const online = rows.filter(isOnlineNe).length;
  const offline = Math.max(0, rows.length - online);
  return `${online} online, ${offline} offline`;
}
