import { useEffect, useRef, useCallback } from 'react';

/**
 * Reusable hook for scroll-based pagination
 * @param {Object} options - Configuration options
 * @param {Function} options.onLoadMore - Callback function when user scrolls near bottom
 * @param {boolean} options.hasMore - Whether there are more items to load
 * @param {boolean} options.isLoading - Whether data is currently loading
 * @param {number} options.threshold - Distance from bottom (in pixels) to trigger load (default: 200)
 * @param {HTMLElement|string} options.scrollContainer - Container element or selector to observe (default: window)
 * @param {boolean} options.enabled - Whether scroll pagination is enabled (default: true)
 * @returns {Object} - Ref to attach to scrollable container and sentinel element
 */
export const useScrollPagination = ({
  onLoadMore,
  hasMore = true,
  isLoading = false,
  threshold = 200,
  scrollContainer = null,
  enabled = true,
}) => {
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const isLoadingRef = useRef(false);
  const observerRef = useRef(null);

  // Update loading ref when isLoading changes
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Handle load more with debouncing
  const handleLoadMore = useCallback(() => {
    if (!enabled || !hasMore || isLoadingRef.current) {
      return;
    }

    isLoadingRef.current = true;
    onLoadMore?.();
  }, [enabled, hasMore, onLoadMore]);

  // Setup Intersection Observer for sentinel element
  useEffect(() => {
    if (!enabled || !hasMore || !sentinelRef.current) {
      return;
    }

    // Get the scroll container
    const container = scrollContainer
      ? typeof scrollContainer === 'string'
        ? document.querySelector(scrollContainer)
        : scrollContainer
      : null;

    // Setup Intersection Observer
    const options = {
      root: container || null, // null means viewport
      rootMargin: `${threshold}px`,
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoadingRef.current && hasMore) {
        handleLoadMore();
      }
    }, options);

    // Observe sentinel
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, threshold, scrollContainer, handleLoadMore]);

  // Reset loading state when isLoading becomes false
  useEffect(() => {
    if (!isLoading) {
      // Use setTimeout to allow the loading state to update before resetting
      const timer = setTimeout(() => {
        isLoadingRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Render sentinel callback
  const renderSentinel = useCallback(() => {
    return <div ref={sentinelRef} data-scroll-sentinel style={{ height: '1px', width: '100%' }} />;
  }, []);

  return {
    containerRef,
    sentinelRef,
    renderSentinel,
  };
};
