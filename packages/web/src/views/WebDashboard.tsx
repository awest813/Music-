import isEmpty from 'lodash-es/isEmpty';
import { LayoutDashboard } from 'lucide-react';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { DashboardProvider } from '@nuclearplayer/plugin-sdk';
import { EmptyState, Loader, ViewShell } from '@nuclearplayer/ui';

import { useProviders } from '../hooks/useProviders';

const DashboardEmptyState: FC = () => {
  const { t } = useTranslation('dashboard');

  return (
    <EmptyState
      data-testid="dashboard-empty-state"
      icon={<LayoutDashboard size={48} />}
      title={t('empty-state')}
      description={t('empty-state-description')}
      className="flex-1"
    />
  );
};

const DashboardContent: FC<{
  isLoading: boolean;
  providers: DashboardProvider[];
}> = ({ isLoading, providers }) => {
  const hasProviders = useMemo(
    () => providers.some((provider) => provider.capabilities.length > 0),
    [providers],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader data-testid="dashboard-loader" size="xl" />
      </div>
    );
  }

  if (isEmpty(providers) || !hasProviders) {
    return <DashboardEmptyState />;
  }

  return null;
};

export const WebDashboard: FC = () => {
  const { t } = useTranslation('dashboard');
  const providers = useProviders('dashboard') as DashboardProvider[];

  return (
    <ViewShell data-testid="dashboard-view" title={t('title')}>
      <DashboardContent isLoading={false} providers={providers} />
    </ViewShell>
  );
};
