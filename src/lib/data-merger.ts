import { TraditionalCampaign } from '@/utils/affiliateCalculations';

// Data source types
export type DataSource = 'file_import' | 'facebook_api' | 'merged';

// Enhanced interfaces with data source tracking
export interface EnhancedShopeeOrder {
  'เลขที่คำสั่งซื้อ': string;
  'รหัสสินค้า': string;
  'ชื่อสินค้า': string;
  'ราคาสินค้า(฿)': string;
  'คอมมิชชั่นสินค้า(%)': string;
  'คอมมิชชั่นสินค้าโดยรวม(฿)': string;
  'วันที่สั่งซื้อ': string;
  'เวลาที่สั่งซื้อ': string;
  'สถานะ': string;
  'วิธีการชำระ': string;
  'ผู้ให้บริการโลจิสติกส์': string;
  'ยอดขายสินค้าโดยรวม(฿)': string;
  'ช่องทาง': string;
  'Sub_id1'?: string;
  'Sub_id2'?: string;
  'Sub_id3'?: string;
  'Sub_id4'?: string;
  'Sub_id5'?: string;
  sub_id: string;
  // Data source tracking
  _dataSource: DataSource;
  _sourceTimestamp: Date;
  _sourceId?: string;
}

export interface EnhancedLazadaOrder {
  'Check Out ID': string;
  'Order Number': string;
  'Order Time': string;
  'SKU': string;
  'Item Name': string;
  'Sales Channel': string;
  'Order Amount': string;
  'Shipping Fee': string;
  'Voucher Amount': string;
  'Buyer Paid Amount': string;
  'Shipping Provider': string;
  'Order Status': string;
  'Payment Method': string;
  'Customer Name': string;
  'Customer Phone Number': string;
  'Shipping Address': string;
  'Billing Address': string;
  'Payout': string;
  'Aff Sub ID'?: string;
  'Sub ID 1'?: string;
  'Sub ID 2'?: string;
  'Sub ID 3'?: string;
  'Sub ID 4'?: string;
  'Sub ID': string;
  'Validity': string;
  // Data source tracking
  _dataSource: DataSource;
  _sourceTimestamp: Date;
  _sourceId?: string;
}

export interface EnhancedFacebookAd {
  'Campaign name': string;
  'Ad set name': string;
  'Ad name': string;
  'Amount spent (THB)': string;
  'Impressions': string;
  'Link clicks': string;
  'Landing page views': string;
  'Reach': string;
  'Frequency': string;
  'CPM (cost per 1,000 impressions)': string;
  'CPC (cost per link click)': string;
  'CTR (link click-through rate)': string;
  'Date': string;
  'Sub ID': string;
  // Data source tracking
  _dataSource: DataSource;
  _sourceTimestamp: Date;
  _sourceId?: string;
}

export interface EnhancedCampaign extends TraditionalCampaign {
  _dataSource: DataSource;
  _sourceTimestamp: Date;
  _sourceId?: string;
  _conflictResolution?: 'file_priority' | 'api_priority' | 'latest_priority' | 'manual';
}

// Merge configuration
export interface MergeConfig {
  conflictResolution: 'file_priority' | 'api_priority' | 'latest_priority' | 'manual';
  deduplicationStrategy: 'strict' | 'fuzzy' | 'disabled';
  dataFreshnessPriority: boolean; // If true, newer data takes precedence
  preserveOriginalData: boolean; // If true, keep original data alongside merged data
}

// Merge result with statistics
export interface MergeResult<T> {
  mergedData: T[];
  statistics: {
    totalOriginal: number;
    totalNew: number;
    totalMerged: number;
    duplicatesFound: number;
    duplicatesResolved: number;
    conflictsFound: number;
    conflictsResolved: number;
  };
  conflicts: ConflictInfo[];
  warnings: string[];
}

export interface ConflictInfo {
  id: string;
  field: string;
  originalValue: any;
  newValue: any;
  resolution: 'file_priority' | 'api_priority' | 'latest_priority' | 'manual';
  resolvedValue: any;
}

export class DataMerger {
  private config: MergeConfig;

  constructor(config: Partial<MergeConfig> = {}) {
    this.config = {
      conflictResolution: 'latest_priority',
      deduplicationStrategy: 'strict',
      dataFreshnessPriority: true,
      preserveOriginalData: true,
      ...config
    };
  }

