import { useRouter } from '@tanstack/react-router';
import { ChangeEvent, FC, KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@nuclearplayer/ui';

export const SearchBox: FC = () => {
  const { t } = useTranslation('search');
  const [query, setQuery] = useState('');
  const router = useRouter();

  const submit = () => {
    const q = query.trim();
    if (q.length === 0) {
      return;
    }

    router.navigate({ to: '/search', search: { q } });
  };

  return (
    <Input
      data-testid="search-box"
      value={query}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        setQuery(event.target.value)
      }
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
          submit();
        }
      }}
      placeholder={t('placeholder')}
      tone="secondary"
      className="h-8"
    />
  );
};
