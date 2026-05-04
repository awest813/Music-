import type {
  YtdlpHost,
  YtdlpPlaylistInfo,
  YtdlpSearchResult,
  YtdlpStreamInfo,
} from '@nuclearplayer/plugin-sdk';

import { platform } from './platform';

export const ytdlpHost: YtdlpHost = {
  search: async (
    query: string,
    maxResults?: number,
  ): Promise<YtdlpSearchResult[]> => {
    return platform.invoke<YtdlpSearchResult[]>('ytdlp_search', {
      query,
      maxResults: maxResults ?? 10,
    });
  },

  getStream: async (videoId: string): Promise<YtdlpStreamInfo> => {
    return platform.invoke<YtdlpStreamInfo>('ytdlp_get_stream', { videoId });
  },

  getPlaylist: async (url: string): Promise<YtdlpPlaylistInfo> => {
    return platform.invoke<YtdlpPlaylistInfo>('ytdlp_get_playlist', { url });
  },
};
