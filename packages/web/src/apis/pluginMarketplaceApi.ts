import { z } from 'zod';

import { ApiClient } from './ApiClient';

const PluginCategorySchema = z.enum([
  'streaming',
  'metadata',
  'lyrics',
  'scrobbling',
  'dashboard',
  'playlists',
  'discovery',
  'other',
]);

const MarketplacePluginSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  author: z.string().min(1),
  repo: z.string().regex(/^[^/]+\/[^/]+$/),
  category: PluginCategorySchema.optional(),
  categories: z.array(PluginCategorySchema).optional(),
  tags: z.array(z.string()).optional(),
  version: z.string().min(1).optional(),
  downloadUrl: z.string().url().optional(),
  addedAt: z.string(),
});

export type MarketplacePlugin = z.infer<typeof MarketplacePluginSchema>;

const RegistrySchema = z.object({
  plugins: z.array(MarketplacePluginSchema),
});

export class PluginMarketplaceApi extends ApiClient {
  constructor() {
    super('https://marketplace-api.relisten.nl/api/v1');
  }

  async listPlugins(): Promise<MarketplacePlugin[]> {
    const data = await this.fetch('/plugins', RegistrySchema);
    return data.plugins;
  }
}

export const pluginMarketplaceApi = new PluginMarketplaceApi();
