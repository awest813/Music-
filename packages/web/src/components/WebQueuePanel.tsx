import { ListPlusIcon, Trash2Icon } from 'lucide-react';
import { FC, useCallback } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Button, QueuePanel } from '@nuclearplayer/ui';

import { useQueue } from '../hooks/useQueue';
import { useQueueActions } from '../hooks/useQueueActions';
import { usePlaylistStore } from '../stores/playlistStore';
import { useQueueStore } from '../stores/queueStore';

type WebQueuePanelProps = {
  isCollapsed?: boolean;
};

export const WebQueuePanel: FC<WebQueuePanelProps> = ({
  isCollapsed = false,
}) => {
  const { t } = useTranslation('queue');
  const queue = useQueue();
  const currentItem = useQueueStore((state) => state.getCurrentItem());
  const actions = useQueueActions();

  return (
    <QueuePanel
      items={queue.items}
      currentItemId={currentItem?.id}
      isCollapsed={isCollapsed}
      reorderable={!isCollapsed}
      onReorder={actions.reorder}
      onSelectItem={actions.goToId}
      onRemoveItem={(itemId: string) => actions.removeByIds([itemId])}
      labels={{
        emptyTitle: t('empty.title'),
        emptySubtitle: t('empty.subtitle'),
        removeButton: t('actions.remove'),
        playbackError: t('errors.playback'),
      }}
    />
  );
};

export const QueueHeaderActions: FC = () => {
  const { t } = useTranslation('queue');
  const queue = useQueue();
  const { clearQueue } = useQueueActions();
  const saveQueueAsPlaylist = usePlaylistStore(
    (state) => state.saveQueueAsPlaylist,
  );

  const handleSaveAsPlaylist = useCallback(async () => {
    const name = t('actions.saveQueueAsPlaylistDefaultName');
    await saveQueueAsPlaylist(name);
  }, [saveQueueAsPlaylist, t]);

  if (queue.items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        data-testid="save-queue-as-playlist-button"
        onClick={handleSaveAsPlaylist}
        title={t('actions.saveQueueAsPlaylist')}
      >
        <ListPlusIcon />
      </Button>
      <Button
        size="icon"
        data-testid="clear-queue-button"
        onClick={clearQueue}
        title={t('actions.clearQueue')}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
};
