/**
 * Virtual Scrolling Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualScrolling, useDynamicVirtualScrolling } from '../useVirtualScrolling';

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
});

// Mock document.querySelector
const mockQuerySelector = vi.fn();
Object.defineProperty(document, 'querySelector', {
  value: mockQuerySelector,
  writable: true,
});

describe('useVirtualScrolling', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: i * 10,
  }));

  const defaultOptions = {
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformanceNow.mockReturnValue(0);
  });

  describe('basic functionality', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBeGreaterThan(0);
      expect(result.current.totalHeight).toBe(mockItems.length * defaultOptions.itemHeight);
      expect(result.current.offsetY).toBe(0);
      expect(result.current.visibleItems.length).toBeGreaterThan(0);
    });

    it('should calculate visible items correctly', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      const expectedVisibleCount = Math.ceil(defaultOptions.containerHeight / defaultOptions.itemHeight) + (defaultOptions.overscan * 2);
      expect(result.current.visibleItems.length).toBeLessThanOrEqual(expectedVisibleCount + 1);
    });

    it('should handle empty items array', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling([], defaultOptions)
      );

      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(0);
      expect(result.current.visibleItems).toEqual([]);
      expect(result.current.totalHeight).toBe(0);
    });

    it('should provide correct container and viewport props', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      expect(result.current.containerProps.style.height).toBe(defaultOptions.containerHeight);
      expect(result.current.containerProps.style.overflow).toBe('auto');
      expect(result.current.containerProps.style.position).toBe('relative');

      expect(result.current.viewportProps.style.height).toBe(mockItems.length * defaultOptions.itemHeight);
      expect(result.current.viewportProps.style.position).toBe('relative');
    });
  });

  describe('scrolling behavior', () => {
    it('should update visible items when scrolling', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      const initialStartIndex = result.current.startIndex;

      // Simulate scroll event
      const mockScrollEvent = {
        currentTarget: { scrollTop: 500 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.containerProps.onScroll(mockScrollEvent);
      });

      expect(result.current.startIndex).toBeGreaterThan(initialStartIndex);
      expect(result.current.offsetY).toBeGreaterThan(0);
    });

    it('should respect scroll threshold', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, {
          ...defaultOptions,
          scrollThreshold: 50,
        })
      );

      const initialStartIndex = result.current.startIndex;

      // Small scroll (below threshold)
      const smallScrollEvent = {
        currentTarget: { scrollTop: 25 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.containerProps.onScroll(smallScrollEvent);
      });

      expect(result.current.startIndex).toBe(initialStartIndex);

      // Large scroll (above threshold)
      const largeScrollEvent = {
        currentTarget: { scrollTop: 100 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.containerProps.onScroll(largeScrollEvent);
      });

      expect(result.current.startIndex).toBeGreaterThan(initialStartIndex);
    });

    it('should provide scrollToIndex functionality', () => {
      const mockContainer = { scrollTop: 0 };
      mockQuerySelector.mockReturnValue(mockContainer);

      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      act(() => {
        result.current.scrollToIndex(10);
      });

      expect(mockContainer.scrollTop).toBe(10 * defaultOptions.itemHeight);
    });

    it('should provide scrollToTop functionality', () => {
      const mockContainer = { scrollTop: 500 };
      mockQuerySelector.mockReturnValue(mockContainer);

      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      act(() => {
        result.current.scrollToTop();
      });

      expect(mockContainer.scrollTop).toBe(0);
    });
  });

  describe('performance optimizations', () => {
    it('should handle overscan correctly', () => {
      const overscan = 3;
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, {
          ...defaultOptions,
          overscan,
        })
      );

      // Should include overscan items
      const visibleItemsInViewport = Math.ceil(defaultOptions.containerHeight / defaultOptions.itemHeight);
      const expectedMinItems = visibleItemsInViewport;
      const expectedMaxItems = visibleItemsInViewport + (overscan * 2);

      expect(result.current.visibleItems.length).toBeGreaterThanOrEqual(expectedMinItems);
      expect(result.current.visibleItems.length).toBeLessThanOrEqual(expectedMaxItems + 1);
    });

    it('should update when items change', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useVirtualScrolling(items, defaultOptions),
        { initialProps: { items: mockItems.slice(0, 100) } }
      );

      const initialTotalHeight = result.current.totalHeight;

      // Update with more items
      rerender({ items: mockItems });

      expect(result.current.totalHeight).toBeGreaterThan(initialTotalHeight);
    });

    it('should handle rapid scroll events efficiently', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, defaultOptions)
      );

      const startTime = performance.now();
      mockPerformanceNow.mockReturnValue(startTime);

      // Simulate rapid scrolling
      for (let i = 0; i < 100; i++) {
        const scrollEvent = {
          currentTarget: { scrollTop: i * 10 },
        } as React.UIEvent<HTMLDivElement>;

        act(() => {
          result.current.containerProps.onScroll(scrollEvent);
        });
      }

      // Should complete quickly
      expect(performance.now() - startTime).toBeLessThan(100);
    });
  });

  describe('edge cases', () => {
    it('should handle very small container heights', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, {
          ...defaultOptions,
          containerHeight: 10,
        })
      );

      expect(result.current.visibleItems.length).toBeGreaterThan(0);
      expect(result.current.endIndex).toBeGreaterThanOrEqual(result.current.startIndex);
    });

    it('should handle very large item heights', () => {
      const { result } = renderHook(() =>
        useVirtualScrolling(mockItems, {
          ...defaultOptions,
          itemHeight: 1000,
        })
      );

      expect(result.current.visibleItems.length).toBeGreaterThan(0);
      expect(result.current.totalHeight).toBe(mockItems.length * 1000);
    });

    it('should handle items array changes', () => {
      const { result, rerender } = renderHook(
        ({ items }) => useVirtualScrolling(items, defaultOptions),
        { initialProps: { items: mockItems } }
      );

      const initialVisibleItems = result.current.visibleItems;

      // Change to different items
      const newItems = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1000,
        name: `New Item ${i}`,
        value: i * 20,
      }));

      rerender({ items: newItems });

      expect(result.current.visibleItems).not.toEqual(initialVisibleItems);
      expect(result.current.totalHeight).toBe(newItems.length * defaultOptions.itemHeight);
    });
  });
});

describe('useDynamicVirtualScrolling', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    content: 'A'.repeat(i * 10), // Variable content length
  }));

  const defaultOptions = {
    estimatedItemHeight: 50,
    containerHeight: 400,
    overscan: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dynamic height functionality', () => {
    it('should initialize with estimated heights', () => {
      const { result } = renderHook(() =>
        useDynamicVirtualScrolling(mockItems, defaultOptions)
      );

      expect(result.current.visibleItems.length).toBeGreaterThan(0);
      expect(result.current.totalHeight).toBeGreaterThan(0);
    });

    it('should provide updateItemHeight function', () => {
      const { result } = renderHook(() =>
        useDynamicVirtualScrolling(mockItems, defaultOptions)
      );

      expect(typeof (result.current as any).updateItemHeight).toBe('function');
    });

    it('should update heights when updateItemHeight is called', () => {
      const { result } = renderHook(() =>
        useDynamicVirtualScrolling(mockItems, defaultOptions)
      );

      const initialTotalHeight = result.current.totalHeight;

      act(() => {
        (result.current as any).updateItemHeight(0, 100); // Update first item to 100px
      });

      // Total height should change
      expect(result.current.totalHeight).not.toBe(initialTotalHeight);
    });

    it('should handle custom getItemHeight function', () => {
      const getItemHeight = vi.fn((index: number) => 50 + (index % 3) * 20);

      const { result } = renderHook(() =>
        useDynamicVirtualScrolling(mockItems, {
          ...defaultOptions,
          getItemHeight,
        })
      );

      expect(getItemHeight).toHaveBeenCalled();
      expect(result.current.totalHeight).toBeGreaterThan(mockItems.length * defaultOptions.estimatedItemHeight);
    });
  });

  describe('performance with dynamic heights', () => {
    it('should handle height updates efficiently', () => {
      const { result } = renderHook(() =>
        useDynamicVirtualScrolling(mockItems, defaultOptions)
      );

      const startTime = performance.now();
      mockPerformanceNow.mockReturnValue(startTime);

      // Update many item heights
      act(() => {
        for (let i = 0; i < 50; i++) {
          (result.current as any).updateItemHeight(i, 50 + i);
        }
      });

      expect(performance.now() - startTime).toBeLessThan(100);
    });

    it('should maintain performance with frequent scrolling', () => {
      const { result } = renderHook(() =>
        useDynamicVirtualScrolling(mockItems, defaultOptions)
      );

      const startTime = performance.now();
      mockPerformanceNow.mockReturnValue(startTime);

      // Simulate scrolling with dynamic heights
      for (let i = 0; i < 20; i++) {
        const scrollEvent = {
          currentTarget: { scrollTop: i * 50 },
        } as React.UIEvent<HTMLDivElement>;

        act(() => {
          result.current.containerProps.onScroll(scrollEvent);
        });
      }

      expect(performance.now() - startTime).toBeLessThan(100);
    });
  });
});

describe('Virtual Scrolling Performance Tests', () => {
  it('should handle very large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: `Data for item ${i}`,
    }));

    const startTime = performance.now();
    mockPerformanceNow.mockReturnValue(startTime);

    const { result } = renderHook(() =>
      useVirtualScrolling(largeDataset, {
        itemHeight: 40,
        containerHeight: 600,
        overscan: 10,
      })
    );

    // Should render only visible items, not all 10k
    expect(result.current.visibleItems.length).toBeLessThan(100);
    expect(result.current.totalHeight).toBe(largeDataset.length * 40);

    // Should complete initialization quickly
    expect(performance.now() - startTime).toBeLessThan(50);
  });

  it('should maintain consistent performance during scrolling', () => {
    const largeDataset = Array.from({ length: 5000 }, (_, i) => ({ id: i, name: `Item ${i}` }));

    const { result } = renderHook(() =>
      useVirtualScrolling(largeDataset, {
        itemHeight: 50,
        containerHeight: 500,
        overscan: 5,
      })
    );

    const scrollTimes: number[] = [];

    // Measure scroll performance
    for (let i = 0; i < 50; i++) {
      const scrollStart = performance.now();
      mockPerformanceNow.mockReturnValue(scrollStart);

      const scrollEvent = {
        currentTarget: { scrollTop: i * 100 },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.containerProps.onScroll(scrollEvent);
      });

      scrollTimes.push(performance.now() - scrollStart);
    }

    // All scroll operations should be fast
    const avgScrollTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
    expect(avgScrollTime).toBeLessThan(5); // 5ms average
  });

  it('should handle memory efficiently with large datasets', () => {
    const largeDataset = Array.from({ length: 50000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: `Description for item ${i}`.repeat(10),
    }));

    const { result } = renderHook(() =>
      useVirtualScrolling(largeDataset, {
        itemHeight: 60,
        containerHeight: 800,
        overscan: 15,
      })
    );

    // Should only keep visible items in memory
    expect(result.current.visibleItems.length).toBeLessThan(50);
    
    // Simulate scrolling to different positions
    const positions = [0, 10000, 25000, 40000, 49000];
    
    positions.forEach(position => {
      const scrollEvent = {
        currentTarget: { scrollTop: position },
      } as React.UIEvent<HTMLDivElement>;

      act(() => {
        result.current.containerProps.onScroll(scrollEvent);
      });

      // Should still only render visible items
      expect(result.current.visibleItems.length).toBeLessThan(50);
    });
  });
});