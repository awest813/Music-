import { createFileRoute } from '@tanstack/react-router';

import { WebSettings } from '../views/WebSettings';

export const Route = createFileRoute('/settings')({
  component: WebSettings,
});
