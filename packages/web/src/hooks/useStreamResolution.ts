import { useEffect, useRef } from 'react';

import { AudioSource } from '@nuclearplayer/hifi';
import type { TFunction } from '@nuclearplayer/i18n';
import { useTranslation } from '@nuclearplayer/i18n';
import type { QueueItem, StreamCandidate, Track } from '@nuclearplayer/model';
import { DEFAULT_NUCLEAR_SERVER_URL } from '@nuclearplayer/platform';

import { streamingHost } from '../services/streamingHost';
import { useQueueStore } from '../stores/queueStore';
import { useSoundStore } from '../stores/soundStore';

const SERVER_URL =
  import.meta.env.VITE_NUCLEAR_SERVER_URL ?? DEFAULT_NUCLEAR_SERVER_URL;

const buildStreamUrl = (rawUrl: string): string =>
  `${SERVER_URL}/stream?url=${encodeURIComponent(rawUrl)}`;

const buildAudioSource = (candidate: StreamCandidate): AudioSource => {
  const { stream } = candidate;
  if (!stream) {
    return { url: buildStreamUrl(candidate.id), protocol: 'http' };
  }

  if (stream.protocol === 'hls') {
    return { url: buildStreamUrl(stream.url), protocol: 'hls' };
  }

  if (stream.protocol === 'http') {
    return { url: stream.url, protocol: 'http' };
  }

  return { url: buildStreamUrl(stream.url), protocol: stream.protocol };
};

const setItemError = (itemId: string, errorKey: string, t: TFunction): void => {
  useQueueStore.getState().updateItemState(itemId, {
    status: 'error',
    error: t(errorKey),
  });
};

const updateItemCandidates = (
  item: QueueItem,
  candidates: StreamCandidate[],
): void => {
  useQueueStore.getState().updateItemState(item.id, {
    track: { ...item.track, streamCandidates: candidates },
  });
};

const resolveCandidates = async (
  track: Track,
): Promise<StreamCandidate[] | undefined> => {
  if (track.streamCandidates?.length) {
    return track.streamCandidates;
  }

  const result = await streamingHost.resolveCandidatesForTrack(track);
  return result.success ? result.candidates : undefined;
};

const tryResolveNextCandidate = async (
  candidates: StreamCandidate[],
): Promise<
  { resolved: StreamCandidate; updated: StreamCandidate[] } | undefined
> => {
  const candidate = candidates.find((candidate) => !candidate.failed);
  if (!candidate) {
    return undefined;
  }

  const resolved = await streamingHost.resolveStreamForCandidate(candidate);
  if (!resolved) {
    return undefined;
  }

  const updated = candidates.map((candidate) =>
    candidate.id === resolved.id ? resolved : candidate,
  );
  return { resolved, updated };
};

const resolveStreamWithFallback = async (
  candidates: StreamCandidate[],
  item: QueueItem,
  signal: AbortSignal,
): Promise<StreamCandidate | undefined> => {
  const tryNext = async (
    remaining: StreamCandidate[],
  ): Promise<StreamCandidate | undefined> => {
    if (signal.aborted) {
      return undefined;
    }

    const result = await tryResolveNextCandidate(remaining);
    if (!result) {
      return undefined;
    }

    updateItemCandidates(item, result.updated);

    if (result.resolved.stream && !result.resolved.failed) {
      return result.resolved;
    }

    return tryNext(result.updated);
  };

  return tryNext(candidates);
};

let activeController: AbortController | null = null;

const resolveStream = async (
  item: QueueItem,
  t: TFunction,
  autoPlay: boolean,
): Promise<void> => {
  activeController?.abort();
  activeController = new AbortController();
  const { signal } = activeController;

  const { updateItemState } = useQueueStore.getState();
  const { setSrc, play, stop } = useSoundStore.getState();

  if (autoPlay) {
    stop();
  }
  updateItemState(item.id, { status: 'loading', error: undefined });

  const candidates = await resolveCandidates(item.track);
  if (signal.aborted) {
    return;
  }
  if (!candidates) {
    setItemError(item.id, 'errors.noCandidatesFound', t);
    return;
  }

  updateItemCandidates(item, candidates);

  const resolvedCandidate = await resolveStreamWithFallback(
    candidates,
    item,
    signal,
  );
  if (signal.aborted) {
    return;
  }
  if (!resolvedCandidate?.stream) {
    setItemError(item.id, 'errors.allCandidatesFailed', t);
    return;
  }

  setSrc(buildAudioSource(resolvedCandidate));
  play();
};

export const useStreamResolution = (): void => {
  const { t } = useTranslation('streaming');
  const currentItemIdRef = useRef<string | null>(null);
  const hasResolvedOnceRef = useRef(false);

  useEffect(() => {
    const onCurrentItemChanged = (currentItem: QueueItem | undefined): void => {
      if (!currentItem || currentItem.id === currentItemIdRef.current) {
        return;
      }

      currentItemIdRef.current = currentItem.id;
      hasResolvedOnceRef.current = true;
      void resolveStream(currentItem, t, true);
    };

    const unsubscribe = useQueueStore.subscribe((state) => {
      onCurrentItemChanged(state.getCurrentItem());
    });

    onCurrentItemChanged(useQueueStore.getState().getCurrentItem());

    return unsubscribe;
  }, [t]);
};
