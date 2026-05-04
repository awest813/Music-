import { SearchIcon } from 'lucide-react';
import { FC } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { pickArtwork } from '@nuclearplayer/model';
import type { SearchResults } from '@nuclearplayer/model';
import type { MetadataProvider } from '@nuclearplayer/plugin-sdk';
import {
  Button,
  Card,
  CardGrid,
  EmptyState,
  Loader,
  Tabs,
  TabsItem,
} from '@nuclearplayer/ui';

import { useQueueActions } from '../hooks/useQueueActions';

type WebSearchContentProps = {
  provider: MetadataProvider | undefined;
  isLoading: boolean;
  isError: boolean;
  results: SearchResults | undefined;
  refetch: () => void;
};

const NoProviderState: FC = () => {
  const { t } = useTranslation('search');

  return (
    <EmptyState
      data-testid="search-no-provider"
      icon={<SearchIcon size={48} />}
      title={t('noProvider')}
      description={t('noProviderDescription')}
      className="flex-1"
    />
  );
};

export const WebSearchContent: FC<WebSearchContentProps> = ({
  provider,
  isLoading,
  isError,
  results,
  refetch,
}) => {
  const { t } = useTranslation(['search', 'common']);
  const { addToQueue } = useQueueActions();

  if (!provider) {
    return <NoProviderState />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <div className="text-accent-red">{t('search:failedToLoad')}</div>
        <Button onClick={() => void refetch()}>
          {t('common:actions.retry')}
        </Button>
      </div>
    );
  }

  const tabsItems = [
    results?.tracks && {
      id: 'tracks',
      label: t('search:results.tracks'),
      content: (
        <CardGrid>
          {results.tracks.map((track) => (
            <Card
              key={track.source.id}
              title={track.title}
              subtitle={track.artists[0]?.name}
              src={pickArtwork(track.artwork, 'thumbnail', 300)?.url}
              onClick={() => addToQueue([track])}
            />
          ))}
        </CardGrid>
      ),
    },
    results?.albums && {
      id: 'albums',
      label: t('search:results.albums'),
      content: (
        <CardGrid>
          {results.albums.map((item) => (
            <Card
              key={item.source.id}
              title={item.title}
              src={pickArtwork(item.artwork, 'cover', 300)?.url}
            />
          ))}
        </CardGrid>
      ),
    },
    results?.artists && {
      id: 'artists',
      label: t('search:results.artists'),
      content: (
        <CardGrid>
          {results.artists.map((item) => (
            <Card
              key={item.source.id}
              title={item.name}
              src={pickArtwork(item.artwork, 'cover', 300)?.url}
            />
          ))}
        </CardGrid>
      ),
    },
  ].filter(Boolean);

  return <Tabs items={tabsItems as TabsItem[]} className="flex-1" />;
};
