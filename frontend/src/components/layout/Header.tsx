import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useStations } from '@/hooks/useStations';
import { getAQIColorHSL } from '@/utils/aqiColors';
import styles from './Header.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Live Map',
  '/forecast': 'Station Forecast',
  '/graph': 'Graph Explorer',
  '/scenario': 'Scenario Simulation',
  '/insights': 'Model Insights',
  '/monitoring': 'System Monitoring',
};

export default function Header() {
  const location = useLocation();
  const isDemoMode = useAppStore((s) => s.isDemoMode);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const { data: stations } = useStations();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => {
      setClock(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'Asia/Kolkata',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const hazardousCount = stations?.filter((s) => s.current_aqi > 200).length ?? 0;
  const title = PAGE_TITLES[location.pathname] ?? 'MAADG AQI';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar}>
          <Menu size={18} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <div className={styles.center}>
        <span className={styles.versionBadge}>MAADG v2.1.0</span>
        {isDemoMode && <span className={styles.demoBadge}>DEMO MODE — Mock data</span>}
      </div>
      <div className={styles.right}>
        <span className={styles.clock}>{clock} IST</span>
        <button className={styles.bellBtn}>
          <Bell size={18} />
          {hazardousCount > 0 && (
            <span className={styles.bellCount} style={{ background: getAQIColorHSL(300) }}>
              {hazardousCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
