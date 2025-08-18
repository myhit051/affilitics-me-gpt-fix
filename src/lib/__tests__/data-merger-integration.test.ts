import { describe, it, expect, beforeEach } from 'vitest';
import { DataMerger } from '../data-merger';
import { facebookDataTransformer } from '../facebook-data-transformer';
import { FacebookSyncResult, FacebookCampaign, FacebookInsights } from '@/types/facebook';

describe('DataMerger Integration Tests', () => {
  let dataMerger: DataMerger;
  let mockFacebookSyncResult: FacebookSyncResult;

  beforeEach(() => {
    dataMerger = new DataMerger();
    
    const mockInsights: FacebookInsights = {
      impressions: 10000,
      clicks: 500,
      spend: 1000,
      reach: 8000,
      frequency: 1.25,
      cpm: 10.5,
      cpc: 2.0,
      ctr: 5.0,
      date_start: '2024-01-01',
      date_stop: '2024-01-31'
    };

    const mockCampaign: FacebookCampaign = {
      id: '123456789',
      name: 'Test Campaign',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      created_time: '2024-01-01T10:00:00Z',
      updated_time: '2024-01-15T15:30:00Z',
      account_id: '987654321',
      daily_budget: 100,
      insights: mockInsights
    };

    mockFacebookSyncResult = {
      campaigns: [mockCampaign],
      totalSpend: 1000,
      totalImpressions: 10000,
      totalClicks: 500,
      syncTimestamp: new Date('2024-01-31T12:00:00Z'),
      errors: []
    };
  });

  describe('End-to-end data merging workflow', () => {
    it('should handle complete Facebook API integration workflow', () => {
      // Step 1: Transform Facebook API data
      const transformedData = facebookDataTransformer.transformFacebookData(mockFacebookSyncResult);
      expect(transformedData.campaigns).toHaveLength(1);

      // Step 2: Simulate existing file data
      const existingFileData = {
        shopeeOrders: [
          {
            'เลขที่คำสั่งซื้อ': 'ORDER001',
            'ชื่อสินค้า': 'Product 1',
            'คอมมิชชั่นสินค้าโดยรวม(฿)': '100',
            'วันที่สั่งซื้อ': '2024-01-15'
          }
        ],
        lazadaOrders: [
          {
            'Check Out ID': 'CHECKOUT001',
            'Item Name': 'Product 1',
            'Payout': '50',
            'Order Time': '2024-01-15'
          }
        ],
        facebookAds: [
          {
            'Campaign name': 'Old Campaign',
            'Ad set name': 'AdSet 1',
            'Ad name': 'Ad 1',
            'Amount spent (THB)': '800',
            'Date': '2024-01-10'
          }
        ],
        campaigns: transformedData.campaigns
      };

      // Step 3: Simulate new Facebook API data
      const newFacebookData = {
        shopeeOrders: [],
        lazadaOrders: [],
        facebookAds: [
          {
            'Campaign name': 'New Campaign',
            'Ad set name': 'AdSet 2',
            'Ad name': 'Ad 2',
            'Amount spent (THB)': '1200',
            'Date': '2024-01-20'
          }
        ],
        campaigns: []
      };

      // Step 4: Perform comprehensive merge
      const mergeResult = dataMerger.mergeAllData(existingFileData, newFacebookData);

      // Verify merge results
      expect(mergeResult.mergedData.shopeeOrders).toHaveLength(1);
      expect(mergeResult.mergedData.lazadaOrders).toHaveLength(1);
      expect(mergeResult.mergedData.facebookAds).toHaveLength(2); // Old + New
      expect(mergeResult.mergedData.campaigns).toHaveLength(1);

      // Verify overall statistics
      expect(mergeResult.overallStatistics.totalOriginal).toBe(4);
      expect(mergeResult.overallStatistics.totalNew).toBe(1);
      expect(mergeResult.overallStatistics.totalMerged).toBe(5);

      // Step 5: Detect cross-platform conflicts
      const conflictAnalysis = dataMerger.detectCrossPlatformConflicts(
        mergeResult.mergedData.shopeeOrders,
        mergeResult.mergedData.lazadaOrders,
        mergeResult.mergedData.facebookAds
      );

      expect(conflictAnalysis.conflicts).toBeDefined();
      expect(conflictAnalysis.recommendations).toBeDefined();

      // Step 6: Generate merge report
      const mergeReport = dataMerger.generateMergeReport(mergeResult.mergeResults);

      expect(mergeReport.summary).toContain('successfully');
      expect(mergeReport.details).toHaveLength(4); // shopee, lazada, facebook, campaigns
      expect(mergeReport.recommendations).toBeDefined();
    });

    it('should handle data deduplication across platforms', () => {
      const fileData = {
        shopeeOrders: [
          {
            'เลขที่คำสั่งซื้อ': 'ORDER001',
            'ชื่อสินค้า': 'Product 1',
            'คอมมิชชั่นสินค้าโดยรวม(฿)': '100'
          }
        ],
        lazadaOrders: [],
        facebookAds: [],
        campaigns: []
      };

      const apiData = {
        shopeeOrders: [
          {
            'เลขที่คำสั่งซื้อ': 'ORDER001', // Same order ID
            'ชื่อสินค้า': 'Product 1 Updated',
            'คอมมิชชั่นสินค้าโดยรวม(฿)': '120'
          }
        ],
        lazadaOrders: [],
        facebookAds: [],
        campaigns: []
      };

      const result = dataMerger.mergeAllData(fileData, apiData);

      // Should have only 1 order after deduplication
      expect(result.mergedData.shopeeOrders).toHaveLength(1);
      expect(result.mergeResults.shopee.statistics.duplicatesFound).toBe(1);
      expect(result.mergeResults.shopee.statistics.duplicatesResolved).toBe(1);

      // Should use API data (latest priority by default)
      const mergedOrder = result.mergedData.shopeeOrders[0];
      expect(mergedOrder['ชื่อสินค้า']).toBe('Product 1 Updated');
    });

    it('should detect performance anomalies in cross-platform data', () => {
      const shopeeOrders = [
        { 'คอมมิชชั่นสินค้าโดยรวม(฿)': '50' } // Low commission
      ];
      
      const facebookAds = [
        { 'Amount spent (THB)': '2000' } // High spend
      ];

      const conflictAnalysis = dataMerger.detectCrossPlatformConflicts(
        shopeeOrders,
        [],
        facebookAds
      );

      // Should detect performance anomaly (very low ROI)
      const performanceConflict = conflictAnalysis.conflicts.find(
        c => c.type === 'performance_anomaly'
      );
      
      expect(performanceConflict).toBeDefined();
      expect(performanceConflict?.severity).toBe('high');
      expect(conflictAnalysis.recommendations).toContain(
        'Review campaign performance and consider optimizing ad spend allocation'
      );
    });

    it('should handle different conflict resolution strategies', () => {
      const strategies = ['file_priority', 'api_priority', 'latest_priority'] as const;

      strategies.forEach(strategy => {
        const merger = new DataMerger({ conflictResolution: strategy });
        
        const existingCampaigns = [
          {
            id: 1,
            name: 'File Campaign',
            platform: 'Facebook',
            subId: 'fb_test_123',
            startDate: '2024-01-01',
            orders: 10,
            _dataSource: 'file_import',
            _sourceTimestamp: new Date('2024-01-01')
          }
        ];

        const newCampaigns = [
          {
            id: 1001,
            name: 'API Campaign',
            platform: 'Facebook',
            subId: 'fb_test_123',
            startDate: '2024-01-15',
            orders: 20,
            _dataSource: 'facebook_api',
            _sourceTimestamp: new Date('2024-01-15')
          }
        ];

        const result = merger.mergeDashboardCampaigns(existingCampaigns, newCampaigns);
        const mergedCampaign = result.mergedData[0];

        switch (strategy) {
          case 'file_priority':
            expect(mergedCampaign.name).toBe('File Campaign');
            break;
          case 'api_priority':
            expect(mergedCampaign.name).toBe('API Campaign');
            break;
          case 'latest_priority':
            expect(mergedCampaign.name).toBe('API Campaign'); // Newer date
            expect(mergedCampaign._dataSource).toBe('merged');
            break;
        }
      });
    });

    it('should generate comprehensive merge statistics', () => {
      const fileData = {
        shopeeOrders: [{ 'เลขที่คำสั่งซื้อ': 'ORDER001' }],
        lazadaOrders: [{ 'Check Out ID': 'CHECKOUT001' }],
        facebookAds: [{ 'Campaign name': 'Campaign1', 'Ad set name': 'AdSet1', 'Ad name': 'Ad1', 'Date': '2024-01-01' }],
        campaigns: [{ id: 1, subId: 'sub_001', platform: 'Shopee' }]
      };

      const apiData = {
        shopeeOrders: [{ 'เลขที่คำสั่งซื้อ': 'ORDER002' }],
        lazadaOrders: [],
        facebookAds: [{ 'Campaign name': 'Campaign2', 'Ad set name': 'AdSet2', 'Ad name': 'Ad2', 'Date': '2024-01-02' }],
        campaigns: [{ id: 1001, subId: 'sub_002', platform: 'Facebook' }]
      };

      const result = dataMerger.mergeAllData(fileData, apiData);

      // Verify overall statistics
      expect(result.overallStatistics.totalOriginal).toBe(4);
      expect(result.overallStatistics.totalNew).toBe(3);
      expect(result.overallStatistics.totalMerged).toBe(7);
      expect(result.overallStatistics.totalDuplicatesFound).toBe(0);

      // Verify individual merge results
      expect(result.mergeResults.shopee.statistics.totalMerged).toBe(2);
      expect(result.mergeResults.lazada.statistics.totalMerged).toBe(1);
      expect(result.mergeResults.facebook.statistics.totalMerged).toBe(2);
      expect(result.mergeResults.campaigns.statistics.totalMerged).toBe(2);

      // Generate and verify merge report
      const report = dataMerger.generateMergeReport(result.mergeResults);
      expect(report.details).toHaveLength(4);
      expect(report.details.every(d => d.status === 'success')).toBe(true);
    });
  });

  describe('Data source tracking', () => {
    it('should properly track data sources throughout merge process', () => {
      const fileData = {
        shopeeOrders: [{ 'เลขที่คำสั่งซื้อ': 'ORDER001' }],
        lazadaOrders: [],
        facebookAds: [],
        campaigns: []
      };

      const apiData = {
        shopeeOrders: [{ 'เลขที่คำสั่งซื้อ': 'ORDER002' }],
        lazadaOrders: [],
        facebookAds: [],
        campaigns: []
      };

      const result = dataMerger.mergeAllData(fileData, apiData);

      // Check data source tracking
      const shopeeData = result.mergedData.shopeeOrders;
      expect(shopeeData).toHaveLength(2);
      
      // Verify data source statistics
      const stats = dataMerger.getDataSourceStatistics(result.mergeResults.shopee.mergedData);
      expect(stats.fileImport).toBe(1);
      expect(stats.facebookApi).toBe(1);
      expect(stats.merged).toBe(0);
      expect(stats.total).toBe(2);

      // Test filtering by data source
      const fileOnlyData = dataMerger.filterByDataSource(
        result.mergeResults.shopee.mergedData,
        'file_import'
      );
      expect(fileOnlyData).toHaveLength(1);

      const apiOnlyData = dataMerger.filterByDataSource(
        result.mergeResults.shopee.mergedData,
        'facebook_api'
      );
      expect(apiOnlyData).toHaveLength(1);

      // Test stripping data source tracking
      const cleanData = dataMerger.stripDataSourceTracking(result.mergedData.shopeeOrders);
      expect(cleanData[0]).not.toHaveProperty('_dataSource');
      expect(cleanData[0]).not.toHaveProperty('_sourceTimestamp');
      expect(cleanData[0]).not.toHaveProperty('_sourceId');
    });
  });
});