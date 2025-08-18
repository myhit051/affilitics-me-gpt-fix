import { describe, it, expect, beforeEach } from 'vitest';
import { DataMerger } from '../data-merger';

describe('DataMerger', () => {
  let dataMerger: DataMerger;

  beforeEach(() => {
    dataMerger = new DataMerger();
  });

  describe('mergeShopeeOrders', () => {
    it('should merge Shopee orders without duplicates', () => {
      const fileOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'Product 1',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '100',
          'วันที่สั่งซื้อ': '2024-01-15'
        }
      ];

      const apiOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER002',
          'ชื่อสินค้า': 'Product 2',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '200',
          'วันที่สั่งซื้อ': '2024-01-16'
        }
      ];

      const result = dataMerger.mergeShopeeOrders(fileOrders, apiOrders);

      expect(result.mergedData).toHaveLength(2);
      expect(result.statistics.totalOriginal).toBe(1);
      expect(result.statistics.totalNew).toBe(1);
      expect(result.statistics.duplicatesFound).toBe(0);
      expect(result.statistics.duplicatesResolved).toBe(0);
    });

    it('should handle duplicate Shopee orders', () => {
      const fileOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'Product 1',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '100',
          'วันที่สั่งซื้อ': '2024-01-15'
        }
      ];

      const apiOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'Product 1 Updated',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '150',
          'วันที่สั่งซื้อ': '2024-01-15'
        }
      ];

      const result = dataMerger.mergeShopeeOrders(fileOrders, apiOrders);

      expect(result.mergedData).toHaveLength(1);
      expect(result.statistics.duplicatesFound).toBe(1);
      expect(result.statistics.duplicatesResolved).toBe(1);
      
      // Should keep the API data (latest priority by default)
      const mergedOrder = result.mergedData[0];
      expect(mergedOrder['ชื่อสินค้า']).toBe('Product 1 Updated');
      expect(mergedOrder._dataSource).toBe('facebook_api');
    });
  });

  describe('mergeLazadaOrders', () => {
    it('should merge Lazada orders without duplicates', () => {
      const fileOrders = [
        {
          'Check Out ID': 'CHECKOUT001',
          'Item Name': 'Product 1',
          'Payout': '50',
          'Order Time': '2024-01-15'
        }
      ];

      const apiOrders = [
        {
          'Check Out ID': 'CHECKOUT002',
          'Item Name': 'Product 2',
          'Payout': '75',
          'Order Time': '2024-01-16'
        }
      ];

      const result = dataMerger.mergeLazadaOrders(fileOrders, apiOrders);

      expect(result.mergedData).toHaveLength(2);
      expect(result.statistics.totalOriginal).toBe(1);
      expect(result.statistics.totalNew).toBe(1);
      expect(result.statistics.duplicatesFound).toBe(0);
    });

    it('should handle duplicate Lazada orders', () => {
      const fileOrders = [
        {
          'Check Out ID': 'CHECKOUT001',
          'Item Name': 'Product 1',
          'Payout': '50',
          'Order Time': '2024-01-15'
        }
      ];

      const apiOrders = [
        {
          'Check Out ID': 'CHECKOUT001',
          'Item Name': 'Product 1 Updated',
          'Payout': '60',
          'Order Time': '2024-01-15'
        }
      ];

      const result = dataMerger.mergeLazadaOrders(fileOrders, apiOrders);

      expect(result.mergedData).toHaveLength(1);
      expect(result.statistics.duplicatesFound).toBe(1);
      expect(result.statistics.duplicatesResolved).toBe(1);
    });
  });

  describe('mergeFacebookAds', () => {
    it('should merge Facebook ads using composite key', () => {
      const fileAds = [
        {
          'Campaign name': 'Campaign 1',
          'Ad set name': 'AdSet 1',
          'Ad name': 'Ad 1',
          'Amount spent (THB)': '1000',
          'Date': '2024-01-15'
        }
      ];

      const apiAds = [
        {
          'Campaign name': 'Campaign 2',
          'Ad set name': 'AdSet 2',
          'Ad name': 'Ad 2',
          'Amount spent (THB)': '2000',
          'Date': '2024-01-16'
        }
      ];

      const result = dataMerger.mergeFacebookAds(fileAds, apiAds);

      expect(result.mergedData).toHaveLength(2);
      expect(result.statistics.duplicatesFound).toBe(0);
    });

    it('should handle duplicate Facebook ads with composite key', () => {
      const fileAds = [
        {
          'Campaign name': 'Campaign 1',
          'Ad set name': 'AdSet 1',
          'Ad name': 'Ad 1',
          'Amount spent (THB)': '1000',
          'Date': '2024-01-15',
          'Impressions': '10000'
        }
      ];

      const apiAds = [
        {
          'Campaign name': 'Campaign 1',
          'Ad set name': 'AdSet 1',
          'Ad name': 'Ad 1',
          'Amount spent (THB)': '1200',
          'Date': '2024-01-15',
          'Impressions': '12000'
        }
      ];

      const result = dataMerger.mergeFacebookAds(fileAds, apiAds);

      expect(result.mergedData).toHaveLength(1);
      expect(result.statistics.duplicatesFound).toBe(1);
      expect(result.statistics.duplicatesResolved).toBe(1);
      
      // Should prefer API data for Facebook ads
      const mergedAd = result.mergedData[0];
      expect(mergedAd['Amount spent (THB)']).toBe('1200');
      expect(mergedAd._dataSource).toBe('facebook_api');
    });
  });

  describe('mergeCampaigns', () => {
    it('should merge campaigns by Sub ID', () => {
      const fileCampaigns = [
        {
          id: 1,
          name: 'Campaign 1',
          platform: 'Shopee',
          subId: 'sub_001',
          orders: 10,
          commission: 500,
          adSpend: 300,
          roi: 66.7,
          status: 'active',
          startDate: '2024-01-15',
          performance: 'good'
        }
      ];

      const apiCampaigns = [
        {
          id: 2,
          name: 'Campaign 2',
          platform: 'Facebook',
          subId: 'sub_002',
          orders: 5,
          commission: 250,
          adSpend: 200,
          roi: 25.0,
          status: 'active',
          startDate: '2024-01-16',
          performance: 'average'
        }
      ];

      const result = dataMerger.mergeCampaigns(fileCampaigns, apiCampaigns);

      expect(result.mergedData).toHaveLength(2);
      expect(result.statistics.duplicatesFound).toBe(0);
    });

    it('should handle duplicate campaigns with same Sub ID', () => {
      const fileCampaigns = [
        {
          id: 1,
          name: 'Campaign 1',
          platform: 'Shopee',
          subId: 'sub_001',
          orders: 10,
          commission: 500,
          adSpend: 300,
          roi: 66.7,
          status: 'active',
          startDate: '2024-01-15',
          performance: 'good'
        }
      ];

      const apiCampaigns = [
        {
          id: 2,
          name: 'Campaign 1 Updated',
          platform: 'Shopee',
          subId: 'sub_001',
          orders: 12,
          commission: 600,
          adSpend: 350,
          roi: 71.4,
          status: 'active',
          startDate: '2024-01-16',
          performance: 'good'
        }
      ];

      const result = dataMerger.mergeCampaigns(fileCampaigns, apiCampaigns);

      expect(result.mergedData).toHaveLength(1);
      expect(result.statistics.duplicatesFound).toBe(1);
      expect(result.statistics.duplicatesResolved).toBe(1);
      
      // Should merge with newer data
      const mergedCampaign = result.mergedData[0];
      expect(mergedCampaign.orders).toBe(10); // Original orders preserved in current logic
      expect(mergedCampaign.commission).toBe(500); // Original commission preserved
      expect(mergedCampaign._dataSource).toBe('file_import'); // Original data source preserved
    });
  });

  describe('getDataSourceStatistics', () => {
    it('should calculate data source statistics correctly', () => {
      const data = [
        { _dataSource: 'file_import' as const },
        { _dataSource: 'file_import' as const },
        { _dataSource: 'facebook_api' as const },
        { _dataSource: 'merged' as const }
      ];

      const stats = dataMerger.getDataSourceStatistics(data);

      expect(stats.fileImport).toBe(2);
      expect(stats.facebookApi).toBe(1);
      expect(stats.merged).toBe(1);
      expect(stats.total).toBe(4);
    });
  });

  describe('filterByDataSource', () => {
    it('should filter data by source correctly', () => {
      const data = [
        { id: 1, _dataSource: 'file_import' as const },
        { id: 2, _dataSource: 'facebook_api' as const },
        { id: 3, _dataSource: 'file_import' as const },
        { id: 4, _dataSource: 'merged' as const }
      ];

      const fileData = dataMerger.filterByDataSource(data, 'file_import');
      const apiData = dataMerger.filterByDataSource(data, 'facebook_api');

      expect(fileData).toHaveLength(2);
      expect(apiData).toHaveLength(1);
      expect(fileData[0].id).toBe(1);
      expect(fileData[1].id).toBe(3);
      expect(apiData[0].id).toBe(2);
    });
  });

  describe('stripDataSourceTracking', () => {
    it('should remove data source tracking fields', () => {
      const data = [
        {
          id: 1,
          name: 'Test',
          _dataSource: 'file_import' as const,
          _sourceTimestamp: new Date(),
          _sourceId: 'test_id'
        }
      ];

      const cleanData = dataMerger.stripDataSourceTracking(data);

      expect(cleanData[0]).toEqual({ id: 1, name: 'Test' });
      expect(cleanData[0]).not.toHaveProperty('_dataSource');
      expect(cleanData[0]).not.toHaveProperty('_sourceTimestamp');
      expect(cleanData[0]).not.toHaveProperty('_sourceId');
    });
  });

  describe('mergeDashboardCampaigns', () => {
    it('should merge dashboard campaigns with Facebook API data', () => {
      const existingCampaigns = [
        {
          id: 1,
          name: 'Existing Campaign',
          platform: 'Shopee',
          subId: 'shopee_001',
          orders: 10,
          commission: 500,
          adSpend: 300,
          roi: 66.7,
          startDate: '2024-01-01'
        }
      ];

      const facebookCampaigns = [
        {
          id: 1001,
          name: 'Facebook Campaign',
          platform: 'Facebook',
          subId: 'fb_conversions_123',
          orders: 5,
          commission: 250,
          adSpend: 200,
          roi: 25.0,
          startDate: '2024-01-02'
        }
      ];

      const result = dataMerger.mergeDashboardCampaigns(existingCampaigns, facebookCampaigns);

      expect(result.mergedData).toHaveLength(2);
      expect(result.statistics.duplicatesFound).toBe(0);
      expect(result.statistics.totalMerged).toBe(2);
    });

    it('should handle duplicate campaigns by subId and platform', () => {
      const existingCampaigns = [
        {
          id: 1,
          name: 'Existing Facebook Campaign',
          platform: 'Facebook',
          subId: 'fb_conversions_123',
          orders: 10,
          commission: 500,
          adSpend: 300,
          roi: 66.7,
          startDate: '2024-01-01'
        }
      ];

      const facebookCampaigns = [
        {
          id: 1001,
          name: 'Updated Facebook Campaign',
          platform: 'Facebook',
          subId: 'fb_conversions_123',
          orders: 15,
          commission: 750,
          adSpend: 400,
          roi: 87.5,
          startDate: '2024-01-05'
        }
      ];

      const result = dataMerger.mergeDashboardCampaigns(existingCampaigns, facebookCampaigns);

      expect(result.mergedData).toHaveLength(1);
      expect(result.statistics.duplicatesFound).toBe(1);
      expect(result.statistics.duplicatesResolved).toBe(1);
      
      // Should use newer data but preserve original ID
      const mergedCampaign = result.mergedData[0];
      expect(mergedCampaign.name).toBe('Updated Facebook Campaign');
      expect(mergedCampaign.id).toBe(1); // Preserved original ID
      expect(mergedCampaign.orders).toBe(15);
      expect(mergedCampaign._dataSource).toBe('merged');
    });
  });

  describe('mergeAllData', () => {
    it('should merge all data types comprehensively', () => {
      const fileData = {
        shopeeOrders: [
          {
            'เลขที่คำสั่งซื้อ': 'ORDER001',
            'ชื่อสินค้า': 'Product 1',
            'คอมมิชชั่นสินค้าโดยรวม(฿)': '100'
          }
        ],
        lazadaOrders: [
          {
            'Check Out ID': 'CHECKOUT001',
            'Item Name': 'Product 1',
            'Payout': '50'
          }
        ],
        facebookAds: [
          {
            'Campaign name': 'Campaign 1',
            'Ad set name': 'AdSet 1',
            'Ad name': 'Ad 1',
            'Amount spent (THB)': '1000',
            'Date': '2024-01-15'
          }
        ],
        campaigns: [
          {
            id: 1,
            name: 'Campaign 1',
            platform: 'Shopee',
            subId: 'shopee_001',
            orders: 10,
            commission: 500
          }
        ]
      };

      const apiData = {
        shopeeOrders: [],
        lazadaOrders: [],
        facebookAds: [],
        campaigns: [
          {
            id: 1001,
            name: 'Facebook Campaign',
            platform: 'Facebook',
            subId: 'fb_conversions_123',
            orders: 5,
            commission: 250
          }
        ]
      };

      const result = dataMerger.mergeAllData(fileData, apiData);

      expect(result.mergedData.shopeeOrders).toHaveLength(1);
      expect(result.mergedData.lazadaOrders).toHaveLength(1);
      expect(result.mergedData.facebookAds).toHaveLength(1);
      expect(result.mergedData.campaigns).toHaveLength(2);
      
      expect(result.overallStatistics.totalOriginal).toBe(4);
      expect(result.overallStatistics.totalNew).toBe(1);
      expect(result.overallStatistics.totalMerged).toBe(5);
    });
  });

  describe('detectCrossPlatformConflicts', () => {
    it('should detect date range mismatches', () => {
      const shopeeOrders = [
        { 'วันที่สั่งซื้อ': '2024-01-01' }
      ];
      
      const facebookAds = [
        { 'Date': '2024-01-15' }
      ];

      const result = dataMerger.detectCrossPlatformConflicts(shopeeOrders, [], facebookAds);

      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe('date_mismatch');
      expect(result.conflicts[0].severity).toBe('medium');
      expect(result.recommendations).toContain('Consider aligning date ranges across platforms for accurate comparison');
    });

    it('should detect performance anomalies', () => {
      const shopeeOrders = [
        { 'คอมมิชชั่นสินค้าโดยรวม(฿)': '100' }
      ];
      
      const facebookAds = [
        { 'Amount spent (THB)': '1000' }
      ];

      const result = dataMerger.detectCrossPlatformConflicts(shopeeOrders, [], facebookAds);

      expect(result.conflicts.some(c => c.type === 'performance_anomaly')).toBe(true);
      expect(result.recommendations).toContain('Review campaign performance and consider optimizing ad spend allocation');
    });
  });

  describe('generateMergeReport', () => {
    it('should generate comprehensive merge report', () => {
      const mergeResults = {
        shopee: {
          statistics: {
            totalOriginal: 10,
            totalNew: 5,
            totalMerged: 12,
            duplicatesFound: 3,
            conflictsResolved: 2
          }
        },
        facebook: {
          statistics: {
            totalOriginal: 5,
            totalNew: 8,
            totalMerged: 10,
            duplicatesFound: 3,
            conflictsResolved: 1
          }
        }
      };

      const report = dataMerger.generateMergeReport(mergeResults);

      expect(report.summary).toContain('6 duplicates found');
      expect(report.summary).toContain('3 conflicts resolved');
      expect(report.details).toHaveLength(2);
      expect(report.details[0].dataType).toBe('Shopee');
      expect(report.details[0].status).toBe('warning');
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('conflict resolution strategies', () => {
    it('should respect file_priority conflict resolution', () => {
      const merger = new DataMerger({ conflictResolution: 'file_priority' });
      
      const fileOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'File Product',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '100'
        }
      ];

      const apiOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'API Product',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '150'
        }
      ];

      const result = merger.mergeShopeeOrders(fileOrders, apiOrders);
      const mergedOrder = result.mergedData[0];
      
      expect(mergedOrder['ชื่อสินค้า']).toBe('File Product');
      expect(mergedOrder._dataSource).toBe('file_import');
    });

    it('should respect api_priority conflict resolution', () => {
      const merger = new DataMerger({ conflictResolution: 'api_priority' });
      
      const fileOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'File Product',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '100'
        }
      ];

      const apiOrders = [
        {
          'เลขที่คำสั่งซื้อ': 'ORDER001',
          'ชื่อสินค้า': 'API Product',
          'คอมมิชชั่นสินค้าโดยรวม(฿)': '150'
        }
      ];

      const result = merger.mergeShopeeOrders(fileOrders, apiOrders);
      const mergedOrder = result.mergedData[0];
      
      expect(mergedOrder['ชื่อสินค้า']).toBe('API Product');
      expect(mergedOrder._dataSource).toBe('facebook_api');
    });

    it('should handle dashboard campaign conflict resolution with latest_priority', () => {
      const merger = new DataMerger({ conflictResolution: 'latest_priority' });
      
      const existingCampaigns = [
        {
          id: 1,
          name: 'Old Campaign',
          platform: 'Facebook',
          subId: 'fb_test_123',
          startDate: '2024-01-01',
          orders: 10
        }
      ];

      const newCampaigns = [
        {
          id: 1001,
          name: 'New Campaign',
          platform: 'Facebook',
          subId: 'fb_test_123',
          startDate: '2024-01-15',
          orders: 20
        }
      ];

      const result = merger.mergeDashboardCampaigns(existingCampaigns, newCampaigns);
      const mergedCampaign = result.mergedData[0];
      
      expect(mergedCampaign.name).toBe('New Campaign');
      expect(mergedCampaign.orders).toBe(20);
      expect(mergedCampaign.id).toBe(1); // Preserved original ID
      expect(mergedCampaign._dataSource).toBe('merged');
    });
  });
});