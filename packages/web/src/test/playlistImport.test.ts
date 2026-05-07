import { describe, expect, it } from 'vitest';

import {
  detectPlaylistFormat,
  importPlaylistFromJson,
} from '../services/playlistImport';

describe('playlistImport', () => {
  describe('detectPlaylistFormat', () => {
    it('detects nuclear format', () => {
      const json = {
        version: 1,
        playlist: {
          id: 'test-id',
          name: 'Test',
          createdAtIso: '2024-01-01T00:00:00.000Z',
          lastModifiedIso: '2024-01-01T00:00:00.000Z',
          isReadOnly: false,
          items: [],
        },
      };
      expect(detectPlaylistFormat(json)).toBe('nuclear');
    });

    it('detects unknown format', () => {
      expect(detectPlaylistFormat({})).toBe('unknown');
      expect(detectPlaylistFormat(null)).toBe('unknown');
      expect(detectPlaylistFormat('string')).toBe('unknown');
    });
  });

  describe('importPlaylistFromJson', () => {
    it('imports nuclear format playlist', () => {
      const json = {
        version: 1,
        playlist: {
          id: 'existing-id',
          name: 'My Playlist',
          createdAtIso: '2024-01-01T00:00:00.000Z',
          lastModifiedIso: '2024-01-01T00:00:00.000Z',
          isReadOnly: false,
          items: [],
        },
      };
      const result = importPlaylistFromJson(json);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Playlist');
      expect(result[0].id).toBe('existing-id');
    });

    it('throws on unknown format', () => {
      expect(() => importPlaylistFromJson({})).toThrow(
        'Unrecognized playlist format',
      );
    });

    it('imports nuclear format with tracks', () => {
      const json = {
        version: 1,
        playlist: {
          id: 'pl1',
          name: 'With Tracks',
          createdAtIso: '2024-01-01T00:00:00.000Z',
          lastModifiedIso: '2024-01-01T00:00:00.000Z',
          isReadOnly: false,
          items: [
            {
              id: 'item1',
              addedAtIso: '2024-01-01T00:00:00.000Z',
              track: {
                title: 'Song 1',
                artists: [{ name: 'Artist 1', roles: ['main'] }],
                source: { provider: 'test', id: 't1' },
              },
            },
          ],
          artwork: {
            items: [{ url: 'https://example.com/art.jpg', purpose: 'cover' }],
          },
        },
      };
      const result = importPlaylistFromJson(json);
      expect(result).toHaveLength(1);
      expect(result[0].items).toHaveLength(1);
      expect(result[0].items[0].track.title).toBe('Song 1');
      expect(result[0].artwork?.items[0]?.url).toBe(
        'https://example.com/art.jpg',
      );
    });
  });
});
