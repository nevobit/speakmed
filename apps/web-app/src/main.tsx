import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildProvidersTree } from '@repo/design-system/common';
import { Modal } from '@repo/design-system/web';
import { AppRouter } from './router';
import '@repo/design-system/web/styles/index.css';

const queryClient = new QueryClient();
const ProvidersTree = buildProvidersTree([
  [QueryClientProvider, { client: queryClient }],
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProvidersTree>
      <Modal>
        <AppRouter />
      </Modal>
    </ProvidersTree>
  </React.StrictMode>,
);