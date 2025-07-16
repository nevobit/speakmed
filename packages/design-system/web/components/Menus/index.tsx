import React, {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from 'react';
import styles from './Menus.module.css';
import { MoreHorizontal, MoreVertical } from 'react-feather';
import { createPortal } from 'react-dom';
import { useOutsideClick } from '../../../utilities';

interface Props {
  children: React.ReactNode;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface MenusContextProps {
  open: (id: string) => void;
  close: () => void;
  openId: string;
  position: { x: number; y: number };
  setPosition: Dispatch<SetStateAction<{ x: number; y: number }>>;
}

const intialValues: MenusContextProps = {
  open,
  close,
  setPosition: () => {},
  openId: '',
  position: { x: 0, y: 0 },
};

const MenusContext = createContext(intialValues);

const Menus = ({ children }: Props) => {
  const [openId, setOpenId] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const close = () => setOpenId('');
  const open = setOpenId;

  return (
    <MenusContext.Provider
      value={{ openId, close, open, position, setPosition }}>
      {children}
    </MenusContext.Provider>
  );
};

const Menu: FC<Props> = ({ children }) => {
  return <div>{children}</div>;
};

const Toggle = ({
  id,
  children,
  vertical,
}: {
  id: string;
  children?: ReactNode;
  vertical?: boolean;
}) => {
  const { openId, close, open, setPosition } = useContext(MenusContext);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const buttonElement = (event.target as HTMLElement).closest('button');

    if (!buttonElement) {
      return;
    }
    const rect = buttonElement.getBoundingClientRect();
    if (typeof setPosition === 'function') {
      setPosition(
        () =>
          ({
            x: window.innerWidth - rect.width - rect.x,
            y: rect.y + rect.height + 8,
          }) as { x: number; y: number },
      );
    }
    openId === '' || openId !== id ? open(id) : close();
  };
  return (
    <button className={styles.toggle} onClick={handleClick}>
      {children ? (
        children
      ) : (
        <>
          {vertical ? <MoreHorizontal size={20} /> : <MoreVertical size={20} />}
        </>
      )}
    </button>
  );
};

interface ListProps {
  id: string;
  children: ReactNode;
}

const List: React.FC<ListProps> = ({ id, children }) => {
  const { openId, position, close } = useContext(MenusContext);
  const ref = useOutsideClick({ handler: close, listenCapturing: true });
  if (openId !== id) return null;

  return createPortal(
    <ul
      className={styles.list}
      style={{
        top: position && position.y,
        right: position && position.x,
      }}
      ref={ref}>
      {children}
    </ul>,
    document.body,
  );
};

const Button = ({ children, onClick, ...rest }: ButtonProps) => {
  const { close } = useContext(MenusContext);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    close();
  };

  return (
    <li>
      <button onClick={handleClick} className={styles.button} {...rest}>
        {children}
      </button>
    </li>
  );
};

Menus.Menu = Menu;
Menus.Toggle = Toggle;
Menus.List = List;
Menus.Button = Button;

export default Menus;
