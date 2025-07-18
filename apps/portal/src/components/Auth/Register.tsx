import React, { useState } from 'react';
import styles from './Register.module.css';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !repeatPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    // Simulación de registro exitoso
    setError('');
    navigate('/');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Crear cuenta en Speakmed</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre completo"
            value={name}
            onChange={e => setName(e.target.value)}
            className={styles.input}
          />
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
          <input
            type="password"
            placeholder="Repetir contraseña"
            value={repeatPassword}
            onChange={e => setRepeatPassword(e.target.value)}
            className={styles.input}
          />
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.button}>Crear cuenta</button>
        </form>
        <div className={styles.links}>
          <button className={styles.link} onClick={() => navigate('/login')}>¿Ya tienes cuenta? Inicia sesión</button>
        </div>
      </div>
    </div>
  );
};

export default Register; 