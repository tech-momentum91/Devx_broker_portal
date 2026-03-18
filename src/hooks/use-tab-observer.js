// AlignUI useTabObserver v0.0.0

import * as React from 'react';

export function useTabObserver({ onActiveTabChange } = {}) {
  const [mounted, setMounted] = React.useState(false);
  const listRef = React.useRef(null);
  const onActiveTabChangeRef = React.useRef(onActiveTabChange);

  React.useEffect(() => {
    onActiveTabChangeRef.current = onActiveTabChange;
  }, [onActiveTabChange]);

  const handleUpdate = React.useCallback(() => {
    if (listRef.current) {
      const tabs = listRef.current.querySelectorAll('[role="tab"]');
      tabs.forEach((el, i) => {
        if (el.getAttribute('data-state') === 'active') {
          onActiveTabChangeRef.current?.(i, el);
        }
      });
    }
  }, []);

  React.useEffect(() => {
    setMounted(true);

    const resizeObserver = new ResizeObserver(handleUpdate);
    const mutationObserver = new MutationObserver(handleUpdate);

    if (listRef.current) {
      resizeObserver.observe(listRef.current);
      mutationObserver.observe(listRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    handleUpdate();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return { mounted, listRef };
}
