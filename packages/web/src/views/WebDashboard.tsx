import isEmpty from 'lodash-es/isEmpty';
import { LayoutDashboard } from 'lucide-react';
import { FC, useMemo } from 'react';

import { useTranslation } from '@nuclearplayer/i18n';
import type { DashboardProvider } from '@nuclearplayer/plugin-sdk';
import { EmptyState, Loader, ViewShell } from '@nuclearplayer/ui';

import { useProviders } from '../hooks/useProviders';
import {
  DASHBOARD_WIDGETS,
  DashboardWidgetEntry,
} from './WebDashboard/dashboardWidgets';

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
  activeWidgets: DashboardWidgetEntry[];
}> = ({ isLoading, activeWidgets }) => {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader data-testid="dashboard-loader" size="xl" />
      </div>
    );
  }

  if (isEmpty(activeWidgets)) {
    return <DashboardEmptyState />;
  }

  return (
    <div className="flex flex-col gap-8">
      {activeWidgets.map(({ capability, component: Widget }) => (
        <Widget key={capability} />
      ))}
    </div>
  );
};

export const WebDashboard: FC = () => {
  const { t } = useTranslation('dashboard');
  const providers = useProviders('dashboard') as DashboardProvider[];

  const activeWidgets = useMemo(() => {
    const capabilities = new Set(
      providers.flatMap((provider) => provider.capabilities),
    );

    return DASHBOARD_WIDGETS.filter((widget) =>
      capabilities.has(widget.capability),
    );
  }, [providers]);

  return (
    <ViewShell data-testid="dashboard-view" title={t('title')}>
      <DashboardContent isLoading={false} activeWidgets={activeWidgets} />
    </ViewShell>
  );
};
