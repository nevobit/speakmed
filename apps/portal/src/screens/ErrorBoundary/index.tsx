import styles from './ErrorBoundary.module.css';

const ErrorBoundary = () => {
  return (
    <div className={styles.container} role="alert">
      <h3>Bienvenido </h3>
      {/* <p>Were not exactly sure what happend, but something went wrong.</p> */}
      {/* <p> */}
        {/* Uf you need innmediate helm please <a href="/">let us know</a> */}
      {/* </p> */}
      <a href='/' >Ir al Dashboard</a>
    </div>
  );
};

export default ErrorBoundary;