  /**
   * Merge Shopee orders from file import and Facebook API
   */
  mergeShopeeOrders(
    fileOrders: any[],
    apiOrders: any[] = []
  ): MergeResult<EnhancedShopeeOrder> {
    const enhancedFileOrders: EnhancedShopeeOrder[] = fileOrders.map(order => ({
      ...order,
      _dataSource: 'file_import' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `file_${Date.now()}`
    }));

    const enhancedApiOrders: EnhancedShopeeOrder[] = apiOrders.map(order => ({
      ...order,
      _dataSource: 'facebook_api' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `api_${Date.now()}`
    }));

    return this.mergeOrdersByUniqueId(
      enhancedFileOrders,
      enhancedApiOrders,
      'เลขที่คำสั่งซื้อ'
    );
  }

  /**
   * Merge Lazada orders from file import and Facebook API
   */
  mergeLazadaOrders(
    fileOrders: any[],
    apiOrders: any[] = []
  ): MergeResult<EnhancedLazadaOrder> {
    const enhancedFileOrders: EnhancedLazadaOrder[] = fileOrders.map(order => ({
      ...order,
      _dataSource: 'file_import' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `file_${Date.now()}`
    }));

    const enhancedApiOrders: EnhancedLazadaOrder[] = apiOrders.map(order => ({
      ...order,
      _dataSource: 'facebook_api' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `api_${Date.now()}`
    }));

    return this.mergeOrdersByUniqueId(
      enhancedFileOrders,
      enhancedApiOrders,
      'Check Out ID'
    );
  }

  /**
   * Merge Facebook ads from file import and API
   */
  mergeFacebookAds(
    fileAds: any[],
    apiAds: any[]
  ): MergeResult<EnhancedFacebookAd> {
    const enhancedFileAds: EnhancedFacebookAd[] = fileAds.map(ad => ({
      ...ad,
      _dataSource: 'file_import' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `file_${Date.now()}`
    }));

    const enhancedApiAds: EnhancedFacebookAd[] = apiAds.map(ad => ({
      ...ad,
      _dataSource: 'facebook_api' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `api_${Date.now()}`
    }));

    // For Facebook ads, use a composite key for deduplication
    return this.mergeFacebookAdsByCompositeKey(enhancedFileAds, enhancedApiAds);
  }

  /**
   * Merge campaigns from different sources
   */
  mergeCampaigns(
    fileCampaigns: TraditionalCampaign[],
    apiCampaigns: TraditionalCampaign[]
  ): MergeResult<EnhancedCampaign> {
    const enhancedFileCampaigns: EnhancedCampaign[] = fileCampaigns.map(campaign => ({
      ...campaign,
      _dataSource: 'file_import' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `file_${Date.now()}`
    }));

    const enhancedApiCampaigns: EnhancedCampaign[] = apiCampaigns.map(campaign => ({
      ...campaign,
      _dataSource: 'facebook_api' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `api_${Date.now()}`
    }));

    return this.mergeCampaignsBySubId(enhancedFileCampaigns, enhancedApiCampaigns);
  }

  /**
   * Merge dashboard campaigns with Facebook API data
   */
  mergeDashboardCampaigns(
    existingCampaigns: any[],
    facebookCampaigns: any[]
  ): MergeResult<any> {
    const enhancedExistingCampaigns = existingCampaigns.map(campaign => ({
      ...campaign,
      _dataSource: campaign._dataSource || 'file_import' as DataSource,
      _sourceTimestamp: campaign._sourceTimestamp || new Date(),
      _sourceId: campaign._sourceId || `existing_${campaign.id || Date.now()}`
    }));

    const enhancedFacebookCampaigns = facebookCampaigns.map(campaign => ({
      ...campaign,
      _dataSource: 'facebook_api' as DataSource,
      _sourceTimestamp: new Date(),
      _sourceId: `facebook_${campaign.id || Date.now()}`
    }));

    return this.mergeCampaignsBySubIdAndPlatform(enhancedExistingCampaigns, enhancedFacebookCampaigns);
  }

