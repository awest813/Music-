import { createFileRoute } from '@tanstack/react-router';

import { WebSources } from '../views/WebSources';

export const Route = createFileRoute('/sources')({
  component: WebSources,
});
