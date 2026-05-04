import type {
  HttpHost,
  HttpRequestInit,
  HttpResponseData,
} from '@nuclearplayer/plugin-sdk';

import { Logger } from './logger';
import { platform } from './platform';

export const httpHost: HttpHost = {
  fetch: async (
    url: string,
    init?: HttpRequestInit,
  ): Promise<HttpResponseData> => {
    const method = init?.method ?? 'GET';
    Logger.http.debug(`${method} ${url}`);

    const response = await platform.invoke<HttpResponseData>('http_fetch', {
      request: {
        url,
        method,
        headers: init?.headers,
        body: init?.body,
      },
    });

    Logger.http.debug(`${method} ${url} -> ${response.status}`);

    return response;
  },
};
