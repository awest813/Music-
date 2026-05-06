import { useQuery } from '@tanstack/react-query';

import {
  pluginMarketplaceApi,
  type MarketplacePlugin,
} from '../apis/pluginMarketplaceApi';

const FIVE_MINUTES = 5 * 60 * 1000;

export const useMarketplacePlugins = () => {
  return useQuery<MarketplacePlugin[]>({
    queryKey: ['marketplace-plugins'],
    queryFn: () => pluginMarketplaceApi.listPlugins(),
    staleTime: FIVE_MINUTES,
  });
};
