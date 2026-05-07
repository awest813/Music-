import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQueueStore } from '../stores/queueStore';

vi.mock('./queueStore', async () => {
  const actual = await vi.importActual('../stores/queueStore');
  return actual;
});

vi.mock('../stores/settingsStore', () => ({
  getSetting: vi.fn(() => undefined),
}));

vi.mock('../platform', () => ({
  platform: {
    storage: {
      createStore: vi.fn(() => ({
        get: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined),
        save: vi.fn().mockResolvedValue(undefined),
      })),
    },
  },
}));

const mockSeekTo = vi.fn();
const mockStop = vi.fn();

vi.mock('../stores/soundStore', () => ({
  useSoundStore: {
    getState: vi.fn(() => ({
      stop: mockStop,
      seekTo: mockSeekTo,
    })),
  },
}));

const createTrack = (title: string, id: string) => ({
  title,
  artists: [{ name: 'Test Artist', roles: ['main'] }],
  source: { provider: 'test', id },
});

describe('queueStore', () => {
  beforeEach(() => {
    useQueueStore.setState({
      items: [],
      currentIndex: 0,
      version: 1,
      loaded: false,
    });
  });

  describe('addToQueue', () => {
    it('adds a single track to empty queue', () => {
      useQueueStore.getState().addToQueue([createTrack('Song 1', 't1')]);
      const { items } = useQueueStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].track.title).toBe('Song 1');
    });

    it('adds multiple tracks', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      expect(useQueueStore.getState().items).toHaveLength(2);
    });

    it('appends to existing queue', () => {
      useQueueStore.getState().addToQueue([createTrack('A', 'a')]);
      useQueueStore.getState().addToQueue([createTrack('B', 'b')]);
      const { items } = useQueueStore.getState();
      expect(items).toHaveLength(2);
      expect(items[1].track.title).toBe('B');
    });
  });

  describe('clearQueue', () => {
    it('removes all items', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.getState().clearQueue();
      expect(useQueueStore.getState().items).toHaveLength(0);
    });

    it('resets currentIndex to 0', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.setState({ currentIndex: 1 });
      useQueueStore.getState().clearQueue();
      expect(useQueueStore.getState().currentIndex).toBe(0);
    });
  });

  describe('removeByIds', () => {
    it('removes a track by id', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      const items = useQueueStore.getState().items;
      useQueueStore.getState().removeByIds([items[0].id]);
      expect(useQueueStore.getState().items).toHaveLength(1);
      expect(useQueueStore.getState().items[0].track.title).toBe('B');
    });
  });

  describe('removeByIndices', () => {
    it('removes tracks at given indices', () => {
      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.getState().removeByIndices([0, 2]);
      expect(useQueueStore.getState().items).toHaveLength(1);
      expect(useQueueStore.getState().items[0].track.title).toBe('B');
    });

    it('handles duplicate indices correctly', () => {
      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.setState({ currentIndex: 2 });
      useQueueStore.getState().removeByIndices([0, 0, 0]);
      expect(useQueueStore.getState().items).toHaveLength(2);
      expect(useQueueStore.getState().items[0].track.title).toBe('B');
    });

    it('ignores out-of-range indices', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.getState().removeByIndices([99, -1]);
      expect(useQueueStore.getState().items).toHaveLength(2);
    });
  });

  describe('reorder', () => {
    it('reorders items correctly', () => {
      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.getState().reorder(0, 2);
      const titles = useQueueStore.getState().items.map((i) => i.track.title);
      expect(titles).toEqual(['B', 'C', 'A']);
    });

    it('ignores out-of-range indices', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.getState().reorder(99, 0);
      expect(useQueueStore.getState().items).toHaveLength(2);
    });

    it('ignores negative indices', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.getState().reorder(-1, 0);
      expect(useQueueStore.getState().items).toHaveLength(2);
    });
  });

  describe('addNext', () => {
    it('inserts track after current index', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.setState({ currentIndex: 0 });
      useQueueStore.getState().addNext([createTrack('Next', 'n')]);
      const titles = useQueueStore.getState().items.map((i) => i.track.title);
      expect(titles).toEqual(['A', 'Next', 'B']);
    });
  });

  describe('goToNext / goToPrevious', () => {
    it('advances to next track', () => {
      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.getState().goToNext();
      expect(useQueueStore.getState().currentIndex).toBe(1);
    });

    it.skip('wraps to first after last track', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.setState({ currentIndex: 1 });
      useQueueStore.getState().goToNext();
      expect(useQueueStore.getState().currentIndex).toBe(0);
    });

    it('goes to previous track', () => {
      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.setState({ currentIndex: 2 });
      useQueueStore.getState().goToPrevious();
      expect(useQueueStore.getState().currentIndex).toBe(1);
    });
  });

  describe('goToIndex', () => {
    it('sets currentIndex to given index', () => {
      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.getState().goToIndex(1);
      expect(useQueueStore.getState().currentIndex).toBe(1);
    });

    it('ignores out-of-range index', () => {
      useQueueStore.getState().addToQueue([createTrack('A', 'a')]);
      useQueueStore.getState().goToIndex(99);
      expect(useQueueStore.getState().currentIndex).toBe(0);
    });
  });

  describe('getCurrentItem', () => {
    it('returns current item', () => {
      useQueueStore.getState().addToQueue([createTrack('A', 'a')]);
      const item = useQueueStore.getState().getCurrentItem();
      expect(item?.track.title).toBe('A');
    });

    it('returns undefined for empty queue', () => {
      const item = useQueueStore.getState().getCurrentItem();
      expect(item).toBeUndefined();
    });
  });

  describe('shuffle mode', () => {
    it('picks a different random index when shuffle is enabled', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation((key) => {
        if (key === 'core.playback.shuffle') {
          return true;
        }
        return undefined;
      });

      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.setState({ currentIndex: 0 });
      useQueueStore.getState().goToNext();

      const newIndex = useQueueStore.getState().currentIndex;
      expect(newIndex).not.toBe(0);
      expect(newIndex).toBeGreaterThanOrEqual(0);
      expect(newIndex).toBeLessThan(3);
    });

    it('stays at same index when only one track in queue with shuffle', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation((key) => {
        if (key === 'core.playback.shuffle') {
          return true;
        }
        return undefined;
      });

      useQueueStore.getState().addToQueue([createTrack('A', 'a')]);
      useQueueStore.getState().goToNext();
      expect(useQueueStore.getState().currentIndex).toBe(0);
    });
  });

  describe('repeat mode', () => {
    it('wraps to first track after last when repeat is all', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation((key) => {
        if (key === 'core.playback.repeat') {
          return 'all';
        }
        return undefined;
      });

      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.setState({ currentIndex: 1 });
      useQueueStore.getState().goToNext();
      expect(useQueueStore.getState().currentIndex).toBe(0);
    });

    it('wraps to last track when going previous from first with repeat all', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation((key) => {
        if (key === 'core.playback.repeat') {
          return 'all';
        }
        return undefined;
      });

      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.getState().goToPrevious();
      expect(useQueueStore.getState().currentIndex).toBe(2);
    });

    it('stays at last track when repeat is off', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation(
        () => undefined,
      );

      useQueueStore
        .getState()
        .addToQueue([createTrack('A', 'a'), createTrack('B', 'b')]);
      useQueueStore.setState({ currentIndex: 1 });
      useQueueStore.getState().goToNext();
      expect(useQueueStore.getState().currentIndex).toBe(1);
    });

    it('repeats same track when repeat is one on track end', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      mockSeekTo.mockClear();
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation((key) => {
        if (key === 'core.playback.repeat') {
          return 'one';
        }
        return undefined;
      });

      useQueueStore.getState().addToQueue([createTrack('A', 'a')]);
      useQueueStore.getState().advanceOnTrackEnd();

      expect(mockSeekTo).toHaveBeenCalledWith(0);
    });

    it('advances to next track when repeat is one but not on track end', async () => {
      const { getSetting } = await import('../stores/settingsStore');
      (getSetting as ReturnType<typeof vi.fn>).mockImplementation((key) => {
        if (key === 'core.playback.repeat') {
          return 'one';
        }
        return undefined;
      });

      useQueueStore
        .getState()
        .addToQueue([
          createTrack('A', 'a'),
          createTrack('B', 'b'),
          createTrack('C', 'c'),
        ]);
      useQueueStore.setState({ currentIndex: 0 });
      useQueueStore.getState().goToNext();
      expect(useQueueStore.getState().currentIndex).toBe(1);
    });
  });
});
