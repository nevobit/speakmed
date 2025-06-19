import { RouteObject } from 'react-router-dom';
import App from '../App';
import { ErrorBoundary } from '../screens';

export const routes: RouteObject[] = [
  {
    path: '/app',
    element: <App />,
    errorElement: <ErrorBoundary />,
  },
];
