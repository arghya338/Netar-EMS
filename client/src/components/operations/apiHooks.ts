import { useEffect, useState } from 'react';
import { createClient, serverRequest, type AppSession } from '../../api/netarApi';
import type { QueryState } from './types';

export function useApiQuery<T = unknown>(
  session: AppSession,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  enabled = true,
  refreshKey?: string | number,
): QueryState<T> {
  const queryKey = JSON.stringify(query ?? {});
  const [state, setState] = useState<QueryState<T>>({ loading: enabled });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false });
      return undefined;
    }

    const controller = new AbortController();
    const client = createClient(session);
    setState((current) => ({ ...current, loading: true }));

    client.request<T>({ method: 'GET', path, query, signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) {
        setState({ loading: false, result });
      }
    });

    return () => controller.abort();
  }, [enabled, path, queryKey, refreshKey, session]);

  return state;
}

export function buildServerQueryPath(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function useServerApiQuery<T = unknown>(
  session: AppSession,
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  enabled = true,
  refreshKey?: string | number,
): QueryState<T> {
  const queryKey = JSON.stringify(query ?? {});
  const [state, setState] = useState<QueryState<T>>({ loading: enabled });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false });
      return undefined;
    }

    let cancelled = false;
    setState((current) => ({ ...current, loading: true }));

    serverRequest<T>(buildServerQueryPath(path, query), { method: 'GET' }).then((result) => {
      if (!cancelled) {
        setState({ loading: false, result });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, path, queryKey, refreshKey, session]);

  return state;
}

export function useNetworkElements(session: AppSession) {
  return useApiQuery(session, '/ne/info/listAll', { bandStatus: true, bandHost: true });
}
