import React, { ReactNode } from 'react';
import styles from './Textarea.module.css';

interface TextareaProps extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  icon?: ReactNode;
  className?: string;
}

const Textarea = ({ ...rest }: TextareaProps) => {
  return (
    <div className={styles.input}>
      <textarea className={styles.input_element} {...rest}></textarea>
    </div>
  );
};

export default Textarea;
