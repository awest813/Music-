import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@nuclearplayer/i18n';
import { PlatformProvider } from '@nuclearplayer/platform';
import { webPlatform } from '@nuclearplayer/platform/web';

import '@nuclearplayer/tailwind-config';
import '@nuclearplayer/themes';
import './platform';

import { routeTree } from './routeTree.gen';
import { registerBuiltInCoreSettings } from './services/coreSettings';
import { registerDemoProviders } from './services/demoProviders';
import { providersHost } from './services/providersHost';
import { initializeFavoritesStore } from './stores/favoritesStore';
import { initializePlaylistStore } from './stores/playlistStore';
import { initializeQueueStore } from './stores/queueStore';
import { initializeSettingsStore } from './stores/settingsStore';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

const bootstrap = async (): Promise<void> => {
  await initializeSettingsStore();
  registerBuiltInCoreSettings();
  await registerDemoProviders();
  providersHost.resolveActiveOnBootstrap();
  await Promise.all([
    initializeQueueStore(),
    initializeFavoritesStore(),
    initializePlaylistStore(),
  ]);
};

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

bootstrap().then(() => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PlatformProvider platform={webPlatform}>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </I18nextProvider>
      </PlatformProvider>
    </React.StrictMode>,
  );
});
