import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/** Pull-to-refresh state: refetches every active query and keeps the spinner up until they settle. */
export function useRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ refetchType: 'active' });
    } catch (e) {
      console.warn('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  return { refreshing, onRefresh };
}