  /**
   * Generic merge function for orders with unique ID
   */
  private mergeOrdersByUniqueId<T extends Record<string, any>>(
    originalOrders: T[],
    newOrders: T[],
    uniqueIdField: string
  ): MergeResult<T> {
    const mergedData: T[] = [];
    const conflicts: ConflictInfo[] = [];
    const warnings: string[] = [];
    let duplicatesFound = 0;
    let duplicatesResolved = 0;
    let conflictsFound = 0;
    let conflictsResolved = 0;

    // Create a map of original orders by unique ID
    const originalMap = new Map<string, T>();
    originalOrders.forEach(order => {
      const uniqueId = order[uniqueIdField];
      if (uniqueId) {
        originalMap.set(uniqueId, order);
      }
    });

    // Add all original orders first
    mergedData.push(...originalOrders);

    // Process new orders
    newOrders.forEach(newOrder => {
      const uniqueId = newOrder[uniqueIdField];
      if (!uniqueId) {
        warnings.push(`Order missing unique ID field: ${uniqueIdField}`);
        return;
      }

      const existingOrder = originalMap.get(uniqueId);
      
      if (existingOrder) {
        duplicatesFound++;
        
        // Handle conflict resolution
        const resolvedOrder = this.resolveOrderConflict(
          existingOrder,
          newOrder,
          uniqueIdField
        );
        
        if (resolvedOrder !== existingOrder) {
          conflictsFound++;
          // Replace the existing order in mergedData
          const index = mergedData.findIndex(order => order[uniqueIdField] === uniqueId);
          if (index !== -1) {
            mergedData[index] = resolvedOrder;
            conflictsResolved++;
          }
        }
        
        duplicatesResolved++;
      } else {
        // No duplicate, add the new order
        mergedData.push(newOrder);
      }
    });

    return {
      mergedData,
      statistics: {
        totalOriginal: originalOrders.length,
        totalNew: newOrders.length,
        totalMerged: mergedData.length,
        duplicatesFound,
        duplicatesResolved,
        conflictsFound,
        conflictsResolved
      },
      conflicts,
      warnings
    };
  }

  /**
   * Merge Facebook ads using composite key (campaign + ad set + ad name + date)
   */
  private mergeFacebookAdsByCompositeKey(
    originalAds: EnhancedFacebookAd[],
    newAds: EnhancedFacebookAd[]
  ): MergeResult<EnhancedFacebookAd> {
    const mergedData: EnhancedFacebookAd[] = [];
    const conflicts: ConflictInfo[] = [];
    const warnings: string[] = [];
    let duplicatesFound = 0;
    let duplicatesResolved = 0;
    let conflictsFound = 0;
    let conflictsResolved = 0;

    // Create composite key for Facebook ads
    const createCompositeKey = (ad: EnhancedFacebookAd): string => {
      return `${ad['Campaign name']}_${ad['Ad set name']}_${ad['Ad name']}_${ad['Date']}`;
    };

    // Create a map of original ads by composite key
    const originalMap = new Map<string, EnhancedFacebookAd>();
    originalAds.forEach(ad => {
      const compositeKey = createCompositeKey(ad);
      originalMap.set(compositeKey, ad);
    });

    // Add all original ads first
    mergedData.push(...originalAds);

    // Process new ads
    newAds.forEach(newAd => {
      const compositeKey = createCompositeKey(newAd);
      const existingAd = originalMap.get(compositeKey);
      
      if (existingAd) {
        duplicatesFound++;
        
        // Handle conflict resolution for Facebook ads
        const resolvedAd = this.resolveFacebookAdConflict(existingAd, newAd);
        
        if (resolvedAd !== existingAd) {
          conflictsFound++;
          // Replace the existing ad in mergedData
          const index = mergedData.findIndex(ad => createCompositeKey(ad) === compositeKey);
          if (index !== -1) {
            mergedData[index] = resolvedAd;
            conflictsResolved++;
          }
        }
        
        duplicatesResolved++;
      } else {
        // No duplicate, add the new ad
        mergedData.push(newAd);
      }
    });

    return {
      mergedData,
      statistics: {
        totalOriginal: originalAds.length,
        totalNew: newAds.length,
        totalMerged: mergedData.length,
        duplicatesFound,
        duplicatesResolved,
        conflictsFound,
        conflictsResolved
      },
      conflicts,
      warnings
    };
  }

