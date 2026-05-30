const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '');

export const NETAR_SERVER_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_NETAR_SERVER_BASE_URL ?? '/api');
export const NETAR_API_BASE_URL = `${NETAR_SERVER_BASE_URL}/live`;
export const DEFAULT_BASE_URL = 'Server managed';
export const MUTATIONS_ENABLED = import.meta.env.VITE_NETAR_ENABLE_MUTATIONS === 'true';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type EndpointRisk = 'read' | 'auth' | 'export' | 'sensitive-read' | 'side-effect-get' | 'mutation' | 'control';
export type EndpointLiveStatus = 'ok' | 'parameter-issue' | 'route-mismatch' | 'not-tested' | 'deferred';

export interface ApiEnvelope<T = unknown> {
  code?: number;
  msg?: string;
  data?: T;
  rows?: unknown[];
  total?: number;
  path?: string;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  contentType: string;
  envelope?: ApiEnvelope<T>;
  rawText?: string;
  error?: string;
}

export interface AppSession {
  username: string;
  baseUrl: string;
  token?: string;
}

export interface EndpointMeta {
  method: HttpMethod;
  path: string;
  summary: string;
  page: string;
  risk: EndpointRisk;
  liveStatus: EndpointLiveStatus;
}

export interface ApiRequestOptions {
  method: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
}

const endpoint = (
  method: HttpMethod,
  path: string,
  summary: string,
  page: string,
  risk: EndpointRisk,
  liveStatus: EndpointLiveStatus = 'not-tested',
): EndpointMeta => ({ method, path, summary, page, risk, liveStatus });

