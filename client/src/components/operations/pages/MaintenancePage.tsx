import { CheckCircle2, Download, FileText, HardDrive, Play, Server, ShieldCheck, Terminal, Upload, Wrench } from 'lucide-react';
import { useState } from 'react';
import {
  type ApiRow,
  type PageProps,
  ActionButton,
  ApiNotice,
  DataTable,
  FilterStrip,
  PageHeader,
  PanelFrame,
  displayValue,
  firstNe,
  pageEndpointCount,
  rowsFromResult,
  useApiQuery,
  useNetworkElements,
} from '../shared';

export function MaintenancePage({ session, onOpenAction }: PageProps) {
  const neQuery = useNetworkElements(session);
  const nes = rowsFromResult(neQuery.result);
  const ne = firstNe(nes, 'IMS');
  const [path, setPath] = useState('/var/log');
  const files = useApiQuery(session, '/ne/action/files', { neType: displayValue(ne.neType), neId: displayValue(ne.neId), path, pageNum: 1, pageSize: 25 });
  const fileRows = rowsFromResult(files.result);
  const firstFile = fileRows[0];
  const neRecord = ne as ApiRow;
  const hostId = displayValue(neRecord.hostId ?? neRecord.id ?? 'HOST_ID');

  return (
    <div className="ops-page">
      <PageHeader title="Maintenance" detail="File operations, service controls, and host access with explicit operator approval." icon={Wrench} count={pageEndpointCount('Maintenance')} />
      <PanelFrame title="File browser" icon={HardDrive}>
        <FilterStrip>
          <span>{displayValue(ne.neType)} / {displayValue(ne.neId)}</span>
          <input value={path} onChange={(event) => setPath(event.target.value)} aria-label="Directory path" />
        </FilterStrip>
        <ApiNotice result={files.result} loading={files.loading} />
        <div className="button-row">
          <ActionButton icon={FileText} onClick={() => onOpenAction({
            title: 'View selected file',
            method: 'GET',
            path: '/ne/action/viewFile',
            summary: 'Reads live network element file contents. Require explicit file choice and approval.',
            risk: 'sensitive-read',
            query: { neType: displayValue(ne.neType), neId: displayValue(ne.neId), path, fileName: displayValue(firstFile?.fileName) },
          })}>View file</ActionButton>
          <ActionButton icon={Download} onClick={() => onOpenAction({
            title: 'Copy selected file',
            method: 'GET',
            path: '/ne/action/pullFile',
            summary: 'Copies a file from the network element to local OMC storage. Treat as side-effecting.',
            risk: 'side-effect-get',
            query: { neType: displayValue(ne.neType), neId: displayValue(ne.neId), path, fileName: displayValue(firstFile?.fileName), delTemp: false },
          })}>Copy file</ActionButton>
          <ActionButton icon={Upload} onClick={() => onOpenAction({ title: 'Upload file', method: 'POST', path: '/file/upload', summary: 'Uploads a file to the managed file area.', risk: 'mutation' })}>Upload</ActionButton>
          <ActionButton icon={Play} onClick={() => onOpenAction({
            title: 'Control service',
            method: 'PUT',
            path: '/ne/action/service',
            summary: 'Starts, stops, or restarts a network element service.',
            risk: 'control',
            body: { neType: displayValue(ne.neType), neId: displayValue(ne.neId), action: 'restart' },
          })}>Service</ActionButton>
          <ActionButton icon={ShieldCheck} onClick={() => onOpenAction({
            title: 'Authorize host access',
            method: 'POST',
            path: '/ne/host/authorizedBySSH',
            summary: 'Authorizes host access for managed network element maintenance.',
            risk: 'control',
            body: { hostId, username: 'operator' },
          })}>Authorize host</ActionButton>
          <ActionButton icon={CheckCircle2} onClick={() => onOpenAction({
            title: 'Check host environment',
            method: 'POST',
            path: '/ne/host/checkBySSH',
            summary: 'Checks host readiness and basic access state.',
            risk: 'control',
            body: { hostId },
          })}>Check host</ActionButton>
          <ActionButton icon={Server} onClick={() => onOpenAction({
            title: 'Test host connection',
            method: 'POST',
            path: '/ne/host/test',
            summary: 'Tests connectivity to the selected host.',
            risk: 'control',
            body: { hostId },
          })}>Test host</ActionButton>
          <ActionButton icon={Terminal} onClick={() => onOpenAction({
            title: 'Run host command',
            method: 'POST',
            path: '/ne/host/cmd',
            summary: 'Executes an allowlisted command on a managed host after confirmation.',
            risk: 'control',
            body: { hostId, cmd: 'pwd' },
          })}>Host command</ActionButton>
        </div>
        <DataTable rows={fileRows} columns={[{ key: 'fileName', label: 'File' }, { key: 'fileType', label: 'Type' }, { key: 'size', label: 'Size' }, { key: 'modifyTime', label: 'Modified' }]} />
      </PanelFrame>
    </div>
  );
}

