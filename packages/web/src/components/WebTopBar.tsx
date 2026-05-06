import { useCanGoBack, useRouter } from '@tanstack/react-router';
import { FC } from 'react';

import { TopBar, TopBarLogo, TopBarNavigation } from '@nuclearplayer/ui';

import { useCanGoForward } from '../hooks/useCanGoForward';
import { ConnectedThemeController } from './ConnectedThemeController';
import { SearchBox } from './SearchBox';
import { SocialLinks } from './SocialLinks';

export const WebTopBar: FC = () => {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const canGoForward = useCanGoForward();

  return (
    <TopBar draggable={false}>
      <div className="flex flex-row items-center gap-4">
        <TopBarLogo />
        <TopBarNavigation
          onBack={() => router.history.back()}
          onForward={() => router.history.forward()}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
        />
      </div>
      <SearchBox />
      <div className="flex items-center gap-2">
        <SocialLinks />
        <ConnectedThemeController />
      </div>
    </TopBar>
  );
};
