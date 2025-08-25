import React from 'react';
import {
  LayoutDashboard,
  Mic,
  FileText,
  Settings,
  CreditCard,
  User,
  BookOpen,
  Brain,
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>SPEAKHELP</div>
      <nav>
        <ul>
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? styles.active : ''} end>
              <LayoutDashboard size={20} /> Panel
            </NavLink>
          </li>
          <li>
            <NavLink to="/recording" className={({ isActive }) => isActive ? styles.active : ''}>
              <Mic size={20} /> Grabación
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => isActive ? styles.active : ''}>
              <FileText size={20} /> Mis informes
            </NavLink>
          </li>
          <li>
            <NavLink to="/personalization" className={({ isActive }) => isActive ? styles.active : ''}>
              <Settings size={20} /> Personalización
            </NavLink>
          </li>
          <li>
            <NavLink to="/subscription" className={({ isActive }) => isActive ? styles.active : ''}>
              <CreditCard size={20} /> Suscripción
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" className={({ isActive }) => isActive ? styles.active : ''}>
              <User size={20} /> Mi perfil
            </NavLink>
          </li>
          <li>
            <NavLink to="/vademecum" className={({ isActive }) => isActive ? styles.active : ''}>
              <BookOpen size={20} /> Vademécum
            </NavLink>
          </li>
          {/* <li>
            <NavLink to="/descargar-receta" className={({ isActive }) => isActive ? styles.active : ''}>
              <Download size={20} /> Descargar receta
            </NavLink>
          </li>
          <li>
            <NavLink to="/descargar-examenes" className={({ isActive }) => isActive ? styles.active : ''}>
              <Download size={20} /> Descargar exámenes
            </NavLink>
          </li> */}
          <li>
            <NavLink to="/transcripcion-diarizacion" className={({ isActive }) => isActive ? styles.active : ''}>
              <Mic size={20} /> Transcripción IA
            </NavLink>
          </li>
          <li>
            <NavLink to="/validacion-medicamentos" className={({ isActive }) => isActive ? styles.active : ''}>
              <FileText size={20} /> Validar Medicamentos
            </NavLink>
          </li>
          <li>
            <NavLink to="/validacion-ia" className={({ isActive }) => isActive ? styles.active : ''}>
              <Brain size={20} /> Validación Automática
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 