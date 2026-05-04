import { createRootRoute } from '@tanstack/react-router';
import {
  CableIcon,
  DiscIcon,
  GaugeIcon,
  ListMusicIcon,
  MusicIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';

import { useTranslation } from '@nuclearplayer/i18n';
import {
  PlayerShell,
  PlayerWorkspace,
  RouteTransition,
  SidebarNavigation,
  SidebarNavigationItem,
  Toaster,
} from '@nuclearplayer/ui';

import { SoundProvider } from '../components/SoundProvider';
import { StreamResolver } from '../components/StreamResolver';
import { WebPlayerBar } from '../components/WebPlayerBar';
import { QueueHeaderActions, WebQueuePanel } from '../components/WebQueuePanel';
import { WebTopBar } from '../components/WebTopBar';
import { useLayoutStore } from '../stores/layoutStore';

const RootComponent = () => {
  const { t } = useTranslation('navigation');
  const { t: tPrefs } = useTranslation('preferences');
  const {
    leftSidebar,
    rightSidebar,
    toggleLeftSidebar,
    toggleRightSidebar,
    setLeftSidebarWidth,
    setRightSidebarWidth,
  } = useLayoutStore();

  return (
    <PlayerShell>
      <StreamResolver />
      <WebTopBar />
      <SoundProvider>
        <PlayerWorkspace>
          <PlayerWorkspace.LeftSidebar
            width={leftSidebar.width}
            isCollapsed={leftSidebar.isCollapsed}
            onWidthChange={setLeftSidebarWidth}
            onToggle={toggleLeftSidebar}
          >
            <SidebarNavigation isCompact={leftSidebar.isCollapsed}>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
                <SidebarNavigationItem
                  to="/dashboard"
                  icon={<GaugeIcon />}
                  label={t('dashboard')}
                />
                <SidebarNavigationItem
                  to="/favorites/albums"
                  icon={<DiscIcon />}
                  label={t('favoriteAlbums')}
                />
                <SidebarNavigationItem
                  to="/favorites/tracks"
                  icon={<MusicIcon />}
                  label={t('favoriteTracks')}
                />
                <SidebarNavigationItem
                  to="/favorites/artists"
                  icon={<UserIcon />}
                  label={t('favoriteArtists')}
                />
                <SidebarNavigationItem
                  to="/playlists"
                  icon={<ListMusicIcon />}
                  label={t('playlists')}
                />
                <SidebarNavigationItem
                  to="/sources"
                  icon={<CableIcon />}
                  label={t('sources')}
                />
              </div>
              <SidebarNavigationItem
                to="/settings"
                icon={<SettingsIcon />}
                label={tPrefs('title')}
              />
            </SidebarNavigation>
          </PlayerWorkspace.LeftSidebar>

          <PlayerWorkspace.Main>
            <RouteTransition />
          </PlayerWorkspace.Main>

          <PlayerWorkspace.RightSidebar
            width={rightSidebar.width}
            isCollapsed={rightSidebar.isCollapsed}
            onWidthChange={setRightSidebarWidth}
            onToggle={toggleRightSidebar}
            headerActions={<QueueHeaderActions />}
          >
            <WebQueuePanel isCollapsed={rightSidebar.isCollapsed} />
          </PlayerWorkspace.RightSidebar>
        </PlayerWorkspace>
      </SoundProvider>

      <WebPlayerBar />
      <Toaster />
    </PlayerShell>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
