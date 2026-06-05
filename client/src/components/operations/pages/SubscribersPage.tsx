import { Database, Download, Lock, RefreshCw, Search, Upload, UserRound } from 'lucide-react';
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

export interface SubscriberTab {
  id: string;
  path: string;
  query: Record<string, string | number | boolean>;
  addPath: string;
  updatePath?: string;
  deletePath?: string;
  detailPath?: string;
  exportPath?: string;
  importPath?: string;
  resetPath?: string;
}

export const subscriberTabs: SubscriberTab[] = [
  { id: 'Auth', path: '/neData/udm/auth/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/auth/001', updatePath: '/neData/udm/auth/001', deletePath: '/neData/udm/auth/001/{value}', exportPath: '/neData/udm/auth/export', importPath: '/neData/udm/auth/import', resetPath: '/neData/udm/auth/resetData/001' },
  { id: 'Subscriber', path: '/neData/udm/sub/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/sub/001', updatePath: '/neData/udm/sub/001', deletePath: '/neData/udm/sub/001/{value}', exportPath: '/neData/udm/sub/export', importPath: '/neData/udm/sub/import', resetPath: '/neData/udm/sub/resetData/001' },
  { id: 'VoIP', path: '/neData/udm/voip/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/voip/api', deletePath: '/neData/udm/voip/api', detailPath: '/neData/udm/voip/api', resetPath: '/neData/udm/voip/resetData/001' },
  { id: 'VoLTE IMS', path: '/neData/udm/volte-ims/list', query: { neId: '001', pageNum: 1, pageSize: 20 }, addPath: '/neData/udm/volte-ims/api', deletePath: '/neData/udm/volte-ims/api', resetPath: '/neData/udm/volte-ims/resetData/001' },
];

export function SubscribersPage({ session, onOpenAction }: PageProps) {
  const [tabId, setTabId] = useState(subscriberTabs[0].id);
  const [selected, setSelected] = useState<ApiRow | null>(null);
  const active = subscriberTabs.find((tab) => tab.id === tabId) ?? subscriberTabs[0];
  const exportPath = active.exportPath;
  const detailPath = active.detailPath;
  const updatePath = active.updatePath;
  const deletePath = active.deletePath;
  const importPath = active.importPath;
  const resetPath = active.resetPath;
  const query = useApiQuery(session, active.path, active.query);
  const rows = rowsFromResult(query.result);
  const selectedValue = selected ? getRowId(selected) : '';

  return (
    <div className="ops-page">
      <PageHeader title="Subscribers" detail="UDM auth, subscriber, VoIP, and VoLTE IMS data with masked secrets." icon={UserRound} count={pageEndpointCount('Subscribers')} />
      <PanelFrame title="Subscriber workspace" icon={Database}>
        <Tabs tabs={subscriberTabs.map((tab) => tab.id)} active={tabId} onChange={(value) => { setTabId(value); setSelected(null); }} />
        <ApiNotice result={query.result} loading={query.loading} />
        <div className="button-row">
          {exportPath && <ActionButton icon={Download} onClick={() => onOpenAction({ title: `Export ${active.id}`, method: 'GET', path: exportPath, summary: 'Exports filtered subscriber rows.', risk: 'export', query: active.query })}>Export</ActionButton>}
          {detailPath && <ActionButton icon={Search} onClick={() => onOpenAction({ title: `Inspect ${active.id}`, method: 'GET', path: detailPath, summary: 'Retrieves the selected subscriber detail record.', risk: 'sensitive-read', query: { neId: '001', value: selectedValue || 'SELECT_RECORD' } })}>Inspect</ActionButton>}
          <ActionButton icon={Lock} onClick={() => onOpenAction({ title: `Add ${active.id}`, method: 'POST', path: active.addPath, summary: 'Adds a subscriber data record after operator confirmation.', risk: 'mutation', body: { neId: '001', imsi: '001010000000000' } })}>Add</ActionButton>
          {updatePath && <ActionButton icon={Lock} onClick={() => onOpenAction({ title: `Update ${active.id}`, method: 'PUT', path: updatePath, summary: 'Updates the selected subscriber data record after confirmation.', risk: 'mutation', body: selected ?? { neId: '001', imsi: '001010000000000' } })}>Update</ActionButton>}
          {deletePath && <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: `Delete ${active.id}`, method: 'DELETE', path: deletePath.includes('{value}') && selectedValue ? deletePath.replace('{value}', selectedValue) : deletePath, summary: 'Deletes the selected subscriber data record after confirmation.', risk: 'mutation', query: deletePath.endsWith('/api') ? { neId: '001', value: selectedValue || 'SELECT_RECORD' } : undefined })}>Delete</ActionButton>}
          {importPath && <ActionButton icon={Upload} onClick={() => onOpenAction({ title: `Import ${active.id}`, method: 'POST', path: importPath, summary: 'Imports subscriber rows from a managed upload file.', risk: 'mutation', body: { neId: '001', uploadPath: '/upload/netar/import.txt' } })}>Import</ActionButton>}
          {resetPath && <ActionButton icon={RefreshCw} onClick={() => onOpenAction({ title: `Refresh ${active.id}`, method: 'PUT', path: resetPath, summary: 'Refreshes UDM data from the network element.', risk: 'control' })}>Refresh</ActionButton>}
        </div>
        <DataTable rows={rows} columns={tableColumns.subscriber} selectedId={selected ? getRowId(selected) : undefined} onSelect={setSelected} />
      </PanelFrame>
    </div>
  );
}
