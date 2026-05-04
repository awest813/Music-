import { FC } from 'react';

import { PlayerBar } from '@nuclearplayer/ui';

import { WebControls } from './WebControls';
import { WebNowPlaying } from './WebNowPlaying';
import { WebSeekBar } from './WebSeekBar';
import { WebVolume } from './WebVolume';

export const WebPlayerBar: FC = () => {
  return (
    <>
      <WebSeekBar />
      <PlayerBar
        left={<WebNowPlaying />}
        center={<WebControls />}
        right={<WebVolume />}
      />
    </>
  );
};
