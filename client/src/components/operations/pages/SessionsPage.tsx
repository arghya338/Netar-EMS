import { ClipboardList, Download, Lock, Signal } from 'lucide-react';
import { useState } from 'react';
import {
  type ApiRow,
  type PageProps,
  ActionButton,
  ApiNotice,
  DataTable,
  PageHeader,
  PanelFrame,
  Tabs,
  getRowId,
  pageEndpointCount,
  rowsFromResult,
  tableColumns,
  useApiQuery,
} from '../shared';

export interface SessionTab {
  id: string;
  path: string;
  query: Record<string, string | number | boolean>;
  deletePath?: string;
  exportPath?: string;
}

export const sessionTabs: SessionTab[] = [
  { id: 'AMF Base Stations', path: '/neData/amf/nb/list', query: { neType: 'AMF', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'AMF UE', path: '/neData/amf/ue/list', query: { neType: 'AMF', neId: '001', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/amf/ue/{ueIds}', exportPath: '/neData/amf/ue/export' },
  { id: 'AMF Audit', path: '/neData/amf/log/audit', query: { neType: 'AMF', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'IMS CDR', path: '/neData/ims/cdr/list', query: { neType: 'IMS', neId: '001', recordType: 'MOC', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/ims/cdr/{cdrIds}', exportPath: '/neData/ims/cdr/export' },
  { id: 'IMS Online', path: '/neData/ims/session/list', query: { neId: '001' } },
  { id: 'MME Base Stations', path: '/neData/mme/nb/list', query: { neType: 'MME', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'MME UE', path: '/neData/mme/ue/list', query: { neType: 'MME', neId: '001', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/mme/ue/{ueIds}', exportPath: '/neData/mme/ue/export' },
  { id: 'SMF CDR', path: '/neData/smf/cdr/list', query: { neType: 'SMF', neId: '001', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, deletePath: '/neData/smf/cdr/{cdrIds}', exportPath: '/neData/smf/cdr/export' },
  { id: 'SMF Data Sessions', path: '/neData/smf/sub/list', query: { neType: 'SMF', neId: '001', pageNum: 1, pageSize: 20 } },
  { id: 'SMSC CDR', path: '/neData/smsc/cdr/list', query: { neType: 'SMSC', neId: '001', recordType: 'MOSM', beginTime: Date.now() - 86_400_000, endTime: Date.now(), pageNum: 1, pageSize: 20 }, exportPath: '/neData/smsc/cdr/export' },
];

export function SessionsPage({ session, onOpenAction }: PageProps) {
  const [tabId, setTabId] = useState(sessionTabs[0].id);
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const active = sessionTabs.find((tab) => tab.id === tabId) ?? sessionTabs[0];
  const exportPath = active.exportPath;
  const deletePath = active.deletePath;
  const query = useApiQuery(session, active.path, active.query);
  const rows = rowsFromResult(query.result);
  const selectedRecordId = selected ? getRowId(selected) : '';

  return (
    <div className="ops-page">
      <PageHeader title="Sessions" detail="AMF, IMS, MME, SMF, and SMSC session operations with filtered exports and selected-row actions." icon={Signal} count={pageEndpointCount('Sessions')} />
      <PanelFrame title="Session data" icon={ClipboardList}>
        <Tabs tabs={sessionTabs.map((tab) => tab.id)} active={tabId} onChange={(value) => { setTabId(value); setSelected(null); }} />
        <ApiNotice result={query.result} loading={query.loading} />
        <div className="button-row">
          {exportPath && <ActionButton icon={Download} onClick={() => onOpenAction({ title: `Export ${active.id}`, method: 'GET', path: exportPath, summary: 'Exports filtered session rows. Use explicit operator action only.', risk: 'export', query: active.query })}>Export</ActionButton>}
          {deletePath && <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: `Delete ${active.id}`, method: 'DELETE', path: selectedRecordId ? deletePath.replace(/\{.+\}/, selectedRecordId) : deletePath, summary: 'Deletes the selected session record after operator confirmation.', risk: 'mutation' })}>Delete selected</ActionButton>}
        </div>
        <DataTable rows={rows} columns={tableColumns.session} selectedId={selected ? getRowId(selected) : undefined} onSelect={setSelected} />
      </PanelFrame>
    </div>
  );
}

