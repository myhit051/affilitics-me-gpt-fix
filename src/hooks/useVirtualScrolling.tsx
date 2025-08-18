/**
 * Virtual Scrolling Hook
 * Provides virtual scrolling functionality for large datasets
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

export interface VirtualScrollingOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside visible area
  scrollThreshold?: number; // Threshold for triggering scroll events
}

export interface VirtualScrollingResult<T> {
  visibleItems: T[];
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
  scrollToIndex: (index: number) => void;
  scrollToTop: () => void;
  containerProps: {
    style: React.CSSProperties;
    onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  };
  viewportProps: {
    style: React.CSSProperties;
  };
}

export function useVirtualScrolling<T>(
  items: T[],
  options: VirtualScrollingOptions
): VirtualScrollingResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollThreshold = 10,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const totalItems = items.length;
    
    if (totalItems === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        visibleItems: [],
      };
    }

    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      totalItems - 1
    );

    // Add overscan
    const startWithOverscan = Math.max(0, visibleStart - overscan);
    const endWithOverscan = Math.min(totalItems - 1, visibleEnd + overscan);

    return {
      startIndex: startWithOverscan,
      endIndex: endWithOverscan,
      visibleItems: items.slice(startWithOverscan, endWithOverscan + 1),
    };
  }, [items, scrollTop, itemHeight, containerHeight, overscan]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  // Scroll event handler with throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    
    // Only update if scroll difference is significant
    if (Math.abs(newScrollTop - scrollTop) >= scrollThreshold) {
      setScrollTop(newScrollTop);
    }

    // Set scrolling state
    if (!isScrolling) {
      setIsScrolling(true);
    }
  }, [scrollTop, scrollThreshold, isScrolling]);

  // Clear scrolling state after scroll ends
  useEffect(() => {
    if (isScrolling) {
      const timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [isScrolling, scrollTop]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(targetScrollTop);
    
    // If we have a container ref, scroll it directly
    const container = document.querySelector('[data-virtual-scroll-container]');
    if (container) {
      container.scrollTop = targetScrollTop;
    }
  }, [itemHeight]);

  // Scroll to top
  const scrollToTop = useCallback(() => {
    scrollToIndex(0);
  }, [scrollToIndex]);

  // Container props
  const containerProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    },
    onScroll: handleScroll,
  }), [containerHeight, handleScroll]);

  // Viewport props (inner container that holds the visible items)
  const viewportProps = useMemo(() => ({
    style: {
      height: totalHeight,
      position: 'relative' as const,
    },
  }), [totalHeight]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    scrollToIndex,
    scrollToTop,
    containerProps,
    viewportProps,
  };
}

/**
 * Hook for virtual scrolling with dynamic item heights
 * More complex but supports variable item heights
 */
export interface DynamicVirtualScrollingOptions {
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
  getItemHeight?: (index: number) => number;
}

export function useDynamicVirtualScrolling<T>(
  items: T[],
  options: DynamicVirtualScrollingOptions
): VirtualScrollingResult<T> {
  const {
    estimatedItemHeight,
    containerHeight,
    overscan = 5,
    getItemHeight,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());

  // Get height for specific item
  const getHeight = useCallback((index: number): number => {
    if (getItemHeight) {
      return getItemHeight(index);
    }
    return itemHeights.get(index) || estimatedItemHeight;
  }, [getItemHeight, itemHeights, estimatedItemHeight]);

  // Calculate cumulative heights for positioning
  const cumulativeHeights = useMemo(() => {
    const heights = [0];
    for (let i = 0; i < items.length; i++) {
      heights.push(heights[i] + getHeight(i));
    }
    return heights;
  }, [items.length, getHeight]);

  // Find visible range using binary search
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] };
    }

    // Binary search for start index
    let start = 0;
    let end = items.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      if (cumulativeHeights[mid] < scrollTop) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    const visibleStart = Math.max(0, end);

    // Find end index
    const viewportBottom = scrollTop + containerHeight;
    start = visibleStart;
    end = items.length - 1;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      if (cumulativeHeights[mid] <= viewportBottom) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    const visibleEnd = Math.min(items.length - 1, start);

    // Add overscan
    const startWithOverscan = Math.max(0, visibleStart - overscan);
    const endWithOverscan = Math.min(items.length - 1, visibleEnd + overscan);

    return {
      startIndex: startWithOverscan,
      endIndex: endWithOverscan,
      visibleItems: items.slice(startWithOverscan, endWithOverscan + 1),
    };
  }, [items, scrollTop, containerHeight, cumulativeHeights, overscan]);

  const totalHeight = cumulativeHeights[items.length] || 0;
  const offsetY = cumulativeHeights[startIndex] || 0;

  // Update item height
  const updateItemHeight = useCallback((index: number, height: number) => {
    setItemHeights(prev => {
      const newHeights = new Map(prev);
      newHeights.set(index, height);
      return newHeights;
    });
  }, []);

  // Scroll handlers
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = cumulativeHeights[index] || 0;
    setScrollTop(targetScrollTop);
    
    const container = document.querySelector('[data-virtual-scroll-container]');
    if (container) {
      container.scrollTop = targetScrollTop;
    }
  }, [cumulativeHeights]);

  const scrollToTop = useCallback(() => {
    scrollToIndex(0);
  }, [scrollToIndex]);

  const containerProps = useMemo(() => ({
    style: {
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    },
    onScroll: handleScroll,
  }), [containerHeight, handleScroll]);

  const viewportProps = useMemo(() => ({
    style: {
      height: totalHeight,
      position: 'relative' as const,
    },
  }), [totalHeight]);

  return {
    visibleItems,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    scrollToIndex,
    scrollToTop,
    containerProps,
    viewportProps,
    // Additional method for dynamic heights
    updateItemHeight,
  } as VirtualScrollingResult<T> & { updateItemHeight: (index: number, height: number) => void };
}