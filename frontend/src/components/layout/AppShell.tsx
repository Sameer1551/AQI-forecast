import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useHealth } from '@/hooks/useHealth';
import styles from './AppShell.module.css';

export default function AppShell() {
  useHealth();

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Header />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <div className={styles.bgPattern} aria-hidden />
    </div>
  );
}
