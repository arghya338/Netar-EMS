import { AlertCircle, AlertTriangle, CheckCircle2, Lock, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  MUTATIONS_ENABLED,
  createClient,
  getEndpoint,
  type ApiResult,
  type AppSession,
  type EndpointRisk,
  type HttpMethod,
} from '../../api/netarApi';
import type { GuardedAction } from './types';
import { RiskBadge } from './sharedUi';

export function isDestructiveAction(risk: EndpointRisk, method: HttpMethod) {
  return risk === 'mutation' || risk === 'control' || method === 'DELETE';
}

export function actionSeverity(risk: EndpointRisk, method: HttpMethod): 'danger' | 'warning' | 'info' {
  if (method === 'DELETE') return 'danger';
  if (risk === 'mutation' || risk === 'control') return 'warning';
  return 'info';
}

export function GuardedActionModal({
  action,
  session,
  onClose,
}: {
  action: GuardedAction | null;
  session: AppSession;
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);
  const [payloadText, setPayloadText] = useState('');

  useEffect(() => {
    setConfirmed(false);
    setResult(null);
    setBusy(false);
    setShowTechnical(false);
    setPayloadText(action?.body === undefined ? '' : JSON.stringify(action.body, null, 2));
  }, [action]);

  if (!action) return null;

  const endpointMeta = getEndpoint(action.method, action.path) ?? {
    method: action.method,
    path: action.path,
    summary: action.summary,
    page: 'Action',
    risk: action.risk,
    liveStatus: 'not-tested' as const,
  };
  const hasPlaceholder = /\{.+\}/.test(action.path);
  const requiresPolicyEnablement = ['mutation', 'control', 'side-effect-get'].includes(endpointMeta.risk);
  const policyAllowsExecution = !requiresPolicyEnablement || MUTATIONS_ENABLED;
  const destructive = isDestructiveAction(endpointMeta.risk, action.method);
  const severity = actionSeverity(endpointMeta.risk, action.method);
  const alarmAction = action.intent === 'alarm-clear' || action.intent === 'alarm-ack';
  const alarmClearAction = action.intent === 'alarm-clear';
  const canExecute = policyAllowsExecution && (destructive && !alarmAction ? confirmed : true) && !hasPlaceholder && !busy;

  const execute = async () => {
    let parsedBody: unknown = action.body;
    if (showTechnical && payloadText.trim()) {
      try {
        parsedBody = JSON.parse(payloadText);
      } catch {
        setResult({ ok: false, status: 0, contentType: '', error: 'Payload must be valid JSON.' });
        return;
      }
    }

    setBusy(true);
    const client = createClient(session);
    const response = await client.request({
      method: action.method,
      path: action.path,
      query: action.query,
      body: parsedBody,
    });
    setResult(response);
    if (response.ok) {
      action.onSuccess?.();
    }
    setBusy(false);
  };

  /* Extract affected item IDs from the payload for display */
  const affectedIds: string[] = [];
  if (action.body && typeof action.body === 'object' && 'ids' in (action.body as Record<string, unknown>)) {
    const ids = (action.body as Record<string, unknown>).ids;
    if (Array.isArray(ids)) affectedIds.push(...ids.map(String));
  }

  const SeverityIcon = severity === 'danger' ? AlertCircle : severity === 'warning' ? AlertTriangle : ShieldCheck;

  if (alarmAction) {
    const AlarmActionIcon = alarmClearAction ? X : CheckCircle2;
    const actionCopy = alarmClearAction
      ? {
          heading: 'Clear alarm?',
          subtitle: 'Confirm that this alarm should leave the active alarm list.',
          notice: 'Clear only after the condition has been checked or no longer requires operator action.',
          button: 'Clear alarm',
          done: 'Done',
          iconClass: 'alarm-clear',
        }
      : {
          heading: 'Acknowledge alarm?',
          subtitle: 'Confirm that this alarm has been reviewed by an operator.',
          notice: 'Acknowledged alarms stay visible until they are cleared.',
          button: 'Acknowledge',
          done: 'Done',
          iconClass: 'alarm-ack',
        };

    return (
      <div className="modal-backdrop" role="presentation">
        <section className={`guard-modal alarm-confirm-modal ${alarmClearAction ? 'alarm-clear-modal' : 'alarm-ack-modal'}`} role="dialog" aria-modal="true" aria-label={`${action.title} confirmation`}>
          <header>
            <div className="guard-header-content">
              <div className={`guard-icon alarm-confirm-icon ${actionCopy.iconClass}`}>
                <AlarmActionIcon size={20} />
              </div>
              <div>
                <h2>{actionCopy.heading}</h2>
                <span className="guard-subtitle">{actionCopy.subtitle}</span>
              </div>
            </div>
            <button type="button" className="guard-close" aria-label="Close" onClick={onClose}><X size={16} /></button>
          </header>

          <div className="guard-body">
            {(action.affectedLabel || affectedIds.length > 0) && (
              <div className="alarm-confirm-card">
                <span>Selected alarm</span>
                <strong>{action.affectedLabel ?? affectedIds.map((id) => `#${id}`).join(', ')}</strong>
              </div>
            )}

            <div className={`guard-warning-banner ${policyAllowsExecution ? 'banner-warning' : 'banner-danger'}`}>
              {policyAllowsExecution ? <AlertTriangle size={14} /> : <Lock size={14} />}
              <span>{policyAllowsExecution ? actionCopy.notice : 'Live alarm actions are disabled by environment policy.'}</span>
            </div>

            {result && (
              <div className={`guard-result ${result.ok ? 'is-ok' : 'is-warning'}`}>
                {result.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{result.envelope?.msg ?? result.error ?? `HTTP ${result.status}`}</span>
              </div>
            )}
          </div>

          <footer className="guard-footer">
            <button type="button" className="guard-btn guard-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="button"
              className={`guard-btn guard-btn-confirm ${alarmClearAction ? 'btn-danger' : 'btn-warning'}`}
              disabled={!canExecute && !result?.ok}
              onClick={result?.ok ? onClose : execute}
            >
              {busy ? 'Processing...' : result?.ok ? actionCopy.done : actionCopy.button}
            </button>
          </footer>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className={`guard-modal guard-severity-${severity}`} role="dialog" aria-modal="true" aria-label={`${action.title} confirmation`}>
        <header>
          <div className="guard-header-content">
            <div className={`guard-icon guard-icon-${severity}`}>
              <SeverityIcon size={20} />
            </div>
            <div>
              <h2>{action.title}</h2>
              <span className="guard-subtitle">{action.summary}</span>
            </div>
          </div>
          <button type="button" className="guard-close" aria-label="Close" onClick={onClose}><X size={16} /></button>
        </header>

        <div className="guard-body">
          {/* Affected items */}
          {(action.affectedLabel || affectedIds.length > 0) && (
            <div className="guard-affected">
              <span className="guard-affected-label">Affected items</span>
              <div className="guard-affected-items">
                {action.affectedLabel && <span className="guard-chip">{action.affectedLabel}</span>}
                {!action.affectedLabel && affectedIds.map((id) => (
                  <span key={id} className="guard-chip">#{id}</span>
                ))}
              </div>
            </div>
          )}

          {/* Warning banner for destructive actions */}
          {destructive && (
            <div className={`guard-warning-banner banner-${severity}`}>
              <AlertTriangle size={14} />
              <span>{action.method === 'DELETE'
                ? 'This action will permanently remove the selected record. This cannot be undone.'
                : 'This action will modify live system data. Please ensure you have selected the correct items.'}
              </span>
            </div>
          )}

          {/* Policy disabled message */}
          {!policyAllowsExecution && (
            <div className="guard-warning-banner banner-danger">
              <Lock size={14} />
              <span>This action is disabled by environment policy. Live-changing operations are not permitted in this environment.</span>
            </div>
          )}

          {/* Confirmation checkbox for destructive actions */}
          {destructive && policyAllowsExecution && (
            <label className="guard-checkbox">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span>I confirm this action and understand it affects live system data</span>
            </label>
          )}

          {/* Technical details toggle */}
          <button
            type="button"
            className="guard-tech-toggle"
            onClick={() => setShowTechnical(!showTechnical)}
          >
            {showTechnical ? 'Hide' : 'Show'} technical details
          </button>

          {showTechnical && (
            <div className="guard-technical">
              <div className="guard-tech-row">
                <span className="guard-tech-label">Endpoint</span>
                <code>{action.method} {action.path}</code>
              </div>
              <div className="guard-tech-row">
                <span className="guard-tech-label">Risk level</span>
                <RiskBadge risk={endpointMeta.risk} />
              </div>
              {action.body !== undefined && (
                <label className="payload-editor">
                  <span className="guard-tech-label">Payload</span>
                  <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} spellCheck={false} />
                </label>
              )}
              {action.query && (
                <div className="guard-tech-row">
                  <span className="guard-tech-label">Parameters</span>
                  <pre className="query-preview">{JSON.stringify(action.query, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* Result display */}
          {result && (
            <div className={`guard-result ${result.ok ? 'is-ok' : 'is-warning'}`}>
              {result.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              <span>{result.envelope?.msg ?? result.error ?? `HTTP ${result.status}`}</span>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <footer className="guard-footer">
          <button type="button" className="guard-btn guard-btn-cancel" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className={`guard-btn guard-btn-confirm btn-${severity}`}
            disabled={!canExecute && !result?.ok}
            onClick={result?.ok ? onClose : execute}
          >
            {busy ? 'Processing…' : result?.ok ? 'Done' : severity === 'danger' ? 'Delete' : 'Confirm'}
          </button>
        </footer>
      </section>
    </div>
  );
}

