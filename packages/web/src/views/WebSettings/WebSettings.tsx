import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import { ScrollableArea, Tabs, ViewShell } from '@nuclearplayer/ui';

import { WebLogs } from '../WebLogs/WebLogs';
import { WebPlugins } from '../WebPlugins/WebPlugins';
import { WebThemes } from '../WebThemes/WebThemes';
import { WebWhatsNew } from '../WebWhatsNew/WebWhatsNew';
import { SettingsSection } from './SettingsSection';
import { useSettingsGroups } from './useSettingsGroups';

const TAB_IDS = ['general', 'themes', 'plugins', 'logs', 'whats-new'] as const;
type TabId = (typeof TAB_IDS)[number];

const GeneralSettings = () => {
  const { t } = useTranslation('preferences');
  const groups = useSettingsGroups();

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-hidden">
      <ScrollableArea className="max-w-120 flex-1 overflow-hidden">
        <div className="px-2">
          {groups.map((group) => (
            <SettingsSection
              key={group.name}
              title={t(`${group.name}.title`, group.name)}
              settings={group.settings}
            />
          ))}
        </div>
      </ScrollableArea>
    </div>
  );
};

export const WebSettings = () => {
  const { t } = useTranslation('preferences');
  const navigate = useNavigate();
  const { tab } = useSearch({ from: '/settings' });

  const selectedTab = useMemo(() => {
    const idx = TAB_IDS.indexOf(tab as TabId);
    return idx >= 0 ? idx : 0;
  }, [tab]);

  const handleTabChange = useCallback(
    (index: number) => {
      const tabId = TAB_IDS[index];
      navigate({
        to: '/settings',
        search: tabId === 'general' ? {} : { tab: tabId },
        replace: true,
      });
    },
    [navigate],
  );

  const items = [
    {
      id: 'general',
      label: t('general.title'),
      content: <GeneralSettings />,
    },
    {
      id: 'themes',
      label: t('themes.title'),
      content: <WebThemes />,
    },
    {
      id: 'plugins',
      label: t('plugins.title'),
      content: <WebPlugins />,
    },
    {
      id: 'logs',
      label: t('logs.title'),
      content: <WebLogs />,
    },
    {
      id: 'whats-new',
      label: t('whats-new.title'),
      content: <WebWhatsNew />,
    },
  ];

  return (
    <ViewShell title={t('title')}>
      <Tabs
        items={items}
        selectedIndex={selectedTab}
        onChange={handleTabChange}
        className="flex flex-1 flex-col overflow-hidden"
        panelsClassName="flex-1 overflow-hidden"
      />
    </ViewShell>
  );
};
