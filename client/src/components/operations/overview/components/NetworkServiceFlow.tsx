import { Cloud, RadioTower } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { displayValue, formatFlowCounter, formatNumber, type ApiRow } from '../../shared';
import {
  TOPOLOGY_LINKS,
  TOPOLOGY_VIEWBOX,
  buildTopologyNodes,
  isLinkRenderable,
  isLinkLive,
  type TopologyNodeView,
} from '../model';

interface NetworkServiceFlowProps {
  rows: ApiRow[];
  selectedType: string | null;
  onSelectType: (type: string) => void;
  baseStationCount: number;
  upFlow: number | null;
  downFlow: number | null;
  loading?: boolean;
}

const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

function nodeStyle(node: TopologyNodeView): CSSProperties {
  return {
    left: toPercent(node.x, TOPOLOGY_VIEWBOX.width),
    top: toPercent(node.y, TOPOLOGY_VIEWBOX.height),
    width: `clamp(${Math.min(104, node.width)}px, ${toPercent(node.width, TOPOLOGY_VIEWBOX.width)}, ${node.width}px)`,
    height: `${node.height}px`,
  };
}

function nodeAriaLabel(node: TopologyNodeView) {
  const status = node.status === 'unknown' ? 'not discovered' : node.status;
  return `${node.label}, ${node.online} of ${node.total} online, ${status}. Select to inspect ${node.label}.`;
}

function selectedNodeCopy(node?: TopologyNodeView) {
  if (!node) {
    return {
      title: 'No function selected',
      detail: 'Select a network function to inspect live inventory metadata.',
    };
  }

  if (node.total === 0) {
    return {
      title: `${node.label} not discovered`,
      detail: 'No inventory record is available for this function in the live NE list.',
    };
  }

  return {
    title: `${node.label} ${node.status}`,
    detail: `${node.online}/${node.total} online · ${node.ip} · ${node.version}`,
  };
}

export function NetworkServiceFlow({
  rows,
  selectedType,
  onSelectType,
  baseStationCount,
  upFlow,
  downFlow,
  loading = false,
}: NetworkServiceFlowProps) {
  const [inspectedNodeId, setInspectedNodeId] = useState<string | null>(null);
  const nodes = buildTopologyNodes(rows);
  const selectedNode = nodes.find((node) => node.label === selectedType) ?? nodes.find((node) => node.label === 'UPF');
  const inspectedNode = nodes.find((node) => node.id === inspectedNodeId) ?? selectedNode;
  const effectiveSelectedType = selectedNode?.label ?? null;
  const effectiveInspectedNodeId = inspectedNode?.id ?? null;
  const upfOnline = (nodes.find((node) => node.label === 'UPF')?.online ?? 0) > 0;
  const visibleLinks = TOPOLOGY_LINKS.filter((link) => isLinkRenderable(link, nodes));
  const hasTraffic = Boolean((upFlow ?? 0) > 0 || (downFlow ?? 0) > 0);
  const inspectorCopy = selectedNodeCopy(inspectedNode);
  const dataNetworkState = hasTraffic ? 'Traffic flowing' : upfOnline ? 'UPF connected' : 'Waiting for UPF';

  return (
    <section className="ref-card ref-flow-card production-flow-card" aria-labelledby="overview-flow-title">
      <header>
        <div>
          <h2 id="overview-flow-title">5G Core Topology &amp; Data Flow</h2>
          <span className="ref-flow-subtitle">{dataNetworkState}</span>
        </div>
      </header>

      <div className="ref-flow-scroll" tabIndex={0} aria-label="Scrollable topology diagram">
        <div className={`ref-flow-canvas ${loading ? 'is-loading' : ''}`} role="img" aria-label="5G core topology showing control plane and user plane paths to the data network">
          <svg
            className="ref-flow-svg"
            viewBox={`0 0 ${TOPOLOGY_VIEWBOX.width} ${TOPOLOGY_VIEWBOX.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {visibleLinks.map((link) => {
              const live = isLinkLive(link, nodes, baseStationCount, upfOnline);
              return (
                <g key={link.id} className={`ref-link-group link-${link.id}`}>
                  <path className={`ref-topology-link is-${link.kind} ${live ? 'is-live' : 'is-muted'}`} d={link.path} pathLength={100} />
                  {live && (
                    <path
                      className={`ref-topology-pulse is-${link.kind} ${hasTraffic ? 'has-traffic' : 'is-heartbeat'}`}
                      d={link.path}
                      pathLength={100}
                    />
                  )}
                  {link.label && (
                    <text x={link.labelX} y={link.labelY} className={`ref-topology-label is-${link.kind}`}>
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className={`ref-external-node ref-gnb ${baseStationCount > 0 ? 'is-online' : 'is-empty'}`}>
            <RadioTower size={34} strokeWidth={1.7} />
            <strong>gNB</strong>
            <span>{formatNumber(baseStationCount)} active</span>
          </div>

          {nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              className={`ref-flow-node nf-${node.id} plane-${node.plane ?? 'core'} is-${node.status} ${effectiveSelectedType === node.label ? 'is-selected' : ''} ${effectiveInspectedNodeId === node.id ? 'is-inspected' : ''}`}
              style={nodeStyle(node)}
              aria-pressed={effectiveSelectedType === node.label}
              aria-label={nodeAriaLabel(node)}
              onMouseEnter={() => setInspectedNodeId(node.id)}
              onMouseLeave={() => setInspectedNodeId((current) => (current === node.id ? null : current))}
              onFocus={() => setInspectedNodeId(node.id)}
              onBlur={() => setInspectedNodeId((current) => (current === node.id ? null : current))}
              onClick={() => onSelectType(node.label)}
            >
              <strong>{node.label}</strong>
              <small>{node.online}/{node.total}</small>
              <i aria-hidden="true" />
            </button>
          ))}

          <div className={`ref-external-node ref-dn ${upfOnline ? 'is-online' : 'is-empty'}`}>
            <Cloud size={82} strokeWidth={1.5} />
            <strong>DN</strong>
            <span>Data Network</span>
          </div>
        </div>
      </div>

      <div className="ref-flow-status" aria-live="polite">
        <div>
          <span>Selected function</span>
          <strong>{inspectorCopy.title}</strong>
          <small>{inspectorCopy.detail}</small>
        </div>
        <div>
          <span>Data path</span>
          <strong>{displayValue(dataNetworkState)}</strong>
          <small>DL {downFlow !== null ? formatFlowCounter(downFlow) : '—'} · UL {upFlow !== null ? formatFlowCounter(upFlow) : '—'}</small>
        </div>
      </div>

      <footer className="ref-flow-legend">
        <span><i className="control" />Control Plane</span>
        <span><i className="user" />User Plane</span>
        <span><i className="inactive" />Inactive</span>
        <span><b className="healthy" />Healthy</span>
        <span><b className="warning" />Partial</span>
        <span><b className="critical" />Offline</span>
      </footer>
    </section>
  );
}
