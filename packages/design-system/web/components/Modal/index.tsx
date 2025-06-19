import { createContext, useContext, useState, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

type ModalContextType = {
  openModal: (modal: ReactNode) => void;
  closeModal: () => void;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const Modal = ({ children }: { children?: ReactNode }) => {
  const [modalStack, setModalStack] = useState<ReactNode[]>([]);

  const openModal = (modal: ReactNode) => {
    setModalStack((prev) => [...prev, modal]);
  };

  const closeModal = () => {
    setModalStack((prev) => prev.slice(0, -1));
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modalStack.map((modal, index) => (
        <div key={index} style={{ zIndex: 1000 + index }}>
          {modal}
        </div>
      ))}
    </ModalContext.Provider>
  );
};

const Window = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
};

Modal.Window = Window;
Modal.Header = ({ children }: { children: ReactNode }) => (
  <div className={styles.modal_header}>{children}</div>
);
Modal.Body = ({ children }: { children: ReactNode }) => (
  <div className={styles.body}>{children}</div>
);
Modal.Footer = ({ children }: { children: ReactNode }) => (
  <div className={styles.footer}>{children}</div>
);
