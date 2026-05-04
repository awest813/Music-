import { Logger } from '../services/logger';
import { platform } from '../services/platform';
import { reportError, resolveErrorMessage } from './logging';

export const ensureDir = async (
  dir: string,
  baseDir: 'appData' = 'appData',
) => {
  try {
    const present = await platform.fs.exists(dir, { baseDir });
    if (!present) {
      try {
        await platform.fs.mkdir(dir, { baseDir });
      } catch (error) {
        await reportError('fs', {
          userMessage: `Failed to create directory ${dir}`,
          error,
        });
      }
    }
  } catch (error) {
    Logger.fs.error(
      `fs.exists failed for ${dir}: ${resolveErrorMessage(error)}`,
    );
  }
  return dir;
};
