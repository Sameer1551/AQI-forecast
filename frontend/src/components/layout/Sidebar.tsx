import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Share2, Sliders, Brain, Activity } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import StatusDot from '@/components/ui/StatusDot';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/', label: 'Map', icon: Home },
  { to: '/forecast', label: 'Forecast', icon: BarChart2 },
  { to: '/graph', label: 'Graph', icon: Share2 },
  { to: '/scenario', label: 'Scenario', icon: Sliders },
  { to: '/insights', label: 'Insights', icon: Brain },
  { to: '/monitoring', label: 'Monitoring', icon: Activity },
];

export default function Sidebar() {
  const isCollapsed = useAppStore((s) => s.isSidebarCollapsed);
  const isApiOnline = useAppStore((s) => s.isApiOnline);
  const isDemoMode = useAppStore((s) => s.isDemoMode);

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.brand}>
          <svg width="28" height="28" viewBox="0 0 28 28" className={styles.logo}>
            <circle cx="6" cy="8" r="3" fill="var(--accent-cyan)" className={styles.node1} />
            <circle cx="22" cy="6" r="3" fill="var(--accent-blue)" className={styles.node2} />
            <circle cx="14" cy="20" r="3" fill="var(--accent-purple)" className={styles.node3} />
            <line x1="6" y1="8" x2="22" y2="6" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.5" />
            <line x1="6" y1="8" x2="14" y2="20" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.5" />
            <line x1="22" y1="6" x2="14" y2="20" stroke="var(--accent-purple)" strokeWidth="1" opacity="0.5" />
          </svg>
          {!isCollapsed && <span className={styles.brandName}>MAADG AQI</span>}
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              title={item.label}
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.status}>
            <StatusDot status={isApiOnline ? 'ok' : 'offline'} size={8} label={!isCollapsed ? (isApiOnline ? 'API Online' : 'API Offline') : undefined} />
          </div>
          {isDemoMode && !isCollapsed && (
            <span className={styles.demoBadge}>DEMO</span>
          )}
        </div>
      </aside>
    </>
  );
}
