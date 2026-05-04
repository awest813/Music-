import { FC, useMemo } from 'react';

import { usePlatform } from '@nuclearplayer/platform';
import { Badge, Box, Button, Toaster } from '@nuclearplayer/ui';

const FEATURES = [
  'Shared Nuclear UI, themes, i18n, model, hifi, and plugin SDK packages',
  'IndexedDB-backed settings, favorites, queue, playlists, and plugins',
  'Backend-backed streaming through /stream and /invoke endpoints',
  'Installable PWA app shell with offline caching for static assets',
];

export const WebApp: FC = () => {
  const platform = usePlatform();
  const unsupported = useMemo(
    () =>
      [
        !platform.capabilities.discord ? 'Discord Rich Presence' : null,
        !platform.capabilities.nativeUpdater ? 'Native auto-updates' : null,
        !platform.capabilities.filesystemWatch
          ? 'Local directory watchers'
          : null,
      ].filter(Boolean),
    [platform.capabilities],
  );

  return (
    <main className="bg-background text-foreground min-h-screen p-6 md:p-10">
      <section className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-4">
          <Badge variant="pill" color="green">
            Web preview
          </Badge>
          <h1 className="font-heading text-5xl font-black tracking-tight">
            Nuclear Music Player for the web
          </h1>
          <p className="text-muted-foreground max-w-3xl text-lg">
            This browser target reuses Nuclear's shared packages while routing
            native desktop capabilities through a platform abstraction and a
            lightweight backend.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <Box
              key={feature}
              className="border-border shadow-brutal border-2 p-5"
            >
              {feature}
            </Box>
          ))}
        </div>

        <Box className="border-border shadow-brutal flex flex-col gap-4 border-2 p-5">
          <h2 className="font-heading text-2xl font-bold">Runtime status</h2>
          <p>
            Backend URL:{' '}
            {import.meta.env.VITE_NUCLEAR_SERVER_URL ?? 'http://localhost:3473'}
          </p>
          <p>Desktop-only capabilities disabled: {unsupported.join(', ')}</p>
          <div>
            <Button
              onClick={() =>
                platform.shell.openUrl('https://github.com/nukeop/nuclear')
              }
            >
              Open Nuclear on GitHub
            </Button>
          </div>
        </Box>
      </section>
      <Toaster />
    </main>
  );
};
