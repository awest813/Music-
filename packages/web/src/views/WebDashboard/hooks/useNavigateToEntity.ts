import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import type { AttributedResult } from '@nuclearplayer/plugin-sdk';

type EntityType = 'artist' | 'album';

type EntityInfo = {
  name: string;
  sourceId: string;
};

export const useNavigateToEntity = () => {
  const navigate = useNavigate();

  return useCallback(
    <T>(
      entity: EntityInfo,
      result: AttributedResult<T>,
      entityType: EntityType,
    ) => {
      if (result.metadataProviderId) {
        navigate({
          to: `/${entityType}/${result.metadataProviderId}/${entity.sourceId}`,
        });
      } else {
        navigate({
          to: '/search',
          search: { q: entity.name },
        });
      }
    },
    [navigate],
  );
};
