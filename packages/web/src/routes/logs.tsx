import { createFileRoute } from '@tanstack/react-router';

import { WebLogs } from '../views/WebLogs/WebLogs';

export const Route = createFileRoute('/logs')({
  component: RouteComponent,
});

function RouteComponent() {
  return <WebLogs />;
}
