import { createContext, FC, PropsWithChildren, useContext } from 'react';

import { setPlatform } from './runtime';
import type { Platform } from './types';

const PlatformContext = createContext<Platform | null>(null);

type PlatformProviderProps = PropsWithChildren<{
  platform: Platform;
}>;

export const PlatformProvider: FC<PlatformProviderProps> = ({
  children,
  platform,
}) => {
  setPlatform(platform);
  return (
    <PlatformContext.Provider value={platform}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = (): Platform => {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return platform;
};
