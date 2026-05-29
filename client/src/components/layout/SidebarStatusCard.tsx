import { ShieldCheck } from 'lucide-react';

export function SidebarStatusCard() {
  return (
    <section className="system-card">
      <div className="system-head">
        <span className="shield-wrap">
          <ShieldCheck size={28} />
        </span>
        <div>
          <span>System Status</span>
          <strong>Healthy</strong>
          <small>All systems operational</small>
        </div>
      </div>
      <ul>
        <li><i />Core Network</li>
        <li><i />Database</li>
        <li><i />File System</li>
        <li><i />Message Queue</li>
      </ul>
    </section>
  );
}
