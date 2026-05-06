import type { Stream, StreamCandidate } from '@nuclearplayer/model';
import { DEFAULT_NUCLEAR_SERVER_URL } from '@nuclearplayer/platform';
import type { StreamingProvider } from '@nuclearplayer/plugin-sdk';

import { Logger } from './logger';

const SERVER_URL =
  import.meta.env.VITE_NUCLEAR_SERVER_URL ?? DEFAULT_NUCLEAR_SERVER_URL;

type YtdlpSearchItem = {
  id: string;
  title: string;
  duration: number;
  webpage_url: string;
  thumbnail?: string;
  uploader?: string;
};

const PROVIDER_ID = 'nuclear-ytdlp';

const serverFetch = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const url = `${SERVER_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Server returned ${response.status}: ${response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
};

let serverAvailable = false;
let serverCheckDone = false;

const checkServer = async (): Promise<boolean> => {
  if (serverCheckDone) {
    return serverAvailable;
  }
  try {
    await serverFetch<{ ok: boolean }>('/health');
    serverAvailable = true;
  } catch {
    serverAvailable = false;
  }
  serverCheckDone = true;
  return serverAvailable;
};

export const createServerStreamingProvider = (): StreamingProvider => ({
  id: PROVIDER_ID,
  name: 'YouTube (via Nuclear Server)',
  kind: 'streaming',

  searchForTrack: async (artist: string, title: string) => {
    const available = await checkServer();
    if (!available) {
      return [];
    }

    const query = `${artist} ${title}`;
    Logger.streaming.debug(`Searching yt-dlp: "${query}"`);

    try {
      const results = await serverFetch<YtdlpSearchItem[]>('/ytdlp/search', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      return results.map(
        (item): StreamCandidate => ({
          id: item.id,
          title: item.title,
          durationMs: (item.duration ?? 0) * 1000,
          thumbnail: item.thumbnail,
          failed: false,
          source: { provider: PROVIDER_ID, id: item.id },
        }),
      );
    } catch (error) {
      Logger.streaming.error(
        `yt-dlp search failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  },

  getStreamUrl: async (candidateId: string): Promise<Stream> => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${candidateId}`;
    const streamUrl = `${SERVER_URL}/stream?url=${encodeURIComponent(youtubeUrl)}`;

    return {
      url: streamUrl,
      protocol: 'http',
      source: { provider: PROVIDER_ID, id: candidateId },
      mimeType: 'audio/mpeg',
    };
  },
});

export const isServerStreamingProviderAvailable = async (): Promise<boolean> =>
  checkServer();
