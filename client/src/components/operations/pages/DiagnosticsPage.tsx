import { Lock, Play, Terminal, X } from 'lucide-react';
import {
  type PageProps,
  ActionButton,
  PageHeader,
  PanelFrame,
} from '../shared';

export function DiagnosticsPage({ onOpenAction }: PageProps) {
  return (
    <div className="ops-page">
      <PageHeader title="Diagnostics" detail="Packet capture start and stop controls with explicit operator confirmation and timeout guidance." icon={Terminal} count={2} />
      <div className="ops-grid one-one">
        <PanelFrame title="Start packet capture" icon={Play}>
          <p className="ops-copy">Starts tcpdump on a selected network element. Use narrow filters and a short capture window to protect storage and control-plane performance.</p>
          <ActionButton icon={Lock} variant="primary" onClick={() => onOpenAction({ title: 'Start packet capture', method: 'POST', path: '/trace/tcpdump/start', summary: 'Starts packet capture on a selected network element.', risk: 'control', body: { neType: 'UDM', neId: '001', cmd: '-n -s 0 -v' } })}>Start capture</ActionButton>
        </PanelFrame>
        <PanelFrame title="Stop packet capture" icon={X}>
          <p className="ops-copy">Stops a running capture task and returns generated artifact names.</p>
          <ActionButton icon={Lock} onClick={() => onOpenAction({ title: 'Stop packet capture', method: 'POST', path: '/trace/tcpdump/stop', summary: 'Stops a packet capture task and retrieves artifacts.', risk: 'control', body: { neType: 'UDM', neId: '001', taskCode: 'TASK_CODE' } })}>Stop capture</ActionButton>
        </PanelFrame>
      </div>
    </div>
  );
}
