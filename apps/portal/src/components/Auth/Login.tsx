import React, { useState } from 'react';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    // Simulación de login exitoso
    setError('');
    navigate('/app');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Iniciar sesión en Speakmed</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={styles.input}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={styles.input}
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.button}>Iniciar sesión</button>
        </form>
        <div className={styles.links}>
          <button className={styles.link} onClick={() => navigate('/register')}>Crear cuenta</button>
          <span>|</span>
          <button className={styles.link} type="button">¿Has olvidado tu contraseña?</button>
        </div>
      </div>
    </div>
  );
};

export default Login; 