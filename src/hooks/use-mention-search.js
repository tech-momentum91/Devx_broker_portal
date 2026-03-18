import { useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { searchUsers } from '@/redux/userSlice';

export const useMentionSearch = ({ limit = 20, debounceMs = 300 } = {}) => {
  const dispatch = useDispatch();
  const timeoutRef = useRef(null);
  const requestIdRef = useRef(0);

  const searchMentions = useCallback(
    (query = '') =>
      new Promise((resolve) => {
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          dispatch(
            searchUsers({
              searchQuery: query,
              limit,
              names: [],
            }),
          )
            .then((result) => {
              if (requestId !== requestIdRef.current) {
                resolve([]);
                return;
              }
              if (searchUsers.fulfilled.match(result)) {
                resolve(result.payload.users || []);
                return;
              }
              resolve([]);
            })
            .catch(() => resolve([]));
        }, debounceMs);
      }),
    [dispatch, limit, debounceMs],
  );

  return { searchMentions };
};