  /**
   * Merge campaigns by Sub ID
   */
  private mergeCampaignsBySubId(
    originalCampaigns: EnhancedCampaign[],
    newCampaigns: EnhancedCampaign[]
  ): MergeResult<EnhancedCampaign> {
    const mergedData: EnhancedCampaign[] = [];
    const conflicts: ConflictInfo[] = [];
    const warnings: string[] = [];
    let duplicatesFound = 0;
    let duplicatesResolved = 0;
    let conflictsFound = 0;
    let conflictsResolved = 0;

    // Create a map of original campaigns by subId
    const originalMap = new Map<string, EnhancedCampaign>();
    originalCampaigns.forEach(campaign => {
      originalMap.set(campaign.subId, campaign);
    });

    // Add all original campaigns first
    mergedData.push(...originalCampaigns);

    // Process new campaigns
    newCampaigns.forEach(newCampaign => {
      const existingCampaign = originalMap.get(newCampaign.subId);
      
      if (existingCampaign) {
        duplicatesFound++;
        
        // Handle conflict resolution for campaigns
        const resolvedCampaign = this.resolveCampaignConflict(existingCampaign, newCampaign);
        
        if (resolvedCampaign !== existingCampaign) {
          conflictsFound++;
          // Replace the existing campaign in mergedData
          const index = mergedData.findIndex(campaign => campaign.subId === newCampaign.subId);
          if (index !== -1) {
            mergedData[index] = resolvedCampaign;
            conflictsResolved++;
          }
        }
        
        duplicatesResolved++;
      } else {
        // No duplicate, add the new campaign
        mergedData.push(newCampaign);
      }
    });

    return {
      mergedData,
      statistics: {
        totalOriginal: originalCampaigns.length,
        totalNew: newCampaigns.length,
        totalMerged: mergedData.length,
        duplicatesFound,
        duplicatesResolved,
        conflictsFound,
        conflictsResolved
      },
      conflicts,
      warnings
    };
  }

  /**
   * Resolve conflicts between orders
   */
  private resolveOrderConflict<T extends Record<string, any>>(
    existingOrder: T,
    newOrder: T,
    uniqueIdField: string
  ): T {
    switch (this.config.conflictResolution) {
      case 'file_priority':
        return existingOrder._dataSource === 'file_import' ? existingOrder : newOrder;
      
      case 'api_priority':
        return existingOrder._dataSource === 'facebook_api' ? existingOrder : newOrder;
      
      case 'latest_priority':
        return existingOrder._sourceTimestamp > newOrder._sourceTimestamp ? existingOrder : newOrder;
      
      case 'manual':
        // For manual resolution, return the existing order with conflict flag
        return {
          ...existingOrder,
          _conflictResolution: 'manual',
          _conflictData: newOrder
        };
      
      default:
        return existingOrder;
    }
  }

  /**
   * Resolve conflicts between Facebook ads
   */
  private resolveFacebookAdConflict(
    existingAd: EnhancedFacebookAd,
    newAd: EnhancedFacebookAd
  ): EnhancedFacebookAd {
    // For Facebook ads, prefer API data over file data for accuracy
    if (this.config.conflictResolution === 'api_priority' || 
        (this.config.conflictResolution === 'latest_priority' && newAd._dataSource === 'facebook_api')) {
      return newAd;
    }
    
    return existingAd;
  }

