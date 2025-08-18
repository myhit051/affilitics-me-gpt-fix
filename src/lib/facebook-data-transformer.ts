import { 
  FacebookSyncResult, 
  FacebookCampaign, 
  FacebookInsights,
  TransformedData,
  DataMetadata,
  ValidationResult 
} from '@/types/facebook';

// Dashboard data interfaces based on existing structure
export interface DashboardCampaign {
  id: number;
  name: string;
  platform: string;
  subId: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  status: string;
  startDate: string;
  performance: string;
}

export interface DashboardPlatformData {
  id: number;
  platform: string;
  icon: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  status: string;
  change: number;
}

export interface DashboardSubIdData {
  id: number;
  subId: string;
  platform: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  trend: string;
  level: number;
}

export interface CurrencyConversionRates {
  [currency: string]: number; // Rate to USD
}

export interface TransformationOptions {
  targetCurrency?: string;
  conversionRates?: CurrencyConversionRates;
  estimateOrdersFromClicks?: boolean;
  estimateCommissionRate?: number; // Default commission rate if not available
  platformIcon?: string;
}

export class FacebookDataTransformer {
  private defaultOptions: TransformationOptions = {
    targetCurrency: 'USD',
    estimateOrdersFromClicks: true,
    estimateCommissionRate: 0.05, // 5% default commission rate
    platformIcon: '📘'
  };

  /**
   * Transform Facebook API data to dashboard format
   */
  transformFacebookData(
    facebookData: FacebookSyncResult, 
    options: TransformationOptions = {}
  ): TransformedData {
    const opts = { ...this.defaultOptions, ...options };
    
    const transformedCampaigns = this.transformCampaigns(facebookData.campaigns, opts);
    const platformData = this.aggregatePlatformData(transformedCampaigns);
    const subIdData = this.generateSubIdData(transformedCampaigns);
    
    const metadata: DataMetadata = {
      source: 'facebook_api',
      transformedAt: new Date(),
      originalRecordCount: facebookData.campaigns.length,
      transformedRecordCount: transformedCampaigns.length,
      dataVersion: '1.0'
    };

    return {
      campaigns: transformedCampaigns,
      ads: [], // Will be populated in future iterations
      insights: [], // Will be populated in future iterations
      metadata
    };
  }

