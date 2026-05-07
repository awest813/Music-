import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FC, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

import { i18n } from '@nuclearplayer/i18n';

import { WebSettings } from '../../views/WebSettings/WebSettings';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const TestWrapper: FC<{
  children: ReactNode;
  queryClient: QueryClient;
}> = ({ children, queryClient }) => (
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  </I18nextProvider>
);

export const WebSettingsWrapper = {
  async mount(): Promise<void> {
    const queryClient = createQueryClient();
    queryClient.clear();
    render(<WebSettings />, {
      wrapper: (props) => <TestWrapper queryClient={queryClient} {...props} />,
    });
  },

  get view() {
    return screen.getByRole('main');
  },

  get tabs() {
    return screen.getAllByRole('tab');
  },

  getTabByName(name: string) {
    return screen.queryByRole('tab', { name });
  },

  clear(): void {
    vi.restoreAllMocks();
  },
};
