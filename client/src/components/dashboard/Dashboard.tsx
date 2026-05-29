import { useState } from 'react';
import type { TopologyNode } from '../../types/dashboard';
import { MetricStrip, PerformanceTrendsPanel, ResourceUtilizationPanel } from './MetricPanels';
import { RightRail } from './RightRail';
import { SummaryCards } from './SummaryCards';
import { TopologyPanel } from './TopologyPanel';

export function Dashboard() {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [railMode, setRailMode] = useState<'alerts' | 'node'>('alerts');

  const handleSelectNode = (node: TopologyNode) => {
    setSelectedNode(node);
    setRailMode('node');
  };

  const handleCloseNode = () => {
    setSelectedNode(null);
    setRailMode('alerts');
  };

  return (
    <div className="dashboard-page">
      <div className="overview-layout">
        <main className="overview-main">
          <SummaryCards />
          <TopologyPanel
            selectedNodeId={selectedNode?.id ?? null}
            onSelectNode={handleSelectNode}
          />
          <MetricStrip />
          <div className="lower-dashboard-grid">
            <PerformanceTrendsPanel />
            <ResourceUtilizationPanel />
          </div>
        </main>
        <RightRail selectedNode={selectedNode} mode={railMode} onCloseNode={handleCloseNode} />
      </div>
    </div>
  );
}