  /**
   * Merge campaigns by Sub ID and Platform for dashboard integration
   */
  private mergeCampaignsBySubIdAndPlatform(
    originalCampaigns: any[],
    newCampaigns: any[]
  ): MergeResult<any> {
    const mergedData: any[] = [];
    const conflicts: ConflictInfo[] = [];
    const warnings: string[] = [];
    let duplicatesFound = 0;
    let duplicatesResolved = 0;
    let conflictsFound = 0;
    let conflictsResolved = 0;

    // Create a map of original campaigns by composite key (subId + platform)
    const originalMap = new Map<string, any>();
    originalCampaigns.forEach(campaign => {
      const compositeKey = `${campaign.subId}_${campaign.platform}`;
      originalMap.set(compositeKey, campaign);
    });

    // Add all original campaigns first
    mergedData.push(...originalCampaigns);

    // Process new campaigns
    newCampaigns.forEach(newCampaign => {
      const compositeKey = `${newCampaign.subId}_${newCampaign.platform}`;
      const existingCampaign = originalMap.get(compositeKey);
      
      if (existingCampaign) {
        duplicatesFound++;
        
        // Handle conflict resolution for dashboard campaigns
        const resolvedCampaign = this.resolveDashboardCampaignConflict(existingCampaign, newCampaign);
        
        if (resolvedCampaign !== existingCampaign) {
          conflictsFound++;
          // Replace the existing campaign in mergedData
          const index = mergedData.findIndex(campaign => 
            `${campaign.subId}_${campaign.platform}` === compositeKey
          );
          if (index !== -1) {
            mergedData[index] = resolvedCampaign;
            conflictsResolved++;
          }
        }
        
        duplicatesResolved++;
      } else {
        // No duplicate, add the new campaign
        mergedData.push(newCampaign);
      }
    });

    return {
      mergedData,
      statistics: {
        totalOriginal: originalCampaigns.length,
        totalNew: newCampaigns.length,
        totalMerged: mergedData.length,
        duplicatesFound,
        duplicatesResolved,
        conflictsFound,
        conflictsResolved
      },
      conflicts,
      warnings
    };
  }

  /**
   * Resolve conflicts between campaigns
   */
  private resolveCampaignConflict(
    existingCampaign: EnhancedCampaign,
    newCampaign: EnhancedCampaign
  ): EnhancedCampaign {
    // Merge campaign data intelligently
    const resolvedCampaign: EnhancedCampaign = { ...existingCampaign };

    // Update metrics with newer data if available
    if (newCampaign._sourceTimestamp > existingCampaign._sourceTimestamp) {
      resolvedCampaign.orders = newCampaign.orders;
      resolvedCampaign.commission = newCampaign.commission;
      resolvedCampaign.adSpend = newCampaign.adSpend;
      resolvedCampaign.roi = newCampaign.roi;
      resolvedCampaign.performance = newCampaign.performance;
      resolvedCampaign._sourceTimestamp = newCampaign._sourceTimestamp;
      resolvedCampaign._dataSource = 'merged';
    }

    return resolvedCampaign;
  }

  /**
   * Resolve conflicts between dashboard campaigns
   */
  private resolveDashboardCampaignConflict(
    existingCampaign: any,
    newCampaign: any
  ): any {
    switch (this.config.conflictResolution) {
      case 'file_priority':
        return existingCampaign._dataSource === 'file_import' ? existingCampaign : newCampaign;
      
      case 'api_priority':
        return newCampaign._dataSource === 'facebook_api' ? newCampaign : existingCampaign;
      
      case 'latest_priority':
        // For dashboard campaigns, prefer newer data based on startDate or sourceTimestamp
        const existingDate = new Date(existingCampaign.startDate || existingCampaign._sourceTimestamp);
        const newDate = new Date(newCampaign.startDate || newCampaign._sourceTimestamp);
        
        if (newDate >= existingDate) {
          return {
            ...newCampaign,
            id: existingCampaign.id, // Preserve original ID for UI consistency
            _dataSource: 'merged',
            _conflictResolution: 'latest_priority'
          };
        }
        return existingCampaign;
      
      case 'manual':
        // For manual resolution, return the existing campaign with conflict flag
        return {
          ...existingCampaign,
          _conflictResolution: 'manual',
          _conflictData: newCampaign
        };
      
      default:
        return existingCampaign;
    }
  }

  /**
   * Get data source statistics
   */
  getDataSourceStatistics<T extends { _dataSource: DataSource }>(data: T[]): {
    fileImport: number;
    facebookApi: number;
    merged: number;
    total: number;
  } {
    const stats = {
      fileImport: 0,
      facebookApi: 0,
      merged: 0,
      total: data.length
    };

    data.forEach(item => {
      switch (item._dataSource) {
        case 'file_import':
          stats.fileImport++;
          break;
        case 'facebook_api':
          stats.facebookApi++;
          break;
        case 'merged':
          stats.merged++;
          break;
      }
    });

    return stats;
  }

  /**
   * Filter data by source
   */
  filterByDataSource<T extends { _dataSource: DataSource }>(
    data: T[],
    source: DataSource
  ): T[] {
    return data.filter(item => item._dataSource === source);
  }

