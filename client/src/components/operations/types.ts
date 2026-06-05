import type { ApiResult, AppSession, EndpointRisk, HttpMethod } from '../../api/netarApi';

export type { ApiResult, AppSession, EndpointLiveStatus, EndpointRisk, HttpMethod } from '../../api/netarApi';

export type ApiRow = Record<string, unknown>;

export interface OperationsRouterProps {
  activeNav: string;
  searchQuery: string;
  session: AppSession;
  onNavigate?: (page: string) => void;
}

export interface PageProps {
  onOpenAction: (action: GuardedAction) => void;
  searchQuery: string;
  session: AppSession;
  onNavigate?: (page: string) => void;
}

export interface GuardedAction {
  title: string;
  method: HttpMethod;
  path: string;
  summary: string;
  risk: EndpointRisk;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  affectedLabel?: string;
  intent?: 'alarm-clear' | 'alarm-ack';
  onSuccess?: () => void;
}

export interface QueryState<T = unknown> {
  loading: boolean;
  result?: ApiResult<T>;
}

export interface DataColumn {
  key: string;
  label: string;
  mask?: boolean;
}
