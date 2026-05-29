import { ChevronDown, Expand, Info, Maximize2, MoreVertical, RadioTower } from 'lucide-react';
import { topologyLinks, topologyNodes, topologyToolbar } from '../../data/overviewData';
import type { TopologyNode } from '../../types/dashboard';

interface TopologyPanelProps {
  selectedNodeId: string | null;
  onSelectNode: (node: TopologyNode) => void;
}

const TOPOLOGY_WIDTH = 1040;
const TOPOLOGY_HEIGHT = 302;

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

const getNodeStyle = (node: TopologyNode) => ({
  left: toPercent(node.x, TOPOLOGY_WIDTH),
  top: toPercent(node.y, TOPOLOGY_HEIGHT),
  width: `clamp(${node.width > 120 ? 108 : 70}px, ${toPercent(node.width, TOPOLOGY_WIDTH)}, ${node.width}px)`,
  height: `${node.height}px`,
});

export function TopologyPanel({ selectedNodeId, onSelectNode }: TopologyPanelProps) {
  return (
    <section className="panel topology-panel">
      <header className="panel-header topology-header">
        <h2>
          5G Core Topology & Service Flow
          <Info size={15} />
        </h2>
        <div className="topology-toolbar" aria-label="Topology controls">
          <button type="button">Layout: {topologyToolbar.layout}<ChevronDown size={13} /></button>
          <button type="button">{topologyToolbar.view}<ChevronDown size={13} /></button>
          <button type="button" aria-label="Fit topology"><Expand size={15} /></button>
          <button type="button" aria-label="Fullscreen topology"><Maximize2 size={15} /></button>
          <button type="button" aria-label="More topology actions"><MoreVertical size={15} /></button>
        </div>
      </header>

      <div className="topology-canvas">
        <svg className="topology-links" viewBox={`0 0 ${TOPOLOGY_WIDTH} ${TOPOLOGY_HEIGHT}`} aria-hidden="true" preserveAspectRatio="none">
          {topologyLinks.map((link) => (
            <g key={link.id}>
              <polyline className={`topology-link ${link.type}`} points={link.points} />
              {link.label && link.labelX && link.labelY && (
                <text x={link.labelX} y={link.labelY} className="topology-link-label">
                  {link.label}
                </text>
              )}
            </g>
          ))}
        </svg>

        <div className="gnb-block">
          <RadioTower size={50} strokeWidth={1.45} />
          <strong>gNB</strong>
        </div>

        {topologyNodes.map((node) => (
          <button
            key={node.id}
            className={`topology-node node-${node.status} ${selectedNodeId === node.id ? 'is-selected' : ''}`}
            type="button"
            style={getNodeStyle(node)}
            aria-pressed={selectedNodeId === node.id}
            aria-label={`Show ${node.label} details`}
            onClick={() => onSelectNode(node)}
          >
            <strong>{node.label}</strong>
            <i />
          </button>
        ))}

        <div className="dn-cloud">
          <span>DN</span>
          <small>Data Network</small>
        </div>

        <div className="topology-legend">
          <span><i className="legend-line control" />Control Plane</span>
          <span><i className="legend-line user" />User Plane</span>
          <span><i className="status-dot green" />Healthy</span>
          <span><i className="status-dot yellow" />Warning</span>
          <span><i className="status-dot red" />Critical</span>
          <span><i className="status-dot unknown" />Unknown</span>
        </div>
      </div>
    </section>
  );
}