  /**
   * Comprehensive data merge for all data types
   */
  mergeAllData(
    fileData: {
      shopeeOrders?: any[];
      lazadaOrders?: any[];
      facebookAds?: any[];
      campaigns?: any[];
    },
    apiData: {
      shopeeOrders?: any[];
      lazadaOrders?: any[];
      facebookAds?: any[];
      campaigns?: any[];
    }
  ): {
    mergedData: {
      shopeeOrders: any[];
      lazadaOrders: any[];
      facebookAds: any[];
      campaigns: any[];
    };
    mergeResults: {
      shopee: MergeResult<any>;
      lazada: MergeResult<any>;
      facebook: MergeResult<any>;
      campaigns: MergeResult<any>;
    };
    overallStatistics: {
      totalOriginal: number;
      totalNew: number;
      totalMerged: number;
      totalDuplicatesFound: number;
      totalConflictsResolved: number;
    };
  } {
    // Merge each data type
    const shopeeResult = this.mergeShopeeOrders(
      fileData.shopeeOrders || [],
      apiData.shopeeOrders || []
    );

    const lazadaResult = this.mergeLazadaOrders(
      fileData.lazadaOrders || [],
      apiData.lazadaOrders || []
    );

    const facebookResult = this.mergeFacebookAds(
      fileData.facebookAds || [],
      apiData.facebookAds || []
    );

    const campaignsResult = this.mergeDashboardCampaigns(
      fileData.campaigns || [],
      apiData.campaigns || []
    );

    // Calculate overall statistics
    const overallStatistics = {
      totalOriginal: shopeeResult.statistics.totalOriginal + 
                    lazadaResult.statistics.totalOriginal + 
                    facebookResult.statistics.totalOriginal +
                    campaignsResult.statistics.totalOriginal,
      totalNew: shopeeResult.statistics.totalNew + 
               lazadaResult.statistics.totalNew + 
               facebookResult.statistics.totalNew +
               campaignsResult.statistics.totalNew,
      totalMerged: shopeeResult.statistics.totalMerged + 
                  lazadaResult.statistics.totalMerged + 
                  facebookResult.statistics.totalMerged +
                  campaignsResult.statistics.totalMerged,
      totalDuplicatesFound: shopeeResult.statistics.duplicatesFound + 
                           lazadaResult.statistics.duplicatesFound + 
                           facebookResult.statistics.duplicatesFound +
                           campaignsResult.statistics.duplicatesFound,
      totalConflictsResolved: shopeeResult.statistics.conflictsResolved + 
                             lazadaResult.statistics.conflictsResolved + 
                             facebookResult.statistics.conflictsResolved +
                             campaignsResult.statistics.conflictsResolved
    };

    return {
      mergedData: {
        shopeeOrders: shopeeResult.mergedData,
        lazadaOrders: lazadaResult.mergedData,
        facebookAds: facebookResult.mergedData,
        campaigns: campaignsResult.mergedData
      },
      mergeResults: {
        shopee: shopeeResult,
        lazada: lazadaResult,
        facebook: facebookResult,
        campaigns: campaignsResult
      },
      overallStatistics
    };
  }

