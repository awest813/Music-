import { useState } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { Badge, cn, ViewShell } from '@nuclearplayer/ui';

import changelog from '../../../../player/changelog.json' with { type: 'json' };

type ChangelogEntry = {
  date: string;
  description: string;
  type: string;
  contributors: string[];
  tags?: { label: string; color: string }[];
};

const entries = changelog as ChangelogEntry[];

const INITIAL_COUNT = 5;

const typeColors: Record<string, string> = {
  feature: 'bg-accent-green text-foreground',
  fix: 'bg-accent-blue text-foreground',
  improvement: 'bg-accent-purple text-foreground',
};

export const WebWhatsNew = () => {
  const { t } = useTranslation('changelog');
  const [showAll, setShowAll] = useState(false);

  const visibleEntries = showAll ? entries : entries.slice(0, INITIAL_COUNT);
  const hiddenCount = entries.length - INITIAL_COUNT;

  return (
    <ViewShell data-testid="whats-new-view" title={t('title')}>
      <div className="flex w-full flex-col pr-4 pl-2">
        {visibleEntries.map((entry, index) => (
          <TimelineEntry
            key={index}
            entry={entry}
            isFirst={index === 0}
            isLast={index === visibleEntries.length - 1}
          />
        ))}
        {!showAll && hiddenCount > 0 && (
          <button
            className="hover:text-foreground cursor-pointer py-4 text-sm transition-colors"
            onClick={() => setShowAll(true)}
          >
            {t('seeMore', { count: hiddenCount })}
          </button>
        )}
      </div>
    </ViewShell>
  );
};

function TimelineEntry({
  entry,
  isFirst,
  isLast,
}: {
  entry: ChangelogEntry;
  isFirst: boolean;
  isLast: boolean;
}) {
  const date = new Date(entry.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={cn('flex gap-4', {
        'pt-4': !isFirst,
        'pb-4': !isLast,
      })}
    >
      <div className="flex flex-col items-center">
        <div className="bg-accent-purple size-3 shrink-0 rounded-full" />
        {!isLast && <div className="border-border h-full w-px border-l" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 pb-4">
        <div className="flex items-center gap-2">
          <time className="text-text-secondary text-sm">{formattedDate}</time>
          <Badge
            variant="pill"
            className={cn(
              'text-xs',
              typeColors[entry.type] ?? 'bg-background-secondary',
            )}
          >
            {entry.type}
          </Badge>
          {entry.tags?.map((tag) => (
            <Badge
              key={tag.label}
              variant="pill"
              className="text-xs"
              color={tag.color as 'blue' | 'green' | 'orange' | 'cyan'}
            >
              {tag.label}
            </Badge>
          ))}
        </div>
        <p className="text-foreground">{entry.description}</p>
      </div>
    </div>
  );
}
