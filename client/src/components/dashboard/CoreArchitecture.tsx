import { useState } from 'react';
import { Cloud, Database, RadioTower, ServerCog, X } from 'lucide-react';
import { Panel } from './Panel';

type CoreNode = {
  id: string;
  name: string;
  status: string;
  className: string;
  instances: string;
  cpu: string;
  memory: string;
};

const functions = [
  { id: 'AMF', name: 'Access & Mobility', status: 'Healthy', className: 'node-amf', instances: '6 / 6', cpu: '28%', memory: '42%' },
  { id: 'SMF', name: 'Session Management', status: 'Healthy', className: 'node-smf', instances: '6 / 6', cpu: '31%', memory: '45%' },
  { id: 'UPF', name: 'User Plane', status: 'Healthy', className: 'node-upf', instances: '8 / 8', cpu: '36%', memory: '48%' },
  { id: 'UDM', name: 'Unified Data Mgmt', status: 'Healthy', className: 'node-udm', instances: '4 / 4', cpu: '22%', memory: '40%' },
  { id: 'AUSF', name: 'Authentication', status: 'Healthy', className: 'node-ausf', instances: '3 / 3', cpu: '17%', memory: '36%' },
  { id: 'PCF', name: 'Policy Control', status: 'Healthy', className: 'node-pcf', instances: '4 / 4', cpu: '24%', memory: '41%' },
  { id: 'NRF', name: 'Repository', status: 'Healthy', className: 'node-nrf', instances: '3 / 3', cpu: '18%', memory: '37%' },
  { id: 'NSSF', name: 'Slice Selection', status: 'Healthy', className: 'node-nssf', instances: '2 / 2', cpu: '15%', memory: '34%' },
  { id: 'BSF', name: 'Binding Support', status: 'Healthy', className: 'node-bsf is-cyan', instances: '2 / 2', cpu: '19%', memory: '35%' },
  { id: 'CHF', name: 'Charging', status: 'Healthy', className: 'node-chf', instances: '3 / 3', cpu: '21%', memory: '38%' },
  { id: 'SCP', name: 'Service Communication', status: 'Healthy', className: 'node-scp', instances: '2 / 2', cpu: '16%', memory: '33%' },
] satisfies CoreNode[];

export function CoreArchitecture() {
  const [selectedNode, setSelectedNode] = useState<CoreNode | null>(null);

  return (
    <Panel title="5G Core Architecture" className="architecture-panel">
      <div className="architecture-map">
        <div className="architecture-inner">
          <span className="architecture-glow" />
          <svg className="architecture-links" viewBox="0 0 780 330" aria-hidden="true" preserveAspectRatio="none">
            <path className="link-plane user-plane" d="M105 94 H178 V156 H228" />
            <path className="link-plane user-plane" d="M105 225 H178 V156 H228" />
            <path className="link-plane control-plane" d="M560 92 H646 V67" />
            <path className="link-plane control-plane" d="M560 156 H646 V156" />
            <path className="link-plane control-plane" d="M560 222 H646 V248" />
            <path className="link-plane control-plane" d="M246 94 H552" />
            <path className="link-plane control-plane" d="M246 156 H477" />
            <path className="link-plane control-plane" d="M246 222 H552" />
            <path className="link-plane user-plane" d="M294 94 V156 M386 94 V222 M478 94 V156 M294 156 V222 M386 156 V222" />
            <path className="link-plane hot-line" d="M178 156 H228" />
            <circle className="link-pulse" cx="114" cy="94" r="3" />
            <circle className="link-pulse" cx="114" cy="225" r="3" />
            <circle className="link-pulse cyan" cx="646" cy="67" r="3" />
            <circle className="link-pulse cyan" cx="646" cy="156" r="3" />
            <circle className="link-pulse cyan" cx="646" cy="248" r="3" />
          </svg>

          <div className="site-node site-5g">
            <RadioTower size={26} />
            <span>gNB (5G)</span>
            <strong>12 Sites</strong>
            <i />
          </div>
          <div className="site-node site-4g">
            <RadioTower size={26} />
            <span>eNB (4G)</span>
            <strong>8 Sites</strong>
            <i />
          </div>

          <div className="core-box">
            <span className="core-title">5G Core (Service Based Architecture)</span>
            {functions.map((fn) => (
              <button
                key={fn.id}
                className={`core-node ${fn.className} ${selectedNode?.id === fn.id ? 'is-selected' : ''}`}
                type="button"
                aria-label={`Show ${fn.id} node details`}
                aria-pressed={selectedNode?.id === fn.id}
                onClick={() => setSelectedNode(fn)}
              >
                <strong>{fn.id}</strong>
                <span>{fn.status}</span>
              </button>
            ))}
          </div>

          {selectedNode && (
            <aside className="node-detail-card" aria-live="polite">
              <button className="node-detail-close" type="button" aria-label="Close node detail" onClick={() => setSelectedNode(null)}>
                <X size={13} />
              </button>
              <span>Selected Node</span>
              <strong>{selectedNode.id}</strong>
              <small>{selectedNode.name}</small>
              <dl>
                <div>
                  <dt>Status</dt>
                  <dd>{selectedNode.status}</dd>
                </div>
                <div>
                  <dt>Instances</dt>
                  <dd>{selectedNode.instances}</dd>
                </div>
                <div>
                  <dt>CPU</dt>
                  <dd>{selectedNode.cpu}</dd>
                </div>
                <div>
                  <dt>Mem</dt>
                  <dd>{selectedNode.memory}</dd>
                </div>
              </dl>
            </aside>
          )}

          <div className="external-node ext-internet">
            <Cloud size={25} />
            <span>Internet</span>
          </div>
          <div className="external-node ext-ims">
            <ServerCog size={25} />
            <span>IMS</span>
            <small>VoIP</small>
          </div>
          <div className="external-node ext-dn">
            <Database size={24} />
            <span>DN</span>
            <small>Data Network</small>
          </div>

          <div className="architecture-legend">
            <span>Legend:</span>
            <b className="status-dot green" /> Healthy
            <b className="status-dot yellow" /> Degraded
            <b className="status-dot red" /> Critical
            <b className="status-dot blue" /> Maintenance
            <i className="legend-control" /> Control Plane
            <i className="legend-user" /> User Plane
          </div>
        </div>
      </div>
    </Panel>
  );
}
