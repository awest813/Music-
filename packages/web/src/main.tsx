import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@nuclearplayer/i18n';
import { PlatformProvider } from '@nuclearplayer/platform';
import { webPlatform } from '@nuclearplayer/platform/web';

import '@nuclearplayer/tailwind-config';
import '@nuclearplayer/themes';

import { WebApp } from './WebApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PlatformProvider platform={webPlatform}>
      <I18nextProvider i18n={i18n}>
        <WebApp />
      </I18nextProvider>
    </PlatformProvider>
  </React.StrictMode>,
);
