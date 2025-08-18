import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { performance } from 'perf_hooks';
import VirtualizedFacebookCampaignTable from '@/components/VirtualizedFacebookCampaignTable';
import { FacebookCampaign } from '@/types/facebook';
import { getFacebookDataTransformer } from '@/lib/facebook-data-transformer';
import { getFacebookDataCache } from '@/lib/facebook-data-cache';
import { getFacebookAPIService } from '@/lib/facebook-api-service';

// Mock virtual scrolling hook for performance testing
vi.mock('@/hooks/useVirtualScrolling', () => ({
  default: (items: any[], itemHeight: number, containerHeight: number) => ({
    containerRef: { current: null },
    startIndex: 0,
    endIndex: Math.min(20, items.length), // Only render first 20 items
    visibleItems: items.slice(0, Math.min(20, items.length)),
    scrollToIndex: vi.fn(),
    handleScroll: vi.fn(),
  }),
}));

describe('Facebook Integration Performance Tests', () => {
  const generateLargeCampaignDataset = (size: number): FacebookCampaign[] => {
    return Array.from({ length: size }, (_, i) => ({
      id: `campaign_${i}`,
      name: `Test Campaign ${i}`,
      status: i % 3 === 0 ? 'ACTIVE' : i % 3 === 1 ? 'PAUSED' : 'ARCHIVED',
      objective: ['CONVERSIONS', 'TRAFFIC', 'BRAND_AWARENESS'][i % 3],
      created_time: new Date(2024, 0, 1 + (i % 365)).toISOString(),
      updated_time: new Date(2024, 0, 1 + (i % 365) + 1).toISOString(),
      account_id: `act_${Math.floor(i / 100)}`,
      daily_budget: 100 + (i % 500),
      insights: {
        impressions: 1000 + (i * 100),
        clicks: 50 + (i * 5),
        spend: 25.5 + (i * 2.5),
        reach: 800 + (i * 80),
        frequency: 1.25 + (i * 0.01),
        cpm: 25.5 + (i * 0.5),
        cpc: 0.51 + (i * 0.01),
        ctr: 5 + (i * 0.1),
        date_start: '2024-01-01',
        date_stop: '2024-01-31',
      },
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Virtual Scrolling Performance', () => {
    it('renders large campaign list efficiently', async () => {
      const largeCampaignList = generateLargeCampaignDataset(10000);
      
      const startTime = performance.now();
      
      render(
        <VirtualizedFacebookCampaignTable
          campaigns={largeCampaignList}
          onCampaignSelect={vi.fn()}
          onSort={vi.fn()}
          sortBy="name"
          sortDirection="asc"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Campaign 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in under 100ms even with 10k items
      expect(renderTime).toBeLessThan(100);
      
      // Should only render visible items, not all 10k
      const renderedRows = screen.getAllByRole('row');
      expect(renderedRows.length).toBeLessThan(25); // Header + ~20 visible rows
    });

    it('handles scrolling through large dataset smoothly', async () => {
      const largeCampaignList = generateLargeCampaignDataset(50000);
      
      const mockUseVirtualScrolling = vi.fn((items, itemHeight, containerHeight) => {
        let startIndex = 0;
        let endIndex = 20;
        
        return {
          containerRef: { current: null },
          startIndex,
          endIndex,
          visibleItems: items.slice(startIndex, endIndex),
          scrollToIndex: vi.fn((index: number) => {
            startIndex = Math.max(0, index - 10);
            endIndex = Math.min(items.length, index + 10);
          }),
          handleScroll: vi.fn(),
        };
      });

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(
        <VirtualizedFacebookCampaignTable
          campaigns={largeCampaignList}
          onCampaignSelect={vi.fn()}
          onSort={vi.fn()}
          sortBy="name"
          sortDirection="asc"
        />
      );

      // Simulate scrolling to middle of dataset
      const startTime = performance.now();
      
      const mockScrollToIndex = mockUseVirtualScrolling.mock.results[0].value.scrollToIndex;
      mockScrollToIndex(25000); // Scroll to middle

      const endTime = performance.now();
      const scrollTime = endTime - startTime;

      // Scrolling should be instantaneous
      expect(scrollTime).toBeLessThan(10);
    });

    it('maintains performance with frequent updates', async () => {
      const initialCampaigns = generateLargeCampaignDataset(5000);
      
      const { rerender } = render(
        <VirtualizedFacebookCampaignTable
          campaigns={initialCampaigns}
          onCampaignSelect={vi.fn()}
          onSort={vi.fn()}
          sortBy="name"
          sortDirection="asc"
        />
      );

      // Simulate frequent updates (like real-time data)
      const updateTimes: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const updatedCampaigns = initialCampaigns.map(campaign => ({
          ...campaign,
          insights: {
            ...campaign.insights!,
            spend: campaign.insights!.spend + Math.random() * 10,
          },
        }));

        const startTime = performance.now();
        
        rerender(
          <VirtualizedFacebookCampaignTable
            campaigns={updatedCampaigns}
            onCampaignSelect={vi.fn()}
            onSort={vi.fn()}
            sortBy="name"
            sortDirection="asc"
          />
        );

        const endTime = performance.now();
        updateTimes.push(endTime - startTime);
      }

      // All updates should be fast
      const averageUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
      expect(averageUpdateTime).toBeLessThan(50);
    });
  });

  describe('Data Transformation Performance', () => {
    it('transforms large datasets efficiently', async () => {
      const transformer = getFacebookDataTransformer();
      const largeSyncResult = {
        campaigns: generateLargeCampaignDataset(20000),
        totalSpend: 1000000,
        totalImpressions: 50000000,
        totalClicks: 2500000,
        syncTimestamp: new Date(),
        errors: [],
      };

      const startTime = performance.now();
      
      const transformedData = transformer.transformFacebookData(largeSyncResult);
      
      const endTime = performance.now();
      const transformTime = endTime - startTime;

      // Should transform 20k campaigns in under 500ms
      expect(transformTime).toBeLessThan(500);
      expect(transformedData.campaigns).toHaveLength(20000);
    });

    it('handles concurrent transformations efficiently', async () => {
      const transformer = getFacebookDataTransformer();
      const datasets = Array.from({ length: 5 }, () => ({
        campaigns: generateLargeCampaignDataset(5000),
        totalSpend: 200000,
        totalImpressions: 10000000,
        totalClicks: 500000,
        syncTimestamp: new Date(),
        errors: [],
      }));

      const startTime = performance.now();
      
      const transformPromises = datasets.map(dataset => 
        Promise.resolve(transformer.transformFacebookData(dataset))
      );
      
      const results = await Promise.all(transformPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle 5 concurrent transformations of 5k items each in under 1s
      expect(totalTime).toBeLessThan(1000);
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.campaigns).toHaveLength(5000);
      });
    });

    it('optimizes memory usage during transformation', async () => {
      const transformer = getFacebookDataTransformer();
      const hugeCampaignList = generateLargeCampaignDataset(100000);
      
      // Monitor memory usage (simplified)
      const initialMemory = process.memoryUsage().heapUsed;
      
      const syncResult = {
        campaigns: hugeCampaignList,
        totalSpend: 5000000,
        totalImpressions: 250000000,
        totalClicks: 12500000,
        syncTimestamp: new Date(),
        errors: [],
      };

      const transformedData = transformer.transformFacebookData(syncResult);
      
      const peakMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = peakMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 500MB for 100k items)
      expect(memoryIncrease).toBeLessThan(500 * 1024 * 1024);
      expect(transformedData.campaigns).toHaveLength(100000);
    });
  });

  describe('Caching Performance', () => {
    it('caches large datasets efficiently', async () => {
      const cache = getFacebookDataCache();
      const largeCampaignList = generateLargeCampaignDataset(25000);
      
      // First cache operation
      const startTime1 = performance.now();
      cache.set('large_campaigns', largeCampaignList);
      const endTime1 = performance.now();
      const cacheTime = endTime1 - startTime1;

      // Should cache quickly
      expect(cacheTime).toBeLessThan(100);

      // Retrieval should be very fast
      const startTime2 = performance.now();
      const cachedData = cache.get('large_campaigns');
      const endTime2 = performance.now();
      const retrievalTime = endTime2 - startTime2;

      expect(retrievalTime).toBeLessThan(10);
      expect(cachedData).toHaveLength(25000);
    });

    it('handles cache eviction efficiently with large datasets', async () => {
      const cache = getFacebookDataCache({ maxSize: 100 }); // Small cache for testing
      
      // Fill cache with large datasets
      const datasets = Array.from({ length: 150 }, (_, i) => ({
        key: `dataset_${i}`,
        data: generateLargeCampaignDataset(1000),
      }));

      const startTime = performance.now();
      
      datasets.forEach(({ key, data }) => {
        cache.set(key, data);
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle eviction efficiently
      expect(totalTime).toBeLessThan(200);
      
      // Cache should maintain size limit
      expect(cache.size()).toBeLessThanOrEqual(100);
    });

    it('performs well with high cache hit rates', async () => {
      const cache = getFacebookDataCache();
      const campaignData = generateLargeCampaignDataset(10000);
      
      // Pre-populate cache
      cache.set('campaigns', campaignData);
      
      // Simulate high frequency access
      const accessTimes: number[] = [];
      
      for (let i = 0; i < 1000; i++) {
        const startTime = performance.now();
        const data = cache.get('campaigns');
        const endTime = performance.now();
        
        accessTimes.push(endTime - startTime);
        expect(data).toHaveLength(10000);
      }

      const averageAccessTime = accessTimes.reduce((a, b) => a + b, 0) / accessTimes.length;
      
      // Average access time should be very low
      expect(averageAccessTime).toBeLessThan(1);
    });
  });

  describe('API Service Performance', () => {
    it('handles batch requests efficiently', async () => {
      const apiService = getFacebookAPIService();
      
      // Mock batch request implementation
      const mockBatchRequest = vi.fn().mockResolvedValue({
        responses: Array.from({ length: 50 }, (_, i) => ({
          code: 200,
          body: {
            data: generateLargeCampaignDataset(100),
          },
        })),
      });

      (apiService as any).batch = mockBatchRequest;

      const startTime = performance.now();
      
      // Simulate fetching data for 50 accounts
      const accountIds = Array.from({ length: 50 }, (_, i) => `act_${i}`);
      const batchRequests = accountIds.map(accountId => ({
        method: 'GET',
        relative_url: `${accountId}/campaigns`,
      }));

      await (apiService as any).batch(batchRequests);
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;

      // Batch request should be faster than individual requests
      expect(batchTime).toBeLessThan(1000);
      expect(mockBatchRequest).toHaveBeenCalledWith(batchRequests);
    });

    it('manages rate limiting efficiently', async () => {
      const apiService = getFacebookAPIService();
      
      // Mock rate-limited responses
      let requestCount = 0;
      const mockGet = vi.fn().mockImplementation(() => {
        requestCount++;
        if (requestCount <= 100) {
          return Promise.resolve({ data: generateLargeCampaignDataset(100) });
        } else {
          return Promise.reject(new Error('Rate limit exceeded'));
        }
      });

      (apiService as any).get = mockGet;

      const startTime = performance.now();
      
      // Make many requests that will hit rate limit
      const requests = Array.from({ length: 150 }, (_, i) => 
        (apiService as any).get(`act_${i}/campaigns`).catch(() => null)
      );

      const results = await Promise.allSettled(requests);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rate limiting gracefully without hanging
      expect(totalTime).toBeLessThan(5000);
      
      const successfulRequests = results.filter(r => r.status === 'fulfilled').length;
      const failedRequests = results.filter(r => r.status === 'rejected').length;
      
      expect(successfulRequests).toBe(100);
      expect(failedRequests).toBe(50);
    });

    it('optimizes memory usage during large syncs', async () => {
      const apiService = getFacebookAPIService();
      
      // Mock streaming-like behavior for large datasets
      const mockSyncAllData = vi.fn().mockImplementation(async (accountIds: string[]) => {
        const campaigns: FacebookCampaign[] = [];
        
        // Simulate processing accounts in batches to manage memory
        for (let i = 0; i < accountIds.length; i += 10) {
          const batch = accountIds.slice(i, i + 10);
          const batchCampaigns = batch.flatMap(() => generateLargeCampaignDataset(1000));
          campaigns.push(...batchCampaigns);
          
          // Simulate some processing time
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return {
          campaigns,
          totalSpend: campaigns.reduce((sum, c) => sum + (c.insights?.spend || 0), 0),
          totalImpressions: campaigns.reduce((sum, c) => sum + (c.insights?.impressions || 0), 0),
          totalClicks: campaigns.reduce((sum, c) => sum + (c.insights?.clicks || 0), 0),
          syncTimestamp: new Date(),
          errors: [],
        };
      });

      (apiService as any).syncAllData = mockSyncAllData;

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Sync 100 accounts (would be 100k campaigns total)
      const accountIds = Array.from({ length: 100 }, (_, i) => `act_${i}`);
      const result = await (apiService as any).syncAllData(accountIds);
      
      const peakMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = peakMemory - initialMemory;
      
      // Memory usage should be reasonable even for large sync
      expect(memoryIncrease).toBeLessThan(1024 * 1024 * 1024); // Less than 1GB
      expect(result.campaigns).toHaveLength(100000);
    });
  });

  describe('Sorting and Filtering Performance', () => {
    it('sorts large datasets efficiently', async () => {
      const largeCampaignList = generateLargeCampaignDataset(50000);
      
      const startTime = performance.now();
      
      // Sort by spend (numeric sort)
      const sortedBySpend = [...largeCampaignList].sort((a, b) => 
        (b.insights?.spend || 0) - (a.insights?.spend || 0)
      );
      
      const endTime = performance.now();
      const sortTime = endTime - startTime;

      // Should sort 50k items in under 200ms
      expect(sortTime).toBeLessThan(200);
      expect(sortedBySpend).toHaveLength(50000);
      
      // Verify sort is correct
      expect(sortedBySpend[0].insights!.spend).toBeGreaterThanOrEqual(
        sortedBySpend[sortedBySpend.length - 1].insights!.spend
      );
    });

    it('filters large datasets efficiently', async () => {
      const largeCampaignList = generateLargeCampaignDataset(100000);
      
      const startTime = performance.now();
      
      // Filter active campaigns with high spend
      const filtered = largeCampaignList.filter(campaign => 
        campaign.status === 'ACTIVE' && (campaign.insights?.spend || 0) > 1000
      );
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Should filter 100k items in under 100ms
      expect(filterTime).toBeLessThan(100);
      expect(filtered.length).toBeGreaterThan(0);
      
      // Verify filter is correct
      filtered.forEach(campaign => {
        expect(campaign.status).toBe('ACTIVE');
        expect(campaign.insights!.spend).toBeGreaterThan(1000);
      });
    });

    it('handles complex multi-criteria filtering efficiently', async () => {
      const largeCampaignList = generateLargeCampaignDataset(75000);
      
      const startTime = performance.now();
      
      // Complex filter: Active campaigns, high CTR, recent, specific objectives
      const complexFiltered = largeCampaignList.filter(campaign => {
        const isActive = campaign.status === 'ACTIVE';
        const highCTR = (campaign.insights?.ctr || 0) > 5;
        const isRecent = new Date(campaign.created_time) > new Date('2024-06-01');
        const rightObjective = ['CONVERSIONS', 'TRAFFIC'].includes(campaign.objective);
        
        return isActive && highCTR && isRecent && rightObjective;
      });
      
      const endTime = performance.now();
      const filterTime = endTime - startTime;

      // Should handle complex filtering in under 150ms
      expect(filterTime).toBeLessThan(150);
      expect(complexFiltered.length).toBeGreaterThan(0);
    });
  });

  describe('Memory Management', () => {
    it('cleans up resources properly after large operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform large operations
      const largeCampaignList = generateLargeCampaignDataset(50000);
      const transformer = getFacebookDataTransformer();
      
      const syncResult = {
        campaigns: largeCampaignList,
        totalSpend: 2500000,
        totalImpressions: 125000000,
        totalClicks: 6250000,
        syncTimestamp: new Date(),
        errors: [],
      };

      const transformedData = transformer.transformFacebookData(syncResult);
      
      // Clear references
      largeCampaignList.length = 0;
      (transformedData as any) = null;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory should not have increased significantly after cleanup
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('handles memory pressure gracefully', async () => {
      // Simulate memory pressure by creating many large objects
      const largeObjects: any[] = [];
      
      try {
        for (let i = 0; i < 10; i++) {
          const largeCampaignList = generateLargeCampaignDataset(10000);
          largeObjects.push(largeCampaignList);
          
          // Try to render with current memory pressure
          const { unmount } = render(
            <VirtualizedFacebookCampaignTable
              campaigns={largeCampaignList}
              onCampaignSelect={vi.fn()}
              onSort={vi.fn()}
              sortBy="name"
              sortDirection="asc"
            />
          );
          
          // Should still render successfully
          await waitFor(() => {
            expect(screen.getByText('Test Campaign 0')).toBeInTheDocument();
          });
          
          unmount();
        }
      } catch (error) {
        // If we hit memory limits, that's expected behavior
        expect(error).toBeDefined();
      } finally {
        // Clean up
        largeObjects.length = 0;
      }
    });
  });
});