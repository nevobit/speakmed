import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import styles from './Layout.module.css';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
  userName: string;
  active: string;
  onNavigate?: (section: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userName}) => {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.main}>
        <Header userName={userName} />
        <div className={styles.content}>
          <Outlet />
          {children}</div>
      </div>
    </div>
  );
};

export default Layout; 