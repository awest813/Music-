import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useSearch } from '@tanstack/react-router';
import { FC } from 'react';
import { z } from 'zod';

import { useTranslation } from '@nuclearplayer/i18n';
import type { SearchResults } from '@nuclearplayer/model';
import type { MetadataProvider } from '@nuclearplayer/plugin-sdk';
import { ViewShell } from '@nuclearplayer/ui';

import { useActiveProvider } from '../hooks/useActiveProvider';
import { metadataHost } from '../services/metadataHost';
import { WebSearchContent } from '../views/WebSearch';

const SearchView: FC = () => {
  const { t } = useTranslation(['search', 'common']);
  const { q } = useSearch({ from: '/search' });

  const provider = useActiveProvider('metadata') as
    | MetadataProvider
    | undefined;

  const {
    data: results,
    isLoading,
    isError,
    refetch,
  } = useQuery<SearchResults>({
    queryKey: ['metadata-search', provider?.id, q],
    queryFn: () => metadataHost.search({ query: q }),
    enabled: Boolean(provider && q),
  });

  return (
    <ViewShell
      data-testid="search-view"
      title={t('search:title')}
      subtitle={`${t('search:query')}: "${q}"`}
    >
      <WebSearchContent
        provider={provider}
        isLoading={isLoading}
        isError={isError}
        results={results}
        refetch={() => void refetch()}
      />
    </ViewShell>
  );
};

export const Route = createFileRoute('/search')({
  component: SearchView,
  validateSearch: z.object({
    q: z.string().min(1).max(100).default(''),
  }),
});
