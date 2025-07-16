import { Button } from '@repo/design-system/web';
import styles from './ErrorBoundary.module.css';

const ErrorBoundary = () => {
  return (
    <div className={styles.container} role="alert">
      <h3>Oops, that´s our bad </h3>
      <p>Were not exactly sure what happend, but something went wrong.</p>
      <p>
        Uf you need innmediate helm please <a href="/">let us know</a>
      </p>
      <Button>Try again</Button>
    </div>
  );
};

export default ErrorBoundary;
