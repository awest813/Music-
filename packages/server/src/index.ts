import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const DEFAULT_PORT = 3473;
const MIN_PORT = 1;
const MAX_PORT = 65_535;

const parsePort = (value: string | undefined): number => {
  const parsed = Number(value ?? DEFAULT_PORT);
  if (!Number.isInteger(parsed) || parsed < MIN_PORT || parsed > MAX_PORT) {
    return DEFAULT_PORT;
  }
  return parsed;
};

const PORT = parsePort(process.env.PORT);
const YTDLP_BINARY = process.env.YTDLP_BINARY ?? 'yt-dlp';
const FILE_ROOT = resolve(
  process.env.NUCLEAR_WEB_FILE_ROOT ?? '.nuclear-web-data',
);
const parseHttpsUrl = (value: string | undefined): URL | null => {
  if (!value) {
    return null;
  }
  const parsed = new URL(value);
  if (parsed.protocol !== 'https:') {
    throw new Error('Configured proxy URLs must use HTTPS');
  }
  return parsed;
};

const PLUGIN_MARKETPLACE_PROXY_URL = parseHttpsUrl(
  process.env.NUCLEAR_PLUGIN_MARKETPLACE_PROXY_URL,
);

const json = (
  response: ServerResponse,
  status: number,
  body: unknown,
): void => {
  response.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,range',
  });
  response.end(JSON.stringify(body));
};

const readBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
};

const runYtdlp = (args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    const child = spawn(YTDLP_BINARY, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString('utf8'));
        return;
      }
      reject(new Error(Buffer.concat(stderr).toString('utf8')));
    });
    child.on('error', reject);
  });

const stream = async (
  request: IncomingMessage,
  response: ServerResponse,
  mediaUrl: string,
): Promise<void> => {
  const child = spawn(
    YTDLP_BINARY,
    ['-f', 'bestaudio/best', '-o', '-', mediaUrl],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  response.writeHead(200, {
    'content-type': 'audio/mpeg',
    'access-control-allow-origin': '*',
    'accept-ranges': 'bytes',
  });
  request.on('close', () => child.kill());
  await pipeline(child.stdout, response);
};

const safeFilePath = (path: string): string => {
  const resolved = resolve(FILE_ROOT, path);
  const relativePath = relative(FILE_ROOT, resolved);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(
      'Path traversal detected: file path must stay within the configured data directory',
    );
  }
  return resolved;
};

const requireMediaUrl = (value: string): string => {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Media URL must use HTTP or HTTPS');
  }
  return parsed.toString();
};

const handleInvoke = async (
  command: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  const body = (await readBody(request)) as Record<string, unknown>;
  switch (command) {
    case 'ytdlp_ensure_installed':
      await runYtdlp(['--version']);
      json(response, 200, true);
      return;
    case 'ytdlp_info': {
      const url = requireMediaUrl(String(body.url ?? ''));
      const result = await runYtdlp(['--dump-json', url]);
      json(response, 200, JSON.parse(result));
      return;
    }
    case 'read_text_file': {
      const path = safeFilePath(String(body.path ?? ''));
      json(response, 200, await readFile(path, 'utf8'));
      return;
    }
    case 'write_text_file': {
      const path = safeFilePath(String(body.path ?? ''));
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, String(body.contents ?? ''), 'utf8');
      json(response, 200, true);
      return;
    }
    default:
      json(response, 404, { error: `Unknown command: ${command}` });
  }
};

const handleRequest = async (
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> => {
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type,range');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const requestUrl = new URL(
    request.url ?? '/',
    `http://${request.headers.host}`,
  );

  if (request.method === 'GET' && requestUrl.pathname === '/health') {
    json(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/stream') {
    const mediaUrl = requestUrl.searchParams.get('url');
    if (!mediaUrl) {
      json(response, 400, { error: 'Missing url parameter' });
      return;
    }
    await stream(request, response, requireMediaUrl(mediaUrl));
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/ytdlp/search') {
    const body = (await readBody(request)) as Record<string, unknown>;
    const query = String(body.query ?? '');
    const result = await runYtdlp(['--dump-json', `ytsearch10:${query}`]);
    json(
      response,
      200,
      result
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line)),
    );
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/ytdlp/info') {
    const mediaUrl = requestUrl.searchParams.get('url');
    if (!mediaUrl) {
      json(response, 400, { error: 'Missing url parameter' });
      return;
    }
    const result = await runYtdlp(['--dump-json', requireMediaUrl(mediaUrl)]);
    json(response, 200, JSON.parse(result));
    return;
  }

  if (
    request.method === 'GET' &&
    requestUrl.pathname === '/proxy/plugin-marketplace'
  ) {
    if (!PLUGIN_MARKETPLACE_PROXY_URL) {
      json(response, 503, {
        error: 'Plugin marketplace proxy is not configured',
      });
      return;
    }
    const proxyResponse = await fetch(PLUGIN_MARKETPLACE_PROXY_URL);
    response.writeHead(proxyResponse.status, {
      'content-type':
        proxyResponse.headers.get('content-type') ?? 'application/octet-stream',
      'access-control-allow-origin': '*',
    });
    response.end(await proxyResponse.text());
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname.startsWith('/invoke/')) {
    await handleInvoke(
      requestUrl.pathname.replace('/invoke/', ''),
      request,
      response,
    );
    return;
  }

  json(response, 404, { error: 'Not found' });
};

createServer((request, response) => {
  handleRequest(request, response).catch((error: unknown) => {
    json(response, 500, {
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  });
}).listen(PORT, () => {
  console.info(`Nuclear web server listening on http://localhost:${PORT}`);
});
