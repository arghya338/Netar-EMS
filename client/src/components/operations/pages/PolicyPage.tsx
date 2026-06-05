import { BadgeCheck, Download, FileText, Lock, Router, Upload } from 'lucide-react';
import {
  type PageProps,
  ActionButton,
  ApiNotice,
  DataTable,
  PageHeader,
  PanelFrame,
  pageEndpointCount,
  rowsFromResult,
  useApiQuery,
} from '../shared';

export function PolicyPage({ session, onOpenAction }: PageProps) {
  const query = useApiQuery(session, '/neData/pcf/rule/list', { neId: '001' });
  const rows = rowsFromResult(query.result);

  return (
    <div className="ops-page">
      <PageHeader title="Policy" detail="PCF rule catalog, imports, exports, and controlled rule lifecycle actions." icon={Router} count={pageEndpointCount('Policy')} />
      <PanelFrame title="PCF rules" icon={Router}>
        <ApiNotice result={query.result} loading={query.loading} fallback="PCF rule list returned route mismatch on the live system." />
        <div className="button-row">
          <ActionButton icon={Download} onClick={() => onOpenAction({ title: 'Export PCF rules', method: 'GET', path: '/neData/pcf/rule/export', summary: 'Exports PCF policy rules for the selected network element.', risk: 'export', query: { neId: '001' } })}>Export</ActionButton>
          <ActionButton icon={FileText} onClick={() => onOpenAction({ title: 'Add PCF rule', method: 'POST', path: '/neData/pcf/rule', summary: 'Adds a PCF policy rule after operator confirmation.', risk: 'mutation', body: { neId: '001', num: 0, paramData: { imsi: '001010000000000' } } })}>Add rule</ActionButton>
          <ActionButton icon={BadgeCheck} onClick={() => onOpenAction({ title: 'Update PCF rule', method: 'PUT', path: '/neData/pcf/rule', summary: 'Updates the selected PCF policy rule after confirmation.', risk: 'mutation', body: { neId: '001', num: 0, paramData: { imsi: '001010000000000' } } })}>Save rule</ActionButton>
          <ActionButton icon={Lock} variant="danger" onClick={() => onOpenAction({ title: 'Delete PCF rule', method: 'DELETE', path: '/neData/pcf/rule', summary: 'Deletes the selected PCF policy rule after confirmation.', risk: 'mutation', query: { neId: '001', value: 'SELECT_RECORD' } })}>Delete rule</ActionButton>
          <ActionButton icon={Upload} onClick={() => onOpenAction({ title: 'Import PCF rules', method: 'PUT', path: '/neData/pcf/rule/import', summary: 'Imports PCF rules from a managed upload file.', risk: 'mutation', query: { neId: '001', filePath: '/upload/netar/pcf.txt' } })}>Import</ActionButton>
        </div>
        <DataTable rows={rows} columns={[{ key: 'imsi', label: 'IMSI' }, { key: 'pccRules', label: 'PCC rules' }, { key: 'sessRules', label: 'Session rules' }, { key: 'neId', label: 'NE ID' }]} />
      </PanelFrame>
    </div>
  );
}
