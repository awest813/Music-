import { Loader, PackageIcon, SearchIcon, TrashIcon } from 'lucide-react';
import { useCallback, useState, type FC } from 'react';
import { toast } from 'sonner';

import { useTranslation } from '@nuclearplayer/i18n';
import {
  Button,
  Dialog,
  Input,
  ScrollableArea,
  Tabs,
  ViewShell,
} from '@nuclearplayer/ui';

import type { MarketplacePlugin } from '../../apis/pluginMarketplaceApi';
import { useMarketplacePlugins } from '../../hooks/useMarketplacePlugins';
import { usePluginStore, type PluginState } from '../../stores/pluginStore';

type PluginCardProps = {
  plugin: PluginState;
  onEnable: () => void;
  onDisable: () => void;
  onRemove: () => void;
};

const PluginCard: FC<PluginCardProps> = ({
  plugin,
  onEnable,
  onDisable,
  onRemove,
}) => {
  const { t } = useTranslation('plugins');
  const { metadata, enabled, warning, warnings } = plugin;

  return (
    <div
      className={`border-border flex flex-col gap-3 rounded-md border-2 p-4 ${
        warning ? 'border-accent-yellow' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <PackageIcon size={20} />
          <div>
            <h3 className="font-heading font-bold">{metadata.displayName}</h3>
            <p className="text-muted-foreground text-sm">
              {metadata.name}@{metadata.version}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {enabled ? (
            <Button size="sm" variant="secondary" onClick={onDisable}>
              {t('disable')}
            </Button>
          ) : (
            <Button size="sm" onClick={onEnable}>
              {t('enable')}
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onRemove}>
            <TrashIcon size={16} />
          </Button>
        </div>
      </div>
      {metadata.description && (
        <p className="text-foreground-secondary text-sm">
          {metadata.description}
        </p>
      )}
      {warning && warnings.length > 0 && (
        <div className="text-accent-yellow text-sm">{warnings.join(', ')}</div>
      )}
    </div>
  );
};

const InstallPluginDialog: FC<{
  isOpen: boolean;
  onClose: () => void;
  onInstall: (url: string) => void;
  isLoading: boolean;
  defaultUrl?: string;
}> = ({ isOpen, onClose, onInstall, isLoading, defaultUrl }) => {
  const { t } = useTranslation('plugins');
  const [url, setUrl] = useState(defaultUrl ?? '');

  const handleInstall = () => {
    if (url.trim()) {
      onInstall(url.trim());
    }
  };

  return (
    <Dialog.Root isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleInstall();
        }}
      >
        <Dialog.Title>{t('installTitle')}</Dialog.Title>
        <div className="mt-4">
          <Input
            label={t('pluginUrl')}
            placeholder="https://example.com/plugin.js"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoFocus
          />
        </div>
        <Dialog.Actions>
          <Dialog.Close>{t('cancel')}</Dialog.Close>
          <Button type="submit" disabled={!url.trim() || isLoading}>
            {isLoading ? <Loader size={16} /> : null}
            {t('install')}
          </Button>
        </Dialog.Actions>
      </form>
    </Dialog.Root>
  );
};

const InstalledPlugins: FC = () => {
  const { t } = useTranslation('plugins');
  const plugins = usePluginStore((state) => Object.values(state.plugins));
  const enablePlugin = usePluginStore((state) => state.enablePlugin);
  const disablePlugin = usePluginStore((state) => state.disablePlugin);
  const removePlugin = usePluginStore((state) => state.removePlugin);

  const handleEnable = useCallback(
    async (id: string) => {
      try {
        await enablePlugin(id);
      } catch (error) {
        toast.error(
          t('enableError', {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    },
    [enablePlugin, t],
  );

  const handleDisable = useCallback(
    async (id: string) => {
      try {
        await disablePlugin(id);
      } catch (error) {
        toast.error(
          t('disableError', {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    },
    [disablePlugin, t],
  );

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await removePlugin(id);
      } catch (error) {
        toast.error(
          t('removeError', {
            message: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    },
    [removePlugin, t],
  );

  if (plugins.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 py-8">
        <PackageIcon size={48} />
        <p>{t('noPlugins')}</p>
      </div>
    );
  }

  return (
    <ScrollableArea className="flex-1 overflow-hidden">
      <div className="flex flex-col gap-3">
        {plugins.map((plugin) => (
          <PluginCard
            key={plugin.metadata.id}
            plugin={plugin}
            onEnable={() => void handleEnable(plugin.metadata.id)}
            onDisable={() => void handleDisable(plugin.metadata.id)}
            onRemove={() => void handleRemove(plugin.metadata.id)}
          />
        ))}
      </div>
    </ScrollableArea>
  );
};

const PluginStore: FC<{
  onInstallViaUrl: (url: string) => void;
}> = ({ onInstallViaUrl }) => {
  const { t } = useTranslation('plugins');
  const { data: plugins, isLoading, error } = useMarketplacePlugins();
  const installedPlugins = usePluginStore((s) => s.plugins);
  const [search, setSearch] = useState('');

  const filteredPlugins = (plugins ?? []).filter((plugin) => {
    if (!search) {
      return true;
    }
    const lower = search.toLowerCase();
    return (
      plugin.name.toLowerCase().includes(lower) ||
      plugin.description.toLowerCase().includes(lower) ||
      plugin.author.toLowerCase().includes(lower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <p className="text-muted-foreground">{t('store.error.description')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="relative">
        <SearchIcon
          size={16}
          className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
        />
        <Input
          placeholder={t('store.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredPlugins.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-2 py-8">
          <PackageIcon size={48} />
          <p>{t('store.noResults.empty')}</p>
        </div>
      ) : (
        <ScrollableArea className="flex-1 overflow-hidden">
          <div className="flex flex-col gap-3">
            {filteredPlugins.map((plugin) => (
              <MarketplacePluginCard
                key={plugin.id}
                plugin={plugin}
                isInstalled={plugin.id in installedPlugins}
                onInstall={() => {
                  if (plugin.downloadUrl) {
                    onInstallViaUrl(plugin.downloadUrl);
                  }
                }}
                labels={{
                  install: t('store.install'),
                  installed: t('store.installed'),
                  by: t('store.by'),
                }}
              />
            ))}
          </div>
        </ScrollableArea>
      )}
    </div>
  );
};

const MarketplacePluginCard: FC<{
  plugin: MarketplacePlugin;
  isInstalled: boolean;
  onInstall: () => void;
  labels: {
    install: string;
    installed: string;
    by: string;
  };
}> = ({ plugin, isInstalled, onInstall, labels }) => (
  <div className="border-border flex flex-col gap-3 rounded-md border-2 p-4">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2">
        <PackageIcon size={20} />
        <div>
          <h3 className="font-heading font-bold">{plugin.name}</h3>
          <p className="text-muted-foreground text-sm">
            {labels.by} {plugin.author}
            {plugin.version ? ` • v${plugin.version}` : ''}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={isInstalled ? 'secondary' : 'default'}
        onClick={onInstall}
        disabled={isInstalled || !plugin.downloadUrl}
      >
        {isInstalled ? labels.installed : labels.install}
      </Button>
    </div>
    {plugin.description && (
      <p className="text-foreground-secondary text-sm">{plugin.description}</p>
    )}
    {(plugin.categories ?? []).length > 0 && (
      <div className="flex flex-wrap gap-1">
        {(plugin.categories ?? []).map((cat) => (
          <span
            key={cat}
            className="bg-primary-muted text-foreground-secondary rounded px-2 py-0.5 text-xs"
          >
            {cat}
          </span>
        ))}
      </div>
    )}
  </div>
);

export const WebPlugins: FC = () => {
  const { t } = useTranslation('plugins');
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [installUrl, setInstallUrl] = useState('');

  const loadPluginFromUrl = usePluginStore((state) => state.loadPluginFromUrl);

  const handleInstall = async (url: string) => {
    setInstallingId(url);
    try {
      await loadPluginFromUrl(url);
      toast.success(t('installSuccess'));
    } catch (error) {
      toast.error(
        t('installError', {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      setInstallingId(null);
      setIsInstallDialogOpen(false);
    }
  };

  const items = [
    {
      id: 'installed',
      label: t('installed'),
      content: <InstalledPlugins />,
    },
    {
      id: 'store',
      label: t('store.title'),
      content: (
        <PluginStore
          onInstallViaUrl={(url) => {
            setInstallUrl(url);
            setIsInstallDialogOpen(true);
          }}
        />
      ),
    },
  ];

  return (
    <ViewShell data-testid="plugins-view" title={t('title')}>
      <div className="mb-4 flex items-center gap-2">
        <Button onClick={() => setIsInstallDialogOpen(true)}>
          {t('installPlugin')}
        </Button>
      </div>

      <Tabs
        items={items}
        selectedIndex={selectedTab}
        onChange={setSelectedTab}
        className="flex flex-1 flex-col overflow-hidden"
        panelsClassName="flex-1 overflow-hidden"
      />

      <InstallPluginDialog
        isOpen={isInstallDialogOpen}
        onClose={() => setIsInstallDialogOpen(false)}
        onInstall={handleInstall}
        isLoading={installingId !== null}
        defaultUrl={installUrl}
      />
    </ViewShell>
  );
};
