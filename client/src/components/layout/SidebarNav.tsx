import { overviewNavigation } from '../../data/overviewData';

interface SidebarNavProps {
  activeNav: string;
  onSelect: (label: string) => void;
}

export function SidebarNav({ activeNav, onSelect }: SidebarNavProps) {
  return (
    <nav className="nav-list" aria-label="EMS navigation">
      {overviewNavigation.map((item) => {
        const Icon = item.icon;
        const active = item.label === activeNav;

        return (
          <button
            className={`nav-item ${active ? 'is-active' : ''}`}
            key={item.label}
            type="button"
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(item.label)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{item.label}</span>
            {item.badge && <b>{item.badge}</b>}
          </button>
        );
      })}
    </nav>
  );
}
