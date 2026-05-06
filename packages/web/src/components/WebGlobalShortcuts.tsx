import { useEffect } from 'react';

import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';

const SKIP_SECONDS = 5;

export const WebGlobalShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.code) {
        case 'Space': {
          event.preventDefault();
          useSoundStore.getState().toggle();
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          const { seek, duration } = useSoundStore.getState();
          useSoundStore
            .getState()
            .seekTo(Math.min(seek + SKIP_SECONDS, duration));
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          const { seek } = useSoundStore.getState();
          useSoundStore.getState().seekTo(Math.max(0, seek - SKIP_SECONDS));
          break;
        }
        case 'KeyN': {
          useQueueStore.getState().goToNext();
          break;
        }
        case 'KeyP': {
          useQueueStore.getState().goToPrevious();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return null;
};
