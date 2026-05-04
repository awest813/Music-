import { useMemo } from 'react';

import type { Queue } from '@nuclearplayer/model';

import { useQueueStore } from '../stores/queueStore';

export const useQueue = (): Queue => {
  const { items, currentIndex } = useQueueStore();

  return useMemo(() => ({ items, currentIndex }), [items, currentIndex]);
};
