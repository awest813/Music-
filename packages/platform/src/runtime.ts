import type { Platform } from './types';

let currentPlatform: Platform | null = null;

export const setPlatform = (platform: Platform): void => {
  currentPlatform = platform;
};

export const getPlatform = (): Platform => {
  if (!currentPlatform) {
    throw new Error('Platform has not been configured');
  }
  return currentPlatform;
};
