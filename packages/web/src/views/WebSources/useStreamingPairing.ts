import { useMemo } from 'react';

import type {
  MetadataProvider,
  ProviderDescriptor,
} from '@nuclearplayer/plugin-sdk';

type StreamingPairing = {
  lockedStreamingId: string | undefined;
  metadataName: string | undefined;
  streamingName: string | undefined;
};

export const useStreamingPairing = (
  activeMetadata: MetadataProvider | undefined,
  streamingProviders: ProviderDescriptor<'streaming'>[],
): StreamingPairing => {
  return useMemo(() => {
    const desiredStreamingId = activeMetadata?.streamingProviderId;
    const lockedStreamingProvider = desiredStreamingId
      ? streamingProviders.find(
          (provider) => provider.id === desiredStreamingId,
        )
      : undefined;

    return {
      lockedStreamingId: lockedStreamingProvider
        ? desiredStreamingId
        : undefined,
      metadataName: activeMetadata?.name,
      streamingName: lockedStreamingProvider?.name,
    };
  }, [activeMetadata, streamingProviders]);
};
