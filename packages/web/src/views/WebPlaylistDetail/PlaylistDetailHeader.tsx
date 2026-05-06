import { PencilIcon } from 'lucide-react';
import { useState, type FC, type ReactNode } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { Playlist } from '@nuclearplayer/model';
import { Badge, Button, cn, Input, Textarea, Tooltip } from '@nuclearplayer/ui';

type PlaylistDetailHeaderProps = {
  playlist: Playlist;
  thumbnails?: string[];
  className?: string;
  children?: ReactNode;
  isEditable?: boolean;
  onSaveEdits?: (updates: { name: string; description: string }) => void;
};

export const PlaylistDetailHeader: FC<PlaylistDetailHeaderProps> = ({
  playlist,
  thumbnails,
  className,
  children,
  isEditable = false,
  onSaveEdits,
}) => {
  const { t } = useTranslation('playlists');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playlist.name);
  const [editDescription, setEditDescription] = useState(
    playlist.description ?? '',
  );

  const startEditing = () => {
    setEditName(playlist.name);
    setEditDescription(playlist.description ?? '');
    setIsEditing(true);
  };

  const cancel = () => {
    setIsEditing(false);
  };

  const save = () => {
    onSaveEdits?.({ name: editName, description: editDescription });
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'border-border bg-primary shadow-shadow relative flex flex-col gap-6 rounded-md border-(length:--border-width) p-6 md:flex-row',
        className,
      )}
    >
      {isEditable && !isEditing && (
        <Button
          variant="secondary"
          size="icon-sm"
          className="absolute top-4 right-4 z-10"
          onClick={startEditing}
          data-testid="edit-playlist-button"
        >
          <PencilIcon size={14} />
        </Button>
      )}
      {playlist.isReadOnly && playlist.origin && (
        <div className="absolute top-4 right-4 z-10">
          <Tooltip
            content={t('readOnlyTooltip', { source: playlist.origin.provider })}
            side="bottom"
          >
            <Badge variant="pill" color="cyan" data-testid="read-only-badge">
              {t('readOnlyBadge', { source: playlist.origin.provider })}
            </Badge>
          </Tooltip>
        </div>
      )}
      <div className="border-border shadow-shadow h-60 w-60 shrink-0 overflow-hidden rounded-md border-(length:--border-width) select-none">
        <PlaylistArtwork name={playlist.name} thumbnails={thumbnails} />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <Input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              data-testid="playlist-detail-title-input"
              className="font-heading text-3xl font-extrabold"
            />
            <Textarea
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              placeholder={t('descriptionPlaceholder')}
              data-testid="playlist-detail-description-input"
              className="min-h-[4rem] text-lg"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={save}
                data-testid="save-edit-button"
              >
                {t('common:actions.save')}
              </Button>
              <Button
                variant="secondary"
                onClick={cancel}
                data-testid="cancel-edit-button"
              >
                {t('common:actions.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <h1
              className="font-heading text-5xl font-extrabold tracking-tight"
              data-testid="playlist-detail-title"
            >
              {playlist.name}
            </h1>
            {playlist.description && (
              <p
                className="text-text-secondary text-lg"
                data-testid="playlist-detail-description"
              >
                {playlist.description}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

function PlaylistArtwork({
  name,
  thumbnails,
}: {
  name: string;
  thumbnails?: string[];
}) {
  if (thumbnails && thumbnails.length > 0) {
    return (
      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
        {thumbnails.slice(0, 4).map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt=""
            className="h-full w-full object-cover"
          />
        ))}
        {thumbnails.length < 4 &&
          Array.from({ length: 4 - thumbnails.length }).map((_, idx) => (
            <div
              key={`placeholder-${idx}`}
              className="bg-primary-muted h-full w-full"
            />
          ))}
      </div>
    );
  }

  return (
    <div className="bg-primary-muted flex h-full w-full items-center justify-center">
      <span className="text-primary-foreground text-6xl font-bold">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
