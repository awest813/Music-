import { TerminalIcon } from 'lucide-react';

import { useTranslation } from '@nuclearplayer/i18n';
import { EmptyState, ViewShell } from '@nuclearplayer/ui';

export const WebLogs = () => {
  const { t } = useTranslation('logs');

  return (
    <ViewShell data-testid="logs-view" title={t('title')}>
      <EmptyState
        icon={<TerminalIcon size={48} />}
        title={t('webLogsTitle')}
        description={t('webLogsDescription')}
        className="flex-1"
      />
    </ViewShell>
  );
};
