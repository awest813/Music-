import { createFileRoute } from '@tanstack/react-router';

import { WebDashboard } from '../views/WebDashboard';

export const Route = createFileRoute('/dashboard')({
  component: WebDashboard,
});
