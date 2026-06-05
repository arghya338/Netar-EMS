import { useState } from 'react';
import { AlarmsPage } from './alarms/AlarmsPage';
import { OverviewPage } from './overview/OverviewPage';
import { ConfigPage } from './pages/ConfigPage';
import { DiagnosticsPage } from './pages/DiagnosticsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { NetworkElementsPage } from './pages/NetworkElementsPage';
import { PerformancePage } from './pages/PerformancePage';
import { PolicyPage } from './pages/PolicyPage';
import { ReportsPage } from './pages/ReportsPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { TopologyPage } from './pages/TopologyPage';
import { GuardedActionModal, type GuardedAction, type OperationsRouterProps, type PageProps } from './shared';

export function OperationsRouter({ activeNav, searchQuery, session, onNavigate }: OperationsRouterProps) {
  const [action, setAction] = useState<GuardedAction | null>(null);

  const props: PageProps = {
    onOpenAction: setAction,
    searchQuery,
    session,
    onNavigate,
  };

  return (
    <>
      {activeNav === 'Overview' && <OverviewPage {...props} />}
      {activeNav === 'Topology' && <TopologyPage {...props} />}
      {activeNav === 'Network Elements' && <NetworkElementsPage {...props} />}
      {activeNav === 'NE Configuration' && <ConfigPage {...props} />}
      {activeNav === 'Maintenance' && <MaintenancePage {...props} />}
      {activeNav === 'Performance' && <PerformancePage {...props} />}
      {activeNav === 'Sessions' && <SessionsPage {...props} />}
      {activeNav === 'Subscribers' && <SubscribersPage {...props} />}
      {activeNav === 'Policy' && <PolicyPage {...props} />}
      {activeNav === 'Alarms' && <AlarmsPage {...props} />}
      {activeNav === 'Diagnostics' && <DiagnosticsPage {...props} />}
      {activeNav === 'Reports' && <ReportsPage {...props} />}
      {activeNav === 'Settings' && <SettingsPage {...props} />}
      <GuardedActionModal action={action} session={session} onClose={() => setAction(null)} />
    </>
  );
}
