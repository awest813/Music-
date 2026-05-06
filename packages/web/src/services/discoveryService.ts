import type { Track } from '@nuclearplayer/model';

import { useQueueStore } from '../stores/queueStore';
import { useSettingsStore } from '../stores/settingsStore';
import { discoveryHost } from './discoveryHost';
import { eventBus } from './eventBus';
import { Logger } from './logger';
import { providersHost } from './providersHost';

const CONTEXT_SIZE = 10;
const RECOMMENDATION_LIMIT = 5;

export const initDiscoveryService = () => {
  return eventBus.on('trackStarted', async () => {
    const getValue = useSettingsStore.getState().getValue;
    const isEnabled = getValue('core.playback.discovery') as boolean;
    const activeDiscoveryId = providersHost.getActive('discovery');
    if (!isEnabled || !providersHost.get(activeDiscoveryId, 'discovery')) {
      return;
    }

    const { items, currentIndex } = useQueueStore.getState();
    const isLastTrack = currentIndex >= items.length - 1;
    if (!isLastTrack) {
      return;
    }

    const variety =
      (getValue('core.playback.discoveryVariety') as number) ?? 0.5;

    const contextTracks: Track[] = items
      .slice(-CONTEXT_SIZE)
      .map((item) => item.track);

    try {
      const recommendations = await discoveryHost.getRecommendations(
        contextTracks,
        { variety, limit: RECOMMENDATION_LIMIT },
      );

      if (recommendations.length > 0) {
        useQueueStore.getState().addToQueue(recommendations);
      }
    } catch (error) {
      Logger.discovery.error(
        `Recommendation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });
};