export const ENDPOINTS: EndpointMeta[] = [
  endpoint('GET', '/', 'OMC version info', 'Overview', 'read', 'ok'),
  endpoint('POST', '/login', 'System login', 'Login', 'auth', 'ok'),
  endpoint('POST', '/logout', 'System logout', 'Login', 'auth', 'ok'),
  endpoint('POST', '/file/upload', 'Upload a file', 'Maintenance', 'mutation'),
  endpoint('GET', '/ne/action/files', 'List files on network element', 'Maintenance', 'read', 'ok'),
  endpoint('GET', '/ne/action/pullFile', 'Copy file from network element', 'Maintenance', 'side-effect-get', 'deferred'),
  endpoint('PUT', '/ne/action/service', 'Network element service control', 'Maintenance', 'control'),
  endpoint('GET', '/ne/action/viewFile', 'View network element file contents', 'Maintenance', 'sensitive-read', 'deferred'),
  endpoint('GET', '/ne/config/data', 'Get configuration data', 'NE Configuration', 'read', 'ok'),
  endpoint('PUT', '/ne/config/data', 'Modify configuration data', 'NE Configuration', 'mutation'),
  endpoint('POST', '/ne/config/data', 'Add configuration data', 'NE Configuration', 'mutation'),
  endpoint('DELETE', '/ne/config/data', 'Delete configuration data', 'NE Configuration', 'mutation'),
  endpoint('GET', '/ne/config/list/{neType}', 'List configuration attributes', 'NE Configuration', 'read', 'ok'),
  endpoint('POST', '/ne/host/authorizedBySSH', 'Authorize host via SSH', 'Maintenance', 'control'),
  endpoint('POST', '/ne/host/checkBySSH', 'Check host environment via SSH', 'Maintenance', 'control'),
  endpoint('POST', '/ne/host/cmd', 'Execute host command', 'Maintenance', 'control'),
  endpoint('POST', '/ne/host/test', 'Test host connection', 'Maintenance', 'control'),
  endpoint('GET', '/ne/info/{value}', 'Get network element by row id', 'Network Elements', 'read', 'ok'),
  endpoint('DELETE', '/ne/info/{value}', 'Delete network element', 'Network Elements', 'mutation'),
  endpoint('GET', '/ne/info/byTypeAndID', 'Get network element by type and id', 'Network Elements', 'read', 'ok'),
  endpoint('GET', '/ne/info/list', 'List network elements', 'Network Elements', 'read', 'ok'),
  endpoint('GET', '/ne/info/listAll', 'Get all network elements', 'Network Elements', 'read', 'ok'),
  endpoint('GET', '/ne/info/state', 'Get network element hardware state', 'Network Elements', 'read', 'ok'),
  endpoint('GET', '/neData/kpi/data', 'Get KPI data', 'Performance', 'read', 'parameter-issue'),
  endpoint('GET', '/neData/kpi/title', 'Get KPI titles', 'Performance', 'read', 'ok'),
  endpoint('GET', '/neData/amf/nb/list', 'List AMF base stations', 'Sessions', 'read', 'ok'),
  endpoint('DELETE', '/neData/amf/ue/{ueIds}', 'Delete AMF UE session', 'Sessions', 'mutation'),
  endpoint('GET', '/neData/amf/ue/list', 'List AMF UE sessions', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/amf/ue/export', 'Export AMF UE sessions', 'Reports', 'export', 'deferred'),
  endpoint('GET', '/neData/amf/log/audit', 'Retrieve AMF audit logs', 'Sessions', 'read', 'route-mismatch'),
  endpoint('DELETE', '/neData/ims/cdr/{cdrIds}', 'Delete IMS CDR session', 'Sessions', 'mutation'),
  endpoint('GET', '/neData/ims/cdr/list', 'List IMS CDR sessions', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/ims/cdr/export', 'Export IMS CDR sessions', 'Reports', 'export', 'deferred'),
  endpoint('GET', '/neData/ims/session/list', 'List IMS online sessions', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/ims/session/num', 'Count IMS online users', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/mme/nb/list', 'List MME base stations', 'Sessions', 'read', 'parameter-issue'),
  endpoint('DELETE', '/neData/mme/ue/{ueIds}', 'Delete MME UE session', 'Sessions', 'mutation'),
  endpoint('GET', '/neData/mme/ue/list', 'List MME UE sessions', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/mme/ue/export', 'Export MME UE sessions', 'Reports', 'export', 'deferred'),
  endpoint('DELETE', '/neData/smf/cdr/{cdrIds}', 'Delete SMF CDR session', 'Sessions', 'mutation'),
  endpoint('GET', '/neData/smf/cdr/list', 'List SMF CDR sessions', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/smf/cdr/export', 'Export SMF CDR sessions', 'Reports', 'export', 'deferred'),
  endpoint('GET', '/neData/smf/sub/list', 'List SMF online data sessions', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/smf/sub/num', 'Count SMF online users', 'Sessions', 'read', 'ok'),
  endpoint('GET', '/neData/smsc/cdr/list', 'List SMSC CDR sessions', 'Sessions', 'read', 'parameter-issue'),
  endpoint('GET', '/neData/smsc/cdr/export', 'Export SMSC CDR sessions', 'Reports', 'export', 'deferred'),
  endpoint('GET', '/neData/udm/auth/list', 'List UDM auth profiles', 'Subscribers', 'read', 'ok'),
  endpoint('POST', '/neData/udm/auth/{neId}', 'Add UDM auth profile', 'Subscribers', 'mutation'),
  endpoint('PUT', '/neData/udm/auth/{neId}', 'Modify UDM auth profile', 'Subscribers', 'mutation'),
  endpoint('DELETE', '/neData/udm/auth/{neId}/{value}', 'Delete UDM auth profile', 'Subscribers', 'mutation'),
  endpoint('GET', '/neData/udm/auth/export', 'Export UDM auth profiles', 'Reports', 'export', 'deferred'),
  endpoint('POST', '/neData/udm/auth/import', 'Import UDM auth profiles', 'Subscribers', 'mutation'),
  endpoint('PUT', '/neData/udm/auth/resetData/{neId}', 'Refresh UDM auth data', 'Subscribers', 'control'),
  endpoint('GET', '/neData/udm/sub/list', 'List UDM subscriber profiles', 'Subscribers', 'read', 'ok'),
  endpoint('POST', '/neData/udm/sub/{neId}', 'Add UDM subscriber profile', 'Subscribers', 'mutation'),
  endpoint('PUT', '/neData/udm/sub/{neId}', 'Modify UDM subscriber profile', 'Subscribers', 'mutation'),
  endpoint('DELETE', '/neData/udm/sub/{neId}/{value}', 'Delete UDM subscriber profile', 'Subscribers', 'mutation'),
  endpoint('GET', '/neData/udm/sub/export', 'Export UDM subscriber profiles', 'Reports', 'export', 'deferred'),
  endpoint('POST', '/neData/udm/sub/import', 'Import UDM subscriber profiles', 'Subscribers', 'mutation'),
  endpoint('PUT', '/neData/udm/sub/resetData/{neId}', 'Refresh UDM subscriber data', 'Subscribers', 'control'),
  endpoint('GET', '/neData/udm/voip/list', 'List UDM VoIP users', 'Subscribers', 'read', 'route-mismatch'),
  endpoint('GET', '/neData/udm/voip/api', 'Get UDM VoIP user', 'Subscribers', 'read'),
  endpoint('POST', '/neData/udm/voip/api', 'Add UDM VoIP user', 'Subscribers', 'mutation'),
  endpoint('DELETE', '/neData/udm/voip/api', 'Delete UDM VoIP user', 'Subscribers', 'mutation'),
  endpoint('PUT', '/neData/udm/voip/resetData/{neId}', 'Refresh UDM VoIP data', 'Subscribers', 'control'),
  endpoint('GET', '/neData/udm/volte-ims/list', 'List UDM VoLTE IMS users', 'Subscribers', 'read', 'route-mismatch'),
  endpoint('POST', '/neData/udm/volte-ims/api', 'Add UDM VoLTE IMS user', 'Subscribers', 'mutation'),
  endpoint('DELETE', '/neData/udm/volte-ims/api', 'Delete UDM VoLTE IMS user', 'Subscribers', 'mutation'),
  endpoint('PUT', '/neData/udm/volte-ims/resetData/{neId}', 'Refresh UDM VoLTE IMS data', 'Subscribers', 'control'),
  endpoint('GET', '/neData/upf/totalFlow', 'Get UPF traffic summary', 'Performance', 'read', 'ok'),
  endpoint('GET', '/neData/pcf/rule/list', 'List PCF rules', 'Policy', 'read', 'route-mismatch'),
  endpoint('POST', '/neData/pcf/rule', 'Add PCF rule', 'Policy', 'mutation'),
  endpoint('PUT', '/neData/pcf/rule', 'Update PCF rule', 'Policy', 'mutation'),
  endpoint('DELETE', '/neData/pcf/rule', 'Delete PCF rule', 'Policy', 'mutation'),
  endpoint('GET', '/neData/pcf/rule/export', 'Export PCF rules', 'Reports', 'export', 'deferred'),
  endpoint('PUT', '/neData/pcf/rule/import', 'Import PCF rules', 'Policy', 'mutation'),
  endpoint('GET', '/neData/alarm/list', 'List alarms', 'Alarms', 'read', 'parameter-issue'),
  endpoint('DELETE', '/neData/alarm/{id}', 'Delete alarm', 'Alarms', 'mutation'),
  endpoint('PUT', '/neData/alarm/clear', 'Clear alarms', 'Alarms', 'mutation'),
  endpoint('PUT', '/neData/alarm/ack', 'Acknowledge alarms', 'Alarms', 'mutation'),
  endpoint('GET', '/neData/alarm/export', 'Export alarms', 'Reports', 'export', 'deferred'),
  endpoint('GET', '/neData/alarm/count/type', 'Alarm count by type', 'Alarms', 'read', 'route-mismatch'),
  endpoint('GET', '/neData/alarm/count/severity', 'Alarm count by severity', 'Alarms', 'read', 'route-mismatch'),
  endpoint('GET', '/neData/alarm/count/ne', 'Top network element alarm count', 'Alarms', 'read', 'route-mismatch'),
  endpoint('GET', '/neData/alarm/log/list', 'List alarm logs', 'Alarms', 'read', 'route-mismatch'),
  endpoint('GET', '/neData/alarm/log/event', 'List alarm event logs', 'Alarms', 'read', 'route-mismatch'),
  endpoint('GET', '/neData/alarm/forward/log/list', 'List alarm forward logs', 'Alarms', 'read', 'route-mismatch'),
  endpoint('POST', '/trace/tcpdump/start', 'Start packet capture', 'Diagnostics', 'control'),
  endpoint('POST', '/trace/tcpdump/stop', 'Stop packet capture', 'Diagnostics', 'control'),
];

export class NetarApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  async request<T = unknown>({ method, path, query, body, signal }: ApiRequestOptions): Promise<ApiResult<T>> {
    const base = this.baseUrl.startsWith('http')
      ? this.baseUrl
      : `${window.location.origin}${this.baseUrl.startsWith('/') ? '' : '/'}${this.baseUrl}`;
    const url = new URL(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);

    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const init: RequestInit = {
      method,
      headers,
      credentials: 'include',
      signal,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, init);
      const contentType = response.headers.get('content-type') ?? '';
      const rawText = await response.text();
      let envelope: ApiEnvelope<T> | undefined;

      if (rawText && contentType.includes('application/json')) {
        envelope = JSON.parse(rawText) as ApiEnvelope<T>;
      } else if (rawText) {
        envelope = { data: rawText as T };
      }

      return {
        ok: response.ok && (envelope?.code === undefined || envelope.code === 1),
        status: response.status,
        contentType,
        envelope,
        rawText,
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        contentType: '',
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }
}

export const createClient = (session: AppSession) => new NetarApiClient(NETAR_API_BASE_URL, session.token);

export const createPublicClient = () => new NetarApiClient(NETAR_API_BASE_URL);

export async function serverRequest<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const serverBase = NETAR_SERVER_BASE_URL.startsWith('http')
    ? NETAR_SERVER_BASE_URL
    : `${window.location.origin}${NETAR_SERVER_BASE_URL.startsWith('/') ? '' : '/'}${NETAR_SERVER_BASE_URL}`;
  const url = new URL(`${serverBase.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    });
    const contentType = response.headers.get('content-type') ?? '';
    const rawText = await response.text();
    let envelope: ApiEnvelope<T> | undefined;

    if (rawText && contentType.includes('application/json')) {
      envelope = JSON.parse(rawText) as ApiEnvelope<T>;
    } else if (rawText) {
      envelope = { data: rawText as T };
    }

    return {
      ok: response.ok && (envelope?.code === undefined || envelope.code === 1),
      status: response.status,
      contentType,
      envelope,
      rawText,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      contentType: '',
      error: error instanceof Error ? error.message : 'Request failed',
    };
  }
}

export function loginSession(username: string, password: string) {
  return serverRequest<AppSession>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getCurrentSession() {
  return serverRequest<AppSession>('/session', { method: 'GET' });
}

export function logoutSession() {
  return serverRequest('/logout', { method: 'POST' });
}

export const getEndpoint = (method: HttpMethod, path: string) =>
  ENDPOINTS.find((endpointMeta) => endpointMeta.method === method && endpointMeta.path === path);

export const isGuardedEndpoint = (endpointMeta: EndpointMeta) =>
  endpointMeta.risk === 'mutation' ||
  endpointMeta.risk === 'control' ||
  endpointMeta.risk === 'export' ||
  endpointMeta.risk === 'sensitive-read' ||
  endpointMeta.risk === 'side-effect-get';
