import React from 'react';
import styles from './Field.module.css';

interface Props extends React.InputHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  label?: string;
  tip?: string;
  error?: string;
}

const Field = ({ children, label, tip, error, className, ...rest }: Props) => {
  return (
    <div className={`${styles.field} ${className}`} {...rest}>
      {label && <label className={styles.label}>{label}</label>}
      {children}
      {tip && <div className={styles.tip}>{tip}</div>}
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default Field;
