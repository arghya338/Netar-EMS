import { BadgeCheck, ClipboardList, FileText, Lock, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import {
  type PageProps,
  ActionButton,
  ApiNotice,
  DataTable,
  PageHeader,
  PanelFrame,
  compactStatusText,
  displayValue,
  pageEndpointCount,
  rowsFromResult,
  useApiQuery,
  useNetworkElements,
} from '../shared';

export function ConfigPage({ session, onOpenAction }: PageProps) {
  const neQuery = useNetworkElements(session);
  const nes = rowsFromResult(neQuery.result);
  const [neType, setNeType] = useState('IMS');
  const [neId, setNeId] = useState('001');
  const configList = useApiQuery(session, `/ne/config/list/${neType}`, undefined, Boolean(neType));
  const configRows = rowsFromResult(configList.result);
  const [paramName, setParamName] = useState('');
  const activeParam = paramName || displayValue(configRows[0]?.paramName ?? configRows[0]?.name);
  const configData = useApiQuery(session, '/ne/config/data', { neType, neId, paramName: activeParam }, Boolean(activeParam && activeParam !== '—'));
  const dataRows = rowsFromResult(configData.result);
  const selectedParam = configRows.find((row) => displayValue(row.paramName ?? row.name) === activeParam) ?? configRows[0];
  const selectedData = dataRows[0] ?? selectedParam;

  return (
    <div className="ops-page">
      <PageHeader title="NE Configuration" detail="Parameter catalog, selected NE scope, current values, and controlled change submission." icon={SlidersHorizontal} count={pageEndpointCount('NE Configuration')} />
      <section className="config-workspace">
        <div className="config-toolbar">
          <label>
            <span>NE Type</span>
            <select value={neType} onChange={(event) => { setNeType(event.target.value); setParamName(''); }}>
              {Array.from(new Set([...nes.map((row) => displayValue(row.neType)), 'IMS', 'AMF', 'AUSF', 'UDM', 'SMF', 'UPF', 'PCF'])).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label>
            <span>NE ID</span>
            <input value={neId} onChange={(event) => setNeId(event.target.value)} aria-label="NE ID" />
          </label>
          <label>
            <span>Config group</span>
            <select value={activeParam === '—' ? '' : activeParam} onChange={(event) => setParamName(event.target.value)}>
              <option value="">Select parameter</option>
              {configRows.map((row) => {
                const value = displayValue(row.paramName ?? row.name);
                return <option key={value} value={value}>{value}</option>;
              })}
            </select>
          </label>
          <ActionButton icon={RefreshCw} onClick={() => setParamName('')}>Reload</ActionButton>
        </div>

        <div className="config-grid">
          <PanelFrame title="Parameter Catalog" icon={ClipboardList}>
            <ApiNotice result={configList.result} loading={configList.loading} />
            <div className="config-param-list">
              {configRows.length === 0 && <span>No parameter catalog rows returned.</span>}
              {configRows.map((row) => {
                const value = displayValue(row.paramName ?? row.name);
                return (
                  <button
                    key={value}
                    type="button"
                    className={value === activeParam ? 'is-active' : ''}
                    onClick={() => setParamName(value)}
                  >
                    <strong>{value}</strong>
                    <span>{displayValue(row.paramType ?? row.type ?? row.label)}</span>
                  </button>
                );
              })}
            </div>
          </PanelFrame>

          <PanelFrame title="Configuration Values" icon={FileText} action={
            <div className="button-row">
              <ActionButton
                icon={BadgeCheck}
                variant="primary"
                onClick={() => onOpenAction({
                  title: 'Save configuration change',
                  method: 'PUT',
                  path: '/ne/config/data',
                  summary: 'Submits an update for the selected network element configuration.',
                  risk: 'mutation',
                  body: { neType, neId, paramName: activeParam, paramData: selectedData ?? {}, loc: '0' },
                })}
              >
                Save
              </ActionButton>
              <ActionButton
                icon={FileText}
                onClick={() => onOpenAction({
                  title: 'Add configuration row',
                  method: 'POST',
                  path: '/ne/config/data',
                  summary: 'Adds a configuration row for the selected parameter group.',
                  risk: 'mutation',
                  body: { neType, neId, paramName: activeParam, paramData: {}, loc: '0' },
                })}
              >
                Add row
              </ActionButton>
              <ActionButton
                icon={Lock}
                variant="danger"
                onClick={() => onOpenAction({
                  title: 'Delete configuration row',
                  method: 'DELETE',
                  path: '/ne/config/data',
                  summary: 'Deletes the selected configuration row after operator confirmation.',
                  risk: 'mutation',
                  query: { neType, neId, paramName: activeParam, loc: '0' },
                })}
              >
                Delete row
              </ActionButton>
            </div>
          }>
            <ApiNotice result={configData.result} loading={configData.loading} />
            <DataTable
              rows={dataRows}
              columns={[
                { key: 'label', label: 'Label' },
                { key: 'paramName', label: 'Key' },
                { key: 'value', label: 'Value' },
                { key: 'paramType', label: 'Type' },
                { key: 'loc', label: 'Index' },
              ]}
            />
          </PanelFrame>

          <PanelFrame title="Selected Parameter" icon={SlidersHorizontal}>
            <div className="config-inspector">
              <dl>
                <div><dt>Element</dt><dd>{neType}-{neId}</dd></div>
                <div><dt>Group</dt><dd>{activeParam}</dd></div>
                <div><dt>Rows</dt><dd>{dataRows.length}</dd></div>
                <div><dt>Inventory</dt><dd>{compactStatusText(nes)}</dd></div>
              </dl>
              <pre>{JSON.stringify(selectedData ?? { neType, neId, paramName: activeParam }, null, 2)}</pre>
            </div>
          </PanelFrame>
        </div>
      </section>
    </div>
  );
}

