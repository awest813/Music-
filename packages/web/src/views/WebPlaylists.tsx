import { useNavigate } from '@tanstack/react-router';
import isEmpty from 'lodash-es/isEmpty';
import {
  CassetteTape,
  DownloadIcon,
  LinkIcon,
  ListMusic,
  Plus,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';
import type { PlaylistIndexEntry } from '@nuclearplayer/model';
import {
  Button,
  Card,
  CardGrid,
  cn,
  Dialog,
  EmptyState,
  ImageReveal,
  Input,
  Mosaic,
  MOSAIC_SIZE,
  ScrollableArea,
  ViewShell,
} from '@nuclearplayer/ui';

import { usePlaylistStore } from '../stores/playlistStore';

type PlaylistArtworkProps = {
  name: string;
  thumbnails?: string[];
  className?: string;
};

const PlaylistArtwork: FC<PlaylistArtworkProps> = ({
  name,
  thumbnails = [],
  className,
}) => {
  if (thumbnails.length >= MOSAIC_SIZE) {
    return (
      <Mosaic urls={thumbnails} className={cn('h-full w-full', className)} />
    );
  }

  if (thumbnails.length > 0) {
    return (
      <ImageReveal
        src={thumbnails[0]}
        alt={name}
        className={cn('h-full w-full', className)}
        imgClassName="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        className,
      )}
    >
      <CassetteTape size={96} absoluteStrokeWidth className="opacity-20" />
    </div>
  );
};

type PlaylistsContextValue = {
  isCreateDialogOpen: boolean;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  createPlaylist: (name: string) => Promise<void>;
};

const PlaylistsContext = createContext<PlaylistsContextValue | null>(null);

const usePlaylistsContext = () => {
  const ctx = useContext(PlaylistsContext);
  if (!ctx) {
    throw new Error(
      'usePlaylistsContext must be used within <PlaylistsProvider>',
    );
  }
  return ctx;
};

const PlaylistsProvider: FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const storeCreate = usePlaylistStore((state) => state.createPlaylist);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const openCreateDialog = useCallback(() => setIsCreateDialogOpen(true), []);
  const closeCreateDialog = useCallback(() => setIsCreateDialogOpen(false), []);

  const createPlaylist = useCallback(
    async (name: string) => {
      const id = await storeCreate(name);
      setIsCreateDialogOpen(false);
      navigate({ to: '/playlists/$playlistId', params: { playlistId: id } });
    },
    [storeCreate, navigate],
  );

  const value = useMemo(
    () => ({
      isCreateDialogOpen,
      openCreateDialog,
      closeCreateDialog,
      createPlaylist,
    }),
    [isCreateDialogOpen, openCreateDialog, closeCreateDialog, createPlaylist],
  );

  return (
    <PlaylistsContext.Provider value={value}>
      {children}
    </PlaylistsContext.Provider>
  );
};

const CreatePlaylistDialog: FC = () => {
  const { t } = useTranslation('playlists');
  const { isCreateDialogOpen, closeCreateDialog, createPlaylist } =
    usePlaylistsContext();
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || isCreating) {
      return;
    }
    setIsCreating(true);
    try {
      await createPlaylist(trimmed);
      setName('');
    } catch {
      // Error handled by context
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (isCreating) {
      return;
    }
    closeCreateDialog();
    setName('');
  };

  return (
    <Dialog.Root isOpen={isCreateDialogOpen} onClose={handleClose}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate();
        }}
      >
        <Dialog.Title>{t('createNew')}</Dialog.Title>
        <div className="mt-4">
          <Input
            label={t('name')}
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="playlist-name-input"
            autoFocus
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('common:actions.cancel')}</Dialog.Close>
          <Button type="submit" disabled={isCreating}>
            {t('create')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
};

const PlaylistCardGrid: FC<{
  index: PlaylistIndexEntry[];
  onCardClick: (id: string) => void;
}> = ({ index, onCardClick }) => {
  const { t } = useTranslation('playlists');

  return (
    <CardGrid>
      {index.map((entry) => (
        <Card
          key={entry.id}
          image={
            <PlaylistArtwork name={entry.name} thumbnails={entry.thumbnails} />
          }
          title={entry.name}
          subtitle={t('trackCount', { count: entry.itemCount })}
          onClick={() => onCardClick(entry.id)}
        />
      ))}
    </CardGrid>
  );
};

const PlaylistsContent: FC = () => {
  const { t } = useTranslation('playlists');
  const navigate = useNavigate();
  const index = usePlaylistStore((state) => state.index);
  const { openCreateDialog } = usePlaylistsContext();
  const importPlaylist = usePlaylistStore((state) => state.importPlaylist);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleJsonFileImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }
      setIsImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        let playlist;
        if (data.version && data.playlist) {
          playlist = data.playlist;
        } else {
          playlist = data;
        }
        if (!playlist.name || !playlist.items) {
          toast.error(t('importInvalidFormat'));
          return;
        }
        const newId = await importPlaylist(playlist);
        toast.success(t('importSuccess'));
        navigate({
          to: '/playlists/$playlistId',
          params: { playlistId: newId },
        });
      } catch (error) {
        toast.error(
          t('importError', {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  }, [importPlaylist, navigate, t]);

  const handleUrlImport = useCallback(async () => {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      return;
    }
    setIsUrlDialogOpen(false);
    setUrlValue('');
    navigate({
      to: '/playlists/import/$providerId',
      params: { providerId: 'local' },
      search: { url: encodeURIComponent(trimmed) },
    });
  }, [urlValue, navigate]);

  return (
    <ViewShell data-testid="playlists-view" title={t('title')}>
      <div className="mb-4 flex items-center gap-2">
        <Button onClick={openCreateDialog} data-testid="create-playlist-button">
          <Plus size={16} />
          {t('create')}
        </Button>
        <Button
          variant="secondary"
          onClick={handleJsonFileImport}
          disabled={isImporting}
          data-testid="import-playlist-button"
        >
          <DownloadIcon size={16} />
          {t('import')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setIsUrlDialogOpen(true)}
          data-testid="import-url-button"
        >
          <LinkIcon size={16} />
          {t('importFromUrl')}
        </Button>
      </div>

      {isEmpty(index) ? (
        <EmptyState
          icon={<ListMusic size={48} />}
          title={t('empty')}
          description={t('emptyDescription')}
          className="flex-1"
        />
      ) : (
        <ScrollableArea className="flex-1 overflow-hidden">
          <PlaylistCardGrid
            index={index}
            onCardClick={(id) =>
              navigate({
                to: '/playlists/$playlistId',
                params: { playlistId: id },
              })
            }
          />
        </ScrollableArea>
      )}

      <CreatePlaylistDialog />

      <Dialog.Root
        isOpen={isUrlDialogOpen}
        onClose={() => setIsUrlDialogOpen(false)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleUrlImport();
          }}
        >
          <Dialog.Title>{t('importFromUrl')}</Dialog.Title>
          <div className="mt-4">
            <Input
              label={t('playlistUrl')}
              placeholder="https://..."
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              autoFocus
            />
          </div>
          <Dialog.Actions>
            <Dialog.Close>{t('cancel')}</Dialog.Close>
            <Button type="submit" disabled={!urlValue.trim()}>
              {t('import')}
            </Button>
          </Dialog.Actions>
        </form>
      </Dialog.Root>
    </ViewShell>
  );
};

export const WebPlaylists: FC = () => (
  <PlaylistsProvider>
    <PlaylistsContent />
  </PlaylistsProvider>
);
