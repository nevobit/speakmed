import { ReactNode } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  className?: string;
  checkBox?: boolean;
}

const Input = ({ icon, className, checkBox = false, ...rest }: InputProps) => {
  return (
    <div className={`${styles.input} ${checkBox && styles.check}`}>
      {icon && icon}
      <input
        {...rest}
        className={`${styles.input_element} ${
          className == 'none' && styles.input_none
        }`}
      />
    </div>
  );
};

export default Input;
