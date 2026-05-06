import { createFileRoute } from '@tanstack/react-router';

import { WebPlugins } from '../views/WebPlugins';

export const Route = createFileRoute('/plugins')({
  component: WebPlugins,
});
