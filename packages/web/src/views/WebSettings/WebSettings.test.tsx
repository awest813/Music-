import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WebSettingsWrapper } from './WebSettings.test-wrapper';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useSearch: vi.fn(() => ({ tab: 'general' })),
}));

vi.mock('../../views/WebLogs/WebLogs', () => ({
  WebLogs: vi.fn(() => null),
}));

vi.mock('../../views/WebPlugins/WebPlugins', () => ({
  WebPlugins: vi.fn(() => null),
}));

vi.mock('../../views/WebThemes/WebThemes', () => ({
  WebThemes: vi.fn(() => null),
}));

vi.mock('../../views/WebWhatsNew/WebWhatsNew', () => ({
  WebWhatsNew: vi.fn(() => null),
}));

vi.mock('../../views/WebSettings/useSettingsGroups', () => ({
  useSettingsGroups: vi.fn(() => []),
}));

describe('WebSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all five tabs', async () => {
    await WebSettingsWrapper.mount();
    const tabs = WebSettingsWrapper.tabs;
    expect(tabs).toHaveLength(5);
  });

  it('shows general tab as selected by default', async () => {
    await WebSettingsWrapper.mount();
    const generalTab = WebSettingsWrapper.getTabByName(/general/i);
    expect(generalTab).toHaveAttribute('aria-selected', 'true');
  });
});