  /**
   * Detect and resolve cross-platform data conflicts
   */
  detectCrossPlatformConflicts(
    shopeeOrders: any[],
    lazadaOrders: any[],
    facebookAds: any[]
  ): {
    conflicts: Array<{
      type: 'date_mismatch' | 'spend_mismatch' | 'performance_anomaly';
      description: string;
      affectedRecords: any[];
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  } {
    const conflicts: any[] = [];
    const recommendations: string[] = [];

    // Check for date range mismatches
    const shopeeDate = this.getDateRange(shopeeOrders, ['วันที่สั่งซื้อ', 'เวลาที่สั่งซื้อ']);
    const lazadaDate = this.getDateRange(lazadaOrders, ['Order Time', 'Conversion Time']);
    const facebookDate = this.getDateRange(facebookAds, ['Date', 'Day']);

    if (shopeeDate.start && facebookDate.start) {
      const daysDiff = Math.abs(
        (shopeeDate.start.getTime() - facebookDate.start.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff > 7) {
        conflicts.push({
          type: 'date_mismatch',
          description: `Shopee and Facebook data have significant date range differences (${Math.round(daysDiff)} days)`,
          affectedRecords: [],
          severity: 'medium' as const
        });
        
        recommendations.push('Consider aligning date ranges across platforms for accurate comparison');
      }
    }

    // Check for spend vs commission anomalies
    const totalFacebookSpend = facebookAds.reduce((sum, ad) => {
      const spend = parseFloat(ad['Amount spent (THB)'] || ad['Amount spent'] || '0');
      return sum + (isNaN(spend) ? 0 : spend);
    }, 0);

    const totalCommission = shopeeOrders.reduce((sum, order) => {
      const commission = parseFloat(order['คอมมิชชั่นสินค้าโดยรวม(฿)'] || '0');
      return sum + (isNaN(commission) ? 0 : commission);
    }, 0) + lazadaOrders.reduce((sum, order) => {
      const payout = parseFloat(order['Payout'] || '0');
      return sum + (isNaN(payout) ? 0 : payout);
    }, 0);

    if (totalFacebookSpend > 0 && totalCommission > 0) {
      const roi = ((totalCommission - totalFacebookSpend) / totalFacebookSpend) * 100;
      
      if (roi < -80) {
        conflicts.push({
          type: 'performance_anomaly',
          description: `Very low ROI detected (${roi.toFixed(1)}%) - spend significantly exceeds commission`,
          affectedRecords: [],
          severity: 'high' as const
        });
        
        recommendations.push('Review campaign performance and consider optimizing ad spend allocation');
      }
    }

    return { conflicts, recommendations };
  }

  /**
   * Get date range from data array
   */
  private getDateRange(data: any[], dateFields: string[]): { start: Date | null; end: Date | null } {
    let start: Date | null = null;
    let end: Date | null = null;

    data.forEach(item => {
      for (const field of dateFields) {
        if (item[field]) {
          const date = new Date(item[field]);
          if (!isNaN(date.getTime())) {
            if (!start || date < start) start = date;
            if (!end || date > end) end = date;
            break;
          }
        }
      }
    });

    return { start, end };
  }

  /**
   * Remove data source tracking (for backward compatibility)
   */
  stripDataSourceTracking<T extends Record<string, any>>(data: T[]): Omit<T, '_dataSource' | '_sourceTimestamp' | '_sourceId'>[] {
    return data.map(item => {
      const { _dataSource, _sourceTimestamp, _sourceId, _conflictResolution, _conflictData, ...cleanItem } = item;
      return cleanItem;
    });
  }

  /**
   * Get detailed merge report
   */
  generateMergeReport(mergeResults: any): {
    summary: string;
    details: Array<{
      dataType: string;
      originalCount: number;
      newCount: number;
      mergedCount: number;
      duplicatesFound: number;
      conflictsResolved: number;
      status: 'success' | 'warning' | 'error';
    }>;
    recommendations: string[];
  } {
    const details = Object.entries(mergeResults).map(([dataType, result]: [string, any]) => ({
      dataType: dataType.charAt(0).toUpperCase() + dataType.slice(1),
      originalCount: result.statistics.totalOriginal,
      newCount: result.statistics.totalNew,
      mergedCount: result.statistics.totalMerged,
      duplicatesFound: result.statistics.duplicatesFound,
      conflictsResolved: result.statistics.conflictsResolved,
      status: result.statistics.duplicatesFound > 0 ? 'warning' : 'success' as const
    }));

    const totalDuplicates = details.reduce((sum, d) => sum + d.duplicatesFound, 0);
    const totalConflicts = details.reduce((sum, d) => sum + d.conflictsResolved, 0);

    const summary = totalDuplicates > 0 
      ? `Merged data successfully with ${totalDuplicates} duplicates found and ${totalConflicts} conflicts resolved`
      : 'Data merged successfully with no conflicts';

    const recommendations: string[] = [];
    
    if (totalDuplicates > 0) {
      recommendations.push('Review merged data for accuracy, especially where conflicts were resolved');
    }
    
    if (totalConflicts > 0) {
      recommendations.push('Consider adjusting conflict resolution strategy if results are not as expected');
    }

    return { summary, details, recommendations };
  }
}

// Export singleton instance
export const dataMerger = new DataMerger();