import { platform } from '../platform';

export const isFlatpak = async (): Promise<boolean> => {
  return platform.invoke<boolean>('is_flatpak');
};

export const copyDirRecursive = async (
  from: string,
  to: string,
): Promise<void> => {
  await platform.invoke('copy_dir_recursive', { from, to });
};

export const extractZip = async (
  zipPath: string,
  destPath: string,
): Promise<void> => {
  await platform.invoke('extract_zip', { zipPath, destPath });
};

export const downloadFile = async (
  url: string,
  destPath: string,
): Promise<void> => {
  await platform.invoke('download_file', { url, destPath });
};

export const ytdlpEnsureInstalled = async (): Promise<boolean> => {
  return platform.invoke<boolean>('ytdlp_ensure_installed');
};