  /**
   * Transform Facebook campaigns to dashboard campaign format
   */
  private transformCampaigns(
    campaigns: FacebookCampaign[], 
    options: TransformationOptions
  ): DashboardCampaign[] {
    return campaigns.map((campaign, index) => {
      const insights = campaign.insights;
      const spend = insights?.spend || 0;
      const clicks = insights?.clicks || 0;
      
      // Estimate orders from clicks (conversion rate assumption)
      const estimatedOrders = options.estimateOrdersFromClicks 
        ? Math.round(clicks * 0.02) // 2% conversion rate assumption
        : 0;
      
      // Estimate commission based on spend and commission rate
      const estimatedCommission = spend * (options.estimateCommissionRate || 0.05);
      
      // Convert currency if needed
      const convertedSpend = this.convertCurrency(spend, 'USD', options.targetCurrency, options.conversionRates);
      const convertedCommission = this.convertCurrency(estimatedCommission, 'USD', options.targetCurrency, options.conversionRates);
      
      // Calculate ROI
      const roi = convertedSpend > 0 ? ((convertedCommission - convertedSpend) / convertedSpend) * 100 : 0;
      
      return {
        id: parseInt(campaign.id) || index + 1000, // Ensure unique ID
        name: campaign.name,
        platform: 'Facebook',
        subId: this.generateSubId(campaign),
        orders: estimatedOrders,
        commission: Math.round(convertedCommission * 100) / 100,
        adSpend: Math.round(convertedSpend * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        status: this.mapCampaignStatus(campaign.status),
        startDate: campaign.created_time.split('T')[0], // Extract date part
        performance: this.calculatePerformance(roi)
      };
    });
  }

  /**
   * Generate a sub ID for Facebook campaigns
   */
  private generateSubId(campaign: FacebookCampaign): string {
    // Create a meaningful sub ID from campaign data
    const campaignId = campaign.id.slice(-8); // Last 8 characters of campaign ID
    const objective = campaign.objective?.toLowerCase().replace(/_/g, '') || 'general';
    return `fb_${objective}_${campaignId}`;
  }

  /**
   * Map Facebook campaign status to dashboard status
   */
  private mapCampaignStatus(facebookStatus: string): string {
    switch (facebookStatus) {
      case 'ACTIVE':
        return 'active';
      case 'PAUSED':
        return 'paused';
      case 'DELETED':
      case 'ARCHIVED':
        return 'ended';
      default:
        return 'paused';
    }
  }

  /**
   * Calculate performance rating based on ROI
   */
  private calculatePerformance(roi: number): string {
    if (roi >= 100) return 'excellent';
    if (roi >= 50) return 'good';
    if (roi >= 0) return 'average';
    return 'poor';
  }

  /**
   * Convert currency using provided rates
   */
  private convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency?: string, 
    rates?: CurrencyConversionRates
  ): number {
    if (!toCurrency || fromCurrency === toCurrency || !rates) {
      return amount;
    }
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  /**
   * Aggregate campaign data into platform performance data
   */
  private aggregatePlatformData(campaigns: DashboardCampaign[]): DashboardPlatformData[] {
    const facebookCampaigns = campaigns.filter(c => c.platform === 'Facebook');
    
    if (facebookCampaigns.length === 0) {
      return [];
    }

    const totalOrders = facebookCampaigns.reduce((sum, c) => sum + c.orders, 0);
    const totalCommission = facebookCampaigns.reduce((sum, c) => sum + c.commission, 0);
    const totalSpend = facebookCampaigns.reduce((sum, c) => sum + c.adSpend, 0);
    const avgRoi = totalSpend > 0 ? ((totalCommission - totalSpend) / totalSpend) * 100 : 0;

    return [{
      id: 999, // Unique ID for Facebook platform
      platform: 'Facebook Ads',
      icon: '📘',
      orders: totalOrders,
      commission: Math.round(totalCommission * 100) / 100,
      adSpend: Math.round(totalSpend * 100) / 100,
      roi: Math.round(avgRoi * 10) / 10,
      status: this.calculatePlatformStatus(avgRoi),
      change: 0 // Will be calculated based on historical data in future
    }];
  }

  /**
   * Calculate platform status based on ROI
   */
  private calculatePlatformStatus(roi: number): string {
    if (roi >= 100) return 'excellent';
    if (roi >= 50) return 'good';
    if (roi >= 0) return 'average';
    return 'poor';
  }

  /**
   * Generate sub ID data from campaigns
   */
  private generateSubIdData(campaigns: DashboardCampaign[]): DashboardSubIdData[] {
    return campaigns.map((campaign, index) => ({
      id: campaign.id + 2000, // Ensure unique ID
      subId: campaign.subId,
      platform: campaign.platform,
      orders: campaign.orders,
      commission: campaign.commission,
      adSpend: campaign.adSpend,
      roi: campaign.roi,
      trend: this.calculateTrend(campaign.roi),
      level: 1
    }));
  }

  /**
   * Calculate trend based on performance
   */
  private calculateTrend(roi: number): string {
    if (roi >= 50) return 'up';
    if (roi >= 0) return 'stable';
    return 'down';
  }

  /**
   * Merge Facebook data with existing dashboard data
   */
  mergeFacebookWithExisting(
    facebookData: DashboardCampaign[], 
    existingData: DashboardCampaign[]
  ): DashboardCampaign[] {
    // Create a map of existing campaigns by subId for deduplication
    const existingMap = new Map<string, DashboardCampaign>();
    existingData.forEach(campaign => {
      existingMap.set(campaign.subId, campaign);
    });

    // Merge Facebook data, avoiding duplicates
    const mergedData = [...existingData];
    
    facebookData.forEach(fbCampaign => {
      const existing = existingMap.get(fbCampaign.subId);
      
      if (existing) {
        // Update existing campaign with Facebook data if it's newer
        const existingDate = new Date(existing.startDate);
        const fbDate = new Date(fbCampaign.startDate);
        
        if (fbDate >= existingDate) {
          // Replace with Facebook data
          const index = mergedData.findIndex(c => c.subId === fbCampaign.subId);
          if (index !== -1) {
            mergedData[index] = {
              ...fbCampaign,
              id: existing.id // Preserve original ID
            };
          }
        }
      } else {
        // Add new Facebook campaign
        mergedData.push(fbCampaign);
      }
    });

    return mergedData;
  }

  /**
   * Validate transformed data structure
   */
  validateDataStructure(data: DashboardCampaign[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((campaign, index) => {
      // Required field validation
      if (!campaign.name || campaign.name.trim() === '') {
        errors.push(`Campaign at index ${index}: name is required`);
      }
      
      if (!campaign.platform || campaign.platform.trim() === '') {
        errors.push(`Campaign at index ${index}: platform is required`);
      }
      
      if (!campaign.subId || campaign.subId.trim() === '') {
        errors.push(`Campaign at index ${index}: subId is required`);
      }

      // Numeric field validation
      if (typeof campaign.orders !== 'number' || campaign.orders < 0) {
        errors.push(`Campaign at index ${index}: orders must be a non-negative number`);
      }
      
      if (typeof campaign.commission !== 'number' || campaign.commission < 0) {
        errors.push(`Campaign at index ${index}: commission must be a non-negative number`);
      }
      
      if (typeof campaign.adSpend !== 'number' || campaign.adSpend < 0) {
        errors.push(`Campaign at index ${index}: adSpend must be a non-negative number`);
      }

      // Date validation
      if (!campaign.startDate || isNaN(Date.parse(campaign.startDate))) {
        errors.push(`Campaign at index ${index}: startDate must be a valid date`);
      }

      // Status validation
      const validStatuses = ['active', 'paused', 'ended'];
      if (!validStatuses.includes(campaign.status)) {
        errors.push(`Campaign at index ${index}: status must be one of ${validStatuses.join(', ')}`);
      }

      // Performance validation
      const validPerformances = ['excellent', 'good', 'average', 'poor'];
      if (!validPerformances.includes(campaign.performance)) {
        errors.push(`Campaign at index ${index}: performance must be one of ${validPerformances.join(', ')}`);
      }

      // Warning for unusual values
      if (campaign.roi < -100) {
        warnings.push(`Campaign at index ${index}: ROI is unusually low (${campaign.roi}%)`);
      }
      
      if (campaign.adSpend === 0 && campaign.orders > 0) {
        warnings.push(`Campaign at index ${index}: has orders but no ad spend`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Sanitize data by removing invalid entries and fixing common issues
   */
  sanitizeData(data: DashboardCampaign[]): DashboardCampaign[] {
    return data
      .filter(campaign => {
        // Remove campaigns with critical missing data
        return campaign.name && 
               campaign.platform && 
               campaign.subId &&
               typeof campaign.orders === 'number' &&
               typeof campaign.commission === 'number' &&
               typeof campaign.adSpend === 'number';
      })
      .map(campaign => ({
        ...campaign,
        // Fix common data issues
        name: campaign.name.trim(),
        platform: campaign.platform.trim(),
        subId: campaign.subId.trim(),
        orders: Math.max(0, Math.round(campaign.orders)),
        commission: Math.max(0, Math.round(campaign.commission * 100) / 100),
        adSpend: Math.max(0, Math.round(campaign.adSpend * 100) / 100),
        roi: Math.round(campaign.roi * 10) / 10,
        status: campaign.status.toLowerCase(),
        performance: campaign.performance.toLowerCase()
      }));
  }
}

// Export singleton instance
export const facebookDataTransformer = new FacebookDataTransformer();