import { describe, expect, it } from 'vitest';

import { useSoundStore } from '../stores/soundStore';

describe('soundStore', () => {
  it('has initial stopped state', () => {
    const state = useSoundStore.getState();
    expect(state.status).toBe('stopped');
    expect(state.src).toBeNull();
    expect(state.seek).toBe(0);
    expect(state.duration).toBe(0);
  });

  it('plays when toggle is called from stopped', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().toggle();
    expect(useSoundStore.getState().status).toBe('playing');
  });

  it('pauses when toggle is called from playing', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().play();
    useSoundStore.getState().toggle();
    expect(useSoundStore.getState().status).toBe('paused');
  });

  it('resumes when toggle is called from paused', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().play();
    useSoundStore.getState().pause();
    useSoundStore.getState().toggle();
    expect(useSoundStore.getState().status).toBe('playing');
  });

  it('stops and resets seek', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().play();
    useSoundStore.getState().seekTo(30);
    useSoundStore.getState().stop();
    expect(useSoundStore.getState().status).toBe('stopped');
    expect(useSoundStore.getState().seek).toBe(0);
  });

  it('seekTo updates seek position', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().seekTo(45);
    expect(useSoundStore.getState().seek).toBe(45);
  });

  it('updatePlayback sets position and duration', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().updatePlayback(10, 120);
    expect(useSoundStore.getState().seek).toBe(10);
    expect(useSoundStore.getState().duration).toBe(120);
  });

  it('setSrc resets seek and duration', () => {
    useSoundStore.getState().stop();
    useSoundStore.getState().updatePlayback(50, 300);
    useSoundStore.getState().setSrc({ url: 'test.mp3', protocol: 'http' });
    expect(useSoundStore.getState().seek).toBe(0);
    expect(useSoundStore.getState().duration).toBe(0);
    expect(useSoundStore.getState().src).toEqual({
      url: 'test.mp3',
      protocol: 'http',
    });
  });
});
