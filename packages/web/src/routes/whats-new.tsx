import { createFileRoute } from '@tanstack/react-router';

import { WebWhatsNew } from '../views/WebWhatsNew/WebWhatsNew';

export const Route = createFileRoute('/whats-new')({
  component: RouteComponent,
});

function RouteComponent() {
  return <WebWhatsNew />;
}
