import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildProvidersTree } from '@repo/design-system/common';
import { Modal } from '@repo/design-system/web';
import { AppRouter } from './router';
import { GoogleOAuthProvider } from "@react-oauth/google";
import '@repo/design-system/web/styles/index.css';


const { VITE_GOOGLE_CLIENT_ID } = import.meta.env;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, 
      retry: 1, 
      staleTime: 300000,
    },
  },
});
const ProvidersTree = buildProvidersTree([
  [QueryClientProvider, { client: queryClient }],
  [GoogleOAuthProvider, { clientId: VITE_GOOGLE_CLIENT_ID }],
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