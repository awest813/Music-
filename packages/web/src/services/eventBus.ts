import type {
  EventsHost,
  PluginEventListener,
  PluginEventMap,
} from '@nuclearplayer/plugin-sdk';

import { Logger } from './logger';

type Listener = (
  payload: PluginEventMap[keyof PluginEventMap],
) => Promise<void>;

export const createEventBus = (): EventsHost => {
  const listeners = new Map<keyof PluginEventMap, Set<Listener>>();

  const getOrCreateSet = (event: keyof PluginEventMap): Set<Listener> => {
    let set = listeners.get(event);
    if (!set) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  };

  return {
    on<E extends keyof PluginEventMap>(
      event: E,
      listener: PluginEventListener<E>,
    ) {
      const set = getOrCreateSet(event);
      set.add(listener);

      return () => {
        set.delete(listener);
      };
    },

    emit<E extends keyof PluginEventMap>(event: E, payload: PluginEventMap[E]) {
      const eventListeners = listeners.get(event);
      if (!eventListeners) {
        return;
      }
      const snapshot = Array.from(eventListeners);
      for (const listener of snapshot) {
        try {
          void listener(payload).catch((error) => {
            Logger.plugins.error(
              `Event listener for "${event}" failed: ${error instanceof Error ? error.message : String(error)}`,
            );
          });
        } catch (error) {
          Logger.plugins.error(
            `Event listener for "${event}" threw synchronously: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    },
  };
};

export const eventBus = createEventBus();
