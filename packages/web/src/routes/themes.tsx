import { createFileRoute } from '@tanstack/react-router';

import { WebThemes } from '../views/WebThemes/WebThemes';

export const Route = createFileRoute('/themes')({
  component: RouteComponent,
});

function RouteComponent() {
  return <WebThemes />;
}
