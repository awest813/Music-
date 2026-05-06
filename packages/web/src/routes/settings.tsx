import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { WebSettings } from '../views/WebSettings';

export const Route = createFileRoute('/settings')({
  component: WebSettings,
  validateSearch: z.object({
    tab: z.string().optional(),
  }),
});
