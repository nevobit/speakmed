import React from 'react';
import styles from './Header.module.css';

const Header: React.FC<{ userName: string }> = ({ userName }) => {
  return (
    <header className={styles.header}>
      <div />
      <div className={styles.right}>
        <button className={styles.langBtn}>ES</button>
        <div className={styles.user}>
          <span className={styles.avatar}>👤</span>
          <span>{userName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header; 