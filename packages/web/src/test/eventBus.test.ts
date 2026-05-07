import { describe, expect, it, vi } from 'vitest';

import { createEventBus } from '../services/eventBus';

describe('eventBus', () => {
  it('calls listener when event is emitted', async () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on('trackStarted', listener);
    const track = { title: 'Test', source: { provider: 'test', id: '1' } };
    bus.emit('trackStarted', track);
    await vi.waitFor(() => expect(listener).toHaveBeenCalled());
  });

  it('passes payload to listener', async () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on('trackStarted', listener);
    const track = { title: 'Test', source: { provider: 'test', id: '1' } };
    bus.emit('trackStarted', track);
    await vi.waitFor(() => expect(listener).toHaveBeenCalledWith(track));
  });

  it('calls multiple listeners for the same event', async () => {
    const bus = createEventBus();
    const listener1 = vi.fn();
    const listener2 = vi.fn();
    bus.on('trackFinished', listener1);
    bus.on('trackFinished', listener2);
    const track = { title: 'Test', source: { provider: 'test', id: '1' } };
    bus.emit('trackFinished', track);
    await vi.waitFor(() => {
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });

  it('does not call listener for different event', async () => {
    const bus = createEventBus();
    const listener = vi.fn();
    bus.on('trackStarted', listener);
    const track = { title: 'Test', source: { provider: 'test', id: '1' } };
    bus.emit('trackFinished', track);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(listener).not.toHaveBeenCalled();
  });

  it('unsubscribe removes listener', async () => {
    const bus = createEventBus();
    const listener = vi.fn();
    const unsubscribe = bus.on('trackStarted', listener);
    unsubscribe();
    const track = { title: 'Test', source: { provider: 'test', id: '1' } };
    bus.emit('trackStarted', track);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not throw when emitting with no listeners', () => {
    const bus = createEventBus();
    expect(() =>
      bus.emit('trackStarted', {
        title: 'Test',
        source: { provider: 'test', id: '1' },
      }),
    ).not.toThrow();
  });

  it('continues to call remaining listeners when one throws', async () => {
    const bus = createEventBus();
    const throwingListener = vi.fn().mockRejectedValue(new Error('fail'));
    const normalListener = vi.fn();
    bus.on('trackStarted', throwingListener);
    bus.on('trackStarted', normalListener);
    bus.emit('trackStarted', {
      title: 'Test',
      source: { provider: 'test', id: '1' },
    });
    await vi.waitFor(() => expect(normalListener).toHaveBeenCalled());
  });
});
