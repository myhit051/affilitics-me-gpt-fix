// Facebook API Service
// High-level service for fetching Facebook advertising data

import { FacebookAPIClient, getFacebookAPIClient } from './facebook-api-client';
import { 
  FACEBOOK_API_ENDPOINTS, 
  FACEBOOK_FIELDS, 
  FACEBOOK_INSIGHTS_METRICS,
  RATE_LIMITING 
} from './facebook-constants';
import { 
  FacebookAdAccount, 
  FacebookCampaign, 
  FacebookAdSet, 
  FacebookAd, 
  FacebookInsights, 
  DateRange,
  InsightLevel,
  FacebookSyncResult 
} from '@/types/facebook';
import { getFacebookDataCache } from './facebook-data-cache';

export interface FacebookAPIServiceConfig {
  batchSize?: number;
  includeInsights?: boolean;
  defaultDateRange?: DateRange;
  maxConcurrentRequests?: number;
  syncTimeout?: number;
}

export interface SyncOptions {
  accountIds: string[];
  dateRange?: DateRange;
  includeInsights?: boolean;
  campaignStatus?: string[];
  onProgress?: (progress: SyncProgress) => void;
}

export interface SyncProgress {
  phase: 'accounts' | 'campaigns' | 'insights' | 'complete';
  accountsProcessed: number;
  totalAccounts: number;
  campaignsProcessed: number;
  totalCampaigns: number;
  currentAccount?: string;
  errors: string[];
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface PaginationInfo {
  after?: string;
  before?: string;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface BatchRequestItem {
  method: string;
  relative_url: string;
  body?: any;
}

export interface BatchResponse<T = any> {
  code: number;
  headers?: Array<{ name: string; value: string }>;
  body: string;
  data?: T;
}

export class FacebookAPIService {
  private client: FacebookAPIClient;
  private config: FacebookAPIServiceConfig;
  private cache = getFacebookDataCache();
  private healthCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck?: Date;
  private serviceStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
  private requestCount = 0;
  private errorCount = 0;
  private lastResetTime = Date.now();

  constructor(client?: FacebookAPIClient, config: FacebookAPIServiceConfig = {}) {
    this.client = client || getFacebookAPIClient();
    this.config = {
      batchSize: RATE_LIMITING.BATCH_SIZE_LIMIT,
      includeInsights: true,
      maxConcurrentRequests: 5,
      syncTimeout: 300000, // 5 minutes
      ...config,
    };
    
    // Start health monitoring in production
    if (!import.meta.env.DEV) {
      this.startHealthMonitoring();
    }
  }

  // Health monitoring methods
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
  }

  private async performHealthCheck(): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        this.serviceStatus = 'down';
        return;
      }

      // Simple health check - get user info
      await this.client.get('/me', { fields: 'id' });
      
      // Check error rate
      const errorRate = this.errorCount / Math.max(this.requestCount, 1);
      if (errorRate > 0.1) { // More than 10% error rate
        this.serviceStatus = 'degraded';
      } else {
        this.serviceStatus = 'healthy';
      }

      this.lastHealthCheck = new Date();
      
      // Reset counters every hour
      if (Date.now() - this.lastResetTime > 3600000) {
        this.requestCount = 0;
        this.errorCount = 0;
        this.lastResetTime = Date.now();
      }

    } catch (error) {
      this.serviceStatus = 'down';
      console.error('Health check failed:', error);
    }
  }

  // Get service health status
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'down';
    lastCheck?: Date;
    requestCount: number;
    errorCount: number;
    errorRate: number;
  } {
    return {
      status: this.serviceStatus,
      lastCheck: this.lastHealthCheck,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      errorRate: this.errorCount / Math.max(this.requestCount, 1),
    };
  }

  // Cleanup method
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  // Set access token for the underlying client
  setAccessToken(token: string): void {
    this.client.setAccessToken(token);
  }

  // Check if service is authenticated
  isAuthenticated(): boolean {
    return this.client.isAuthenticated();
  }

  // Get account spend for last 30 days
  async getAccountSpend(accountId: string): Promise<number> {
    if (!this.isAuthenticated()) {
      return 0;
    }

    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const dateRange = {
        since: thirtyDaysAgo.toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      };

      console.log(`Getting spend for account ${accountId} with date range:`, dateRange);
      
      const insights = await this.getAccountInsights(accountId, {
        dateRange,
        metrics: ['spend']
      });

      console.log(`Account ${accountId} insights:`, {
        insightsCount: insights.length,
        spend: insights.length > 0 ? insights[0].spend : 'No data'
      });

      return insights.length > 0 ? (insights[0].spend || 0) : 0;
    } catch (error) {
      console.warn(`Failed to get spend for account ${accountId}:`, error);
      return 0;
    }
  }

  // Get spend data for multiple accounts
  async getAccountsSpend(accountIds: string[]): Promise<Record<string, number>> {
    if (!this.isAuthenticated() || accountIds.length === 0) {
      return {};
    }

    const spendData: Record<string, number> = {};
    
    try {
      // Process accounts in parallel but with limited concurrency
      const maxConcurrent = 3;
      for (let i = 0; i < accountIds.length; i += maxConcurrent) {
        const batch = accountIds.slice(i, i + maxConcurrent);
        
        const batchPromises = batch.map(async (accountId) => {
          try {
            const spend = await this.getAccountSpend(accountId);
            return { accountId, spend };
          } catch (error) {
            console.warn(`Failed to get spend for account ${accountId}:`, error);
            return { accountId, spend: 0 };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(({ accountId, spend }) => {
          spendData[accountId] = spend;
        });
      }

      return spendData;
    } catch (error) {
      console.error('Failed to fetch accounts spend data:', error);
      return {};
    }
  }

  // Get user's ad accounts with spend information
  async getAdAccounts(): Promise<FacebookAdAccount[]> {
    console.log('FacebookAPIService.getAdAccounts() called');
    console.log('Is authenticated:', this.isAuthenticated());
    
    if (!this.isAuthenticated()) {
      console.error('Not authenticated - throwing error');
      throw new Error('Not authenticated. Please set access token first.');
    }

    // Check cache first
    const cached = this.cache.getCachedAdAccounts();
    if (cached) {
      console.log('Returning cached ad accounts:', cached.length);
      return cached;
    }

    try {
      console.log('Making API call to:', FACEBOOK_API_ENDPOINTS.AD_ACCOUNTS);
      console.log('With fields:', FACEBOOK_FIELDS.AD_ACCOUNT);
      
      const response = await this.client.get<any>(
        FACEBOOK_API_ENDPOINTS.AD_ACCOUNTS,
        {
          fields: FACEBOOK_FIELDS.AD_ACCOUNT,
        }
      );

      console.log('API response received:', {
        hasData: !!response.data,
        hasDataArray: !!response.data?.data,
        dataLength: response.data?.data?.length || 0,
        responseStructure: Object.keys(response.data || {}),
        actualData: response.data
      });

      // Parse Facebook API response structure
      let accounts: FacebookAdAccount[] = [];
      
      console.log('Full response object:', response);
      console.log('Response.data type:', typeof response.data);
      console.log('Response.data is array:', Array.isArray(response.data));
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Standard Facebook API response: { data: [...] }
        accounts = response.data.data;
        console.log('Using nested data structure, found', accounts.length, 'accounts');
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array in data
        accounts = response.data;
        console.log('Using direct array response, found', accounts.length, 'accounts');
      } else if (Array.isArray(response)) {
        // Response is directly an array
        accounts = response;
        console.log('Using response as direct array, found', accounts.length, 'accounts');
      } else {
        console.warn('Unexpected response structure:', response);
        console.warn('Response keys:', Object.keys(response || {}));
        if (response.data) {
          console.warn('Response.data keys:', Object.keys(response.data || {}));
        }
        accounts = [];
      }
      console.log('Processed accounts:', accounts);
      
      // Fetch spend data for each account (in parallel) - skip for now to speed up loading
      console.log('Skipping spend data fetch for faster loading...');
      const accountsWithSpend = accounts.map(account => ({
        ...account,
        spend30Days: 0 // Will be loaded separately if needed
      }));

      console.log('Accounts with spend data:', accountsWithSpend.map(acc => ({
        id: acc.id,
        name: acc.name,
        spend30Days: acc.spend30Days
      })));
      
      // Cache the results (15 minutes TTL for ad accounts)
      this.cache.cacheAdAccounts(accountsWithSpend, 15 * 60 * 1000);

      return accountsWithSpend;
    } catch (error) {
      console.error('Failed to fetch ad accounts:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error(`Failed to fetch ad accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get campaigns for a specific ad account
  async getCampaigns(
    accountId: string, 
    options: {
      dateRange?: DateRange;
      status?: string[];
      fields?: string;
      limit?: number;
    } = {}
  ): Promise<FacebookCampaign[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      dateRange,
      status,
      fields = FACEBOOK_FIELDS.CAMPAIGN,
      limit = 100,
    } = options;

    try {
      const params: Record<string, any> = {
        fields,
        limit,
      };

      // Add status filter if provided
      if (status && status.length > 0) {
        params.filtering = JSON.stringify([
          {
            field: 'campaign.effective_status',
            operator: 'IN',
            value: status,
          },
        ]);
      }

      // Add date range filter if provided
      if (dateRange) {
        params.time_range = JSON.stringify({
          since: dateRange.since,
          until: dateRange.until,
        });
      }

      console.log('FacebookAPIService.getCampaigns() - Request params:', {
        accountId,
        params,
        statusFilter: status,
        dateRange
      });

      const response = await this.client.get<{ data: FacebookCampaign[] }>(
        FACEBOOK_API_ENDPOINTS.CAMPAIGNS(accountId),
        params
      );

      console.log('Raw getCampaigns response structure:', {
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        isDataArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        hasNestedData: !!(response.data && response.data.data),
        nestedDataLength: response.data && response.data.data ? response.data.data.length : 'N/A'
      });

      // Handle different response structures - same as getAllCampaigns
      let campaigns: FacebookCampaign[] = [];
      
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Standard nested structure: { data: { data: [...] } }
        campaigns = response.data.data;
        console.log('getCampaigns: Using nested data structure');
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array in data: { data: [...] }
        campaigns = response.data;
        console.log('getCampaigns: Using direct data array');
      } else if (Array.isArray(response)) {
        // Response is directly an array
        campaigns = response;
        console.log('getCampaigns: Using response as direct array');
      } else {
        console.warn('getCampaigns: Unexpected response structure:', response);
        campaigns = [];
      }

      console.log('FacebookAPIService.getCampaigns() - Final result:', {
        accountId,
        campaignsCount: campaigns.length,
        sampleCampaign: campaigns.length > 0 ? {
          id: campaigns[0].id,
          name: campaigns[0].name,
          status: campaigns[0].status
        } : null
      });

      return campaigns;
    } catch (error) {
      console.error(`Failed to fetch campaigns for account ${accountId}:`, error);
      throw new Error(`Failed to fetch campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get ad sets for a specific campaign
  async getAdSets(
    campaignId: string,
    options: {
      fields?: string;
      limit?: number;
    } = {}
  ): Promise<FacebookAdSet[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      fields = FACEBOOK_FIELDS.ADSET,
      limit = 100,
    } = options;

    try {
      const response = await this.client.get<{ data: FacebookAdSet[] }>(
        FACEBOOK_API_ENDPOINTS.ADSETS(campaignId),
        {
          fields,
          limit,
        }
      );

      console.log('=== getAdSets DEBUG ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));

      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        console.log('Using response.data (array)');
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Using response.data.data (nested array)');
        return response.data.data;
      } else if (response && Array.isArray(response)) {
        console.log('Using response (direct array)');
        return response;
      } else {
        console.warn('Unexpected response structure for ad sets:', response);
        return [];
      }
    } catch (error) {
      console.error(`Failed to fetch ad sets for campaign ${campaignId}:`, error);
      throw new Error(`Failed to fetch ad sets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get ads for a specific ad set
  async getAds(
    adSetId: string,
    options: {
      fields?: string;
      limit?: number;
    } = {}
  ): Promise<FacebookAd[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      fields = FACEBOOK_FIELDS.AD,
      limit = 100,
    } = options;

    try {
      const response = await this.client.get<{ data: FacebookAd[] }>(
        FACEBOOK_API_ENDPOINTS.ADS(adSetId),
        {
          fields,
          limit,
        }
      );

      console.log('=== getAds DEBUG ===');
      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Response data.data:', response.data.data);
      console.log('Response data type:', typeof response.data);
      console.log('Response data keys:', Object.keys(response.data || {}));

      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        console.log('Using response.data (array)');
        return response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        console.log('Using response.data.data (nested array)');
        return response.data.data;
      } else if (response && Array.isArray(response)) {
        console.log('Using response (direct array)');
        return response;
      } else {
        console.warn('Unexpected response structure for ads:', response);
        return [];
      }
    } catch (error) {
      console.error(`Failed to fetch ads for ad set ${adSetId}:`, error);
      throw new Error(`Failed to fetch ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get insights for any Facebook object (account, campaign, ad set, or ad)
  async getInsights(
    objectId: string,
    level: InsightLevel,
    options: {
      metrics?: string[];
      dateRange?: DateRange;
      breakdowns?: string[];
      limit?: number;
    } = {}
  ): Promise<FacebookInsights[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      metrics = FACEBOOK_INSIGHTS_METRICS as unknown as string[],
      dateRange,
      breakdowns,
      limit = 100,
    } = options;

    try {
      const params: Record<string, any> = {
        fields: metrics.join(','),
        level,
        limit,
      };

      // Add date range if provided
      if (dateRange) {
        params.time_range = JSON.stringify({
          since: dateRange.since,
          until: dateRange.until,
        });
      }

      // Add breakdowns if provided
      if (breakdowns && breakdowns.length > 0) {
        params.breakdowns = breakdowns.join(',');
      }

      const response = await this.client.get<{ data: FacebookInsights[] }>(
        FACEBOOK_API_ENDPOINTS.INSIGHTS(objectId),
        params
      );

      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch insights for object ${objectId}:`, error);
      throw new Error(`Failed to fetch insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get campaign insights with performance metrics
  async getCampaignInsights(
    campaignId: string,
    options: {
      dateRange?: DateRange;
      metrics?: string[];
    } = {}
  ): Promise<FacebookInsights[]> {
    return this.getInsights(campaignId, 'campaign', options);
  }

  // Get daily insights breakdown for campaigns
  async getDailyInsights(
    objectIds: string[],
    level: InsightLevel,
    options: {
      dateRange?: DateRange;
      metrics?: string[];
    } = {}
  ): Promise<{ [date: string]: { [objectId: string]: FacebookInsights } }> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      metrics = FACEBOOK_INSIGHTS_METRICS as unknown as string[],
      dateRange,
    } = options;

    try {
      const dailyData: { [date: string]: { [objectId: string]: FacebookInsights } } = {};

      // Process objects in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < objectIds.length; i += batchSize) {
        const batch = objectIds.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (objectId) => {
            try {
              const params: Record<string, any> = {
                fields: metrics.join(','),
                level,
                breakdowns: 'date_preset', // This gives us daily breakdown
                limit: 100
              };

              // Add date range if provided
              if (dateRange) {
                params.time_range = JSON.stringify({
                  since: dateRange.since,
                  until: dateRange.until,
                });
              }

              const response = await this.client.get<{ data: FacebookInsights[] }>(
                FACEBOOK_API_ENDPOINTS.INSIGHTS(objectId),
                params
              );

              // Process daily data
              response.data.data?.forEach((insight) => {
                if (insight.date_start) {
                  const date = insight.date_start;
                  if (!dailyData[date]) {
                    dailyData[date] = {};
                  }
                  dailyData[date][objectId] = insight;
                }
              });

              // Add delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
              console.warn(`Failed to get daily insights for ${objectId}:`, error);
            }
          })
        );

        // Add longer delay between batches
        if (i + batchSize < objectIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return dailyData;
    } catch (error) {
      console.error('Failed to fetch daily insights:', error);
      throw new Error(`Failed to fetch daily insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get account-level insights
  async getAccountInsights(
    accountId: string,
    options: {
      dateRange?: DateRange;
      metrics?: string[];
    } = {}
  ): Promise<FacebookInsights[]> {
    return this.getInsights(accountId, 'account', options);
  }

  // Batch request functionality for efficient data fetching
  async batchRequest<T = any>(requests: BatchRequestItem[]): Promise<BatchResponse<T>[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    if (requests.length === 0) {
      return [];
    }

    if (requests.length > this.config.batchSize!) {
      throw new Error(`Batch size cannot exceed ${this.config.batchSize} requests`);
    }

    try {
      const response = await this.client.batch<BatchResponse<T>>(requests);
      
      console.log('Batch response structure:', {
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        responseKeys: Object.keys(response || {}),
        actualResponse: response
      });
      
      // Handle different response structures
      let batchData: BatchResponse<T>[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        batchData = response.data;
      } else if (Array.isArray(response)) {
        batchData = response;
      } else {
        console.error('Unexpected batch response structure:', response);
        throw new Error('Invalid batch response structure');
      }
      
      // Parse batch response bodies
      const parsedResponses = batchData.map((batchResponse) => {
        try {
          const parsedBody = JSON.parse(batchResponse.body);
          return {
            ...batchResponse,
            data: parsedBody,
          };
        } catch (parseError) {
          console.warn('Failed to parse batch response body:', batchResponse.body);
          return batchResponse;
        }
      });

      return parsedResponses;
    } catch (error) {
      console.error('Batch request failed:', error);
      throw new Error(`Batch request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get campaigns with insights in a single batch request
  async getCampaignsWithInsights(
    accountId: string,
    options: {
      dateRange?: DateRange;
      status?: string[];
      limit?: number;
    } = {}
  ): Promise<FacebookCampaign[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    try {
      // First, get campaigns
      console.log('getCampaignsWithInsights: Getting campaigns for account', accountId);
      const campaigns = await this.getCampaigns(accountId, options);
      console.log('getCampaignsWithInsights: Got', campaigns.length, 'campaigns');

      if (campaigns.length === 0) {
        console.log('getCampaignsWithInsights: No campaigns found, returning empty array');
        return campaigns;
      }

      // Process campaigns in batches to respect API limits
      const batchSize = Math.min(this.config.batchSize || 50, 50); // Max 50 per batch
      const campaignsWithInsights: FacebookCampaign[] = [];
      
      console.log(`Processing ${campaigns.length} campaigns in batches of ${batchSize}`);
      
      for (let i = 0; i < campaigns.length; i += batchSize) {
        const batch = campaigns.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}: campaigns ${i + 1}-${Math.min(i + batchSize, campaigns.length)}`);
        
        // Create batch requests for this batch
        const insightRequests: BatchRequestItem[] = batch.map((campaign) => {
          const params = new URLSearchParams({
            fields: FACEBOOK_INSIGHTS_METRICS.join(','),
            level: 'campaign',
          });

          if (options.dateRange) {
            params.append('time_range', JSON.stringify({
              since: options.dateRange.since,
              until: options.dateRange.until,
            }));
          }

          return {
            method: 'GET',
            relative_url: `${campaign.id}/insights?${params.toString()}`,
          };
        });

        try {
          // Execute batch request for this batch
          const batchResponses = await this.batchRequest<{ data: FacebookInsights[] }>(insightRequests);

          // Merge insights with campaigns for this batch
          const batchWithInsights = batch.map((campaign, index) => {
            const batchResponse = batchResponses[index];
            
            if (batchResponse.code === 200 && batchResponse.data?.data) {
              const insights = batchResponse.data.data[0]; // Take first insight record
              return {
                ...campaign,
                insights,
              };
            }

            return campaign;
          });
          
          campaignsWithInsights.push(...batchWithInsights);
          console.log(`Batch ${Math.floor(i / batchSize) + 1} completed: ${batchWithInsights.length} campaigns processed`);
          
        } catch (error) {
          console.error(`Failed to process batch ${Math.floor(i / batchSize) + 1}:`, error);
          // Add campaigns without insights if batch fails
          campaignsWithInsights.push(...batch);
        }
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < campaigns.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`getCampaignsWithInsights completed: ${campaignsWithInsights.length} campaigns with insights`);
      return campaignsWithInsights;
      
    } catch (error) {
      console.error(`Failed to fetch campaigns with insights for account ${accountId}:`, error);
      
      // Fallback: return campaigns without insights
      console.log('Falling back to campaigns without insights');
      const fallbackCampaigns = await this.getCampaigns(accountId, options);
      console.log(`Fallback: returning ${fallbackCampaigns.length} campaigns without insights`);
      return fallbackCampaigns;
    }
  }

  // Get all data for multiple accounts efficiently
  async getAccountsData(
    accountIds: string[],
    options: {
      dateRange?: DateRange;
      includeInsights?: boolean;
      campaignStatus?: string[];
    } = {}
  ): Promise<Record<string, {
    account: FacebookAdAccount;
    campaigns: FacebookCampaign[];
  }>> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    if (accountIds.length === 0) {
      return {};
    }

    try {
      // Get all accounts first
      const allAccounts = await this.getAdAccounts();
      const requestedAccounts = allAccounts.filter(account => 
        accountIds.includes(account.id)
      );

      const results: Record<string, {
        account: FacebookAdAccount;
        campaigns: FacebookCampaign[];
      }> = {};

      // Process accounts in parallel
      const accountPromises = requestedAccounts.map(async (account) => {
        try {
          let campaigns: FacebookCampaign[];

          if (options.includeInsights) {
            campaigns = await this.getCampaignsWithInsights(account.id, {
              dateRange: options.dateRange,
              status: options.campaignStatus,
            });
          } else {
            campaigns = await this.getCampaigns(account.id, {
              dateRange: options.dateRange,
              status: options.campaignStatus,
            });
          }

          results[account.id] = {
            account,
            campaigns,
          };
        } catch (error) {
          console.error(`Failed to fetch data for account ${account.id}:`, error);
          // Still include the account with empty campaigns
          results[account.id] = {
            account,
            campaigns: [],
          };
        }
      });

      await Promise.all(accountPromises);

      return results;
    } catch (error) {
      console.error('Failed to fetch accounts data:', error);
      throw new Error(`Failed to fetch accounts data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      return await this.client.healthCheck();
    } catch (error) {
      return false;
    }
  }

  // Get service status
  getStatus(): {
    isAuthenticated: boolean;
    rateLimiter: { canMakeRequest: boolean; retryAfter: number };
    circuitBreaker: { state: string; canExecute: boolean };
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      rateLimiter: this.client.getRateLimiterStatus(),
      circuitBreaker: this.client.getCircuitBreakerStatus(),
    };
  }

  // Reset client state (useful for testing)
  reset(): void {
    this.client.resetRateLimiter();
    this.client.resetCircuitBreaker();
  }

  // Paginated data fetching with automatic pagination handling and caching
  async getAllCampaigns(
    accountId: string,
    options: {
      dateRange?: DateRange;
      status?: string[];
      fields?: string;
      pageSize?: number;
      useCache?: boolean;
    } = {}
  ): Promise<FacebookCampaign[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      dateRange,
      status,
      fields = FACEBOOK_FIELDS.CAMPAIGN,
      pageSize = 100,
      useCache = true,
    } = options;

    // Check cache first if enabled
    if (useCache) {
      const cached = this.cache.getCachedCampaigns(accountId, dateRange);
      if (cached) {
        // Apply status filter to cached data if needed
        if (status && status.length > 0) {
          return cached.filter(campaign => status.includes(campaign.status));
        }
        return cached;
      }
    }

    const allCampaigns: FacebookCampaign[] = [];
    let after: string | undefined;
    let hasNext = true;
    let pageCount = 0;
    const maxPages = 100; // Prevent infinite loops

    try {
      while (hasNext && pageCount < maxPages) {
        const params: Record<string, any> = {
          fields,
          limit: pageSize,
        };

        // Add pagination cursor
        if (after) {
          params.after = after;
        }

        // Add status filter if provided
        if (status && status.length > 0) {
          params.filtering = JSON.stringify([
            {
              field: 'campaign.effective_status',
              operator: 'IN',
              value: status,
            },
          ]);
          console.log('Adding status filter:', status);
        } else {
          console.log('No status filter applied - fetching all campaigns');
        }

        // Add date range filter if provided
        if (dateRange) {
          params.time_range = JSON.stringify({
            since: dateRange.since,
            until: dateRange.until,
          });
        }

        const response = await this.client.get<{
          data: FacebookCampaign[];
          paging?: {
            cursors?: { after?: string };
            next?: string;
          };
        }>(FACEBOOK_API_ENDPOINTS.CAMPAIGNS(accountId), params);

        console.log('Raw API response structure:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          isDataArray: Array.isArray(response.data),
          dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
          hasNestedData: !!(response.data && response.data.data),
          nestedDataLength: response.data && response.data.data ? response.data.data.length : 'N/A'
        });

        // Handle different response structures
        let campaigns: FacebookCampaign[] = [];
        
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          // Standard nested structure: { data: { data: [...] } }
          campaigns = response.data.data;
          console.log('Using nested data structure');
        } else if (response.data && Array.isArray(response.data)) {
          // Direct array in data: { data: [...] }
          campaigns = response.data;
          console.log('Using direct data array');
        } else if (Array.isArray(response)) {
          // Response is directly an array
          campaigns = response;
          console.log('Using response as direct array');
        } else {
          console.warn('Unexpected response structure:', response);
          campaigns = [];
        }

        console.log(`Page ${pageCount + 1} for account ${accountId}: ${campaigns.length} campaigns`);
        
        if (campaigns.length > 0) {
          console.log('Sample campaign:', {
            id: campaigns[0].id,
            name: campaigns[0].name,
            status: campaigns[0].status,
            objective: campaigns[0].objective
          });
        }
        
        allCampaigns.push(...campaigns);

        // Cache individual pages for faster subsequent access
        if (useCache && campaigns.length > 0) {
          const cacheKey = `campaigns_${accountId}_page`;
          this.cache.cachePaginatedData(cacheKey, campaigns, after);
        }

        // Check for next page - handle different response structures
        let paging;
        if (response.data && response.data.paging) {
          paging = response.data.paging;
        } else if (response.paging) {
          paging = response.paging;
        }

        hasNext = !!(paging?.next && paging?.cursors?.after);
        after = paging?.cursors?.after;
        
        console.log('Pagination info:', {
          hasNext,
          after,
          nextUrl: paging?.next
        });
        pageCount++;

        // Prevent infinite loops
        if (campaigns.length === 0) {
          hasNext = false;
        }

        // Add small delay between requests to respect rate limits
        if (hasNext && pageCount > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`getAllCampaigns final result for ${accountId}: ${allCampaigns.length} campaigns`);
      
      // Cache the complete result if enabled
      if (useCache && allCampaigns.length > 0) {
        this.cache.cacheCampaigns(accountId, allCampaigns, dateRange);
      }

      return allCampaigns;
    } catch (error) {
      console.error(`Failed to fetch all campaigns for account ${accountId}:`, error);
      throw new Error(`Failed to fetch all campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Comprehensive data synchronization method
  async syncAllData(options: SyncOptions): Promise<FacebookSyncResult> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please set access token first.');
    }

    const {
      accountIds,
      dateRange,
      includeInsights = this.config.includeInsights,
      campaignStatus,
      onProgress,
    } = options;

    if (accountIds.length === 0) {
      throw new Error('No valid accounts found for the provided account IDs');
    }

    const startTime = new Date();
    const errors: string[] = [];
    const allCampaigns: FacebookCampaign[] = [];
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;

    // Initialize progress tracking
    const progress: SyncProgress = {
      phase: 'accounts',
      accountsProcessed: 0,
      totalAccounts: accountIds.length,
      campaignsProcessed: 0,
      totalCampaigns: 0,
      errors,
      startTime,
    };

    try {
      // Phase 1: Fetch account information
      onProgress?.(progress);
      
      const allAccounts = await this.getAdAccounts();
      const requestedAccounts = allAccounts.filter(account => 
        accountIds.includes(account.id)
      );

      if (requestedAccounts.length === 0) {
        throw new Error('No valid accounts found for the provided account IDs');
      }

      // Phase 2: Fetch campaigns for each account
      progress.phase = 'campaigns';
      progress.totalAccounts = requestedAccounts.length;
      onProgress?.(progress);

      // Process accounts with controlled concurrency
      const accountResults = await this.processAccountsConcurrently(
        requestedAccounts,
        {
          dateRange,
          campaignStatus,
          includeInsights: includeInsights, // Include insights in the main fetch
        },
        progress,
        onProgress
      );

      // Collect campaigns from account processing
      console.log('Account results:', accountResults.map(r => ({
        accountId: r.account.id,
        campaignsCount: r.campaigns.length
      })));
      
      accountResults.forEach((result) => {
        console.log(`Adding ${result.campaigns.length} campaigns from account ${result.account.id}`);
        allCampaigns.push(...result.campaigns);
      });

      console.log(`Total campaigns collected: ${allCampaigns.length}`);
      progress.totalCampaigns = allCampaigns.length;
      progress.campaignsProcessed = 0;

      // Phase 3: Insights are already fetched in getCampaignsWithInsights
      // No need to fetch again if includeInsights was true
      console.log('Insights already included in campaigns, skipping separate insights fetch');

      // Calculate totals from insights - ensure numeric conversion
      allCampaigns.forEach(campaign => {
        if (campaign.insights) {
          totalSpend += parseFloat(campaign.insights.spend || '0') || 0;
          totalImpressions += parseInt(campaign.insights.impressions || '0') || 0;
          totalClicks += parseInt(campaign.insights.clicks || '0') || 0;
        }
      });

      // Phase 4: Complete
      progress.phase = 'complete';
      progress.campaignsProcessed = allCampaigns.length;
      onProgress?.(progress);

      const syncResult: FacebookSyncResult = {
        campaigns: allCampaigns,
        totalSpend,
        totalImpressions,
        totalClicks,
        syncTimestamp: new Date(),
        errors,
      };

      console.log('Final sync result:', {
        campaignsCount: syncResult.campaigns.length,
        totalSpend: syncResult.totalSpend,
        totalImpressions: syncResult.totalImpressions,
        totalClicks: syncResult.totalClicks,
        errorsCount: syncResult.errors.length
      });

      return syncResult;

    } catch (error) {
      const errorMessage = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMessage);
      console.error('Sync operation failed:', error);

      // Return partial results even on failure
      return {
        campaigns: allCampaigns,
        totalSpend,
        totalImpressions,
        totalClicks,
        syncTimestamp: new Date(),
        errors,
      };
    }
  }

  // Process accounts with controlled concurrency
  private async processAccountsConcurrently(
    accounts: FacebookAdAccount[],
    options: {
      dateRange?: DateRange;
      campaignStatus?: string[];
      includeInsights?: boolean;
    },
    progress: SyncProgress,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<Array<{ account: FacebookAdAccount; campaigns: FacebookCampaign[] }>> {
    const maxConcurrent = this.config.maxConcurrentRequests || 5;
    const results: Array<{ account: FacebookAdAccount; campaigns: FacebookCampaign[] }> = [];
    
    // Process accounts in batches to control concurrency
    for (let i = 0; i < accounts.length; i += maxConcurrent) {
      const batch = accounts.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (account) => {
        try {
          progress.currentAccount = account.name;
          onProgress?.(progress);

          console.log('Processing account:', account.id, 'with options:', {
            dateRange: options.dateRange,
            campaignStatus: options.campaignStatus
          });

          let campaigns: FacebookCampaign[];
          
          if (options.includeInsights) {
            campaigns = await this.getCampaignsWithInsights(account.id, {
              dateRange: options.dateRange,
              status: options.campaignStatus,
            });
          } else {
            campaigns = await this.getAllCampaigns(account.id, {
              dateRange: options.dateRange,
              status: options.campaignStatus,
            });
          }

          console.log(`Account ${account.id} returned ${campaigns.length} campaigns with insights: ${options.includeInsights}`);

          progress.accountsProcessed++;
          onProgress?.(progress);

          return { account, campaigns };
        } catch (error) {
          progress.accountsProcessed++;
          progress.errors.push(`Failed to process account ${account.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          onProgress?.(progress);
          
          return { account, campaigns: [] };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Fetch insights for campaigns with progress tracking
  private async fetchInsightsForCampaigns(
    campaigns: FacebookCampaign[],
    options: { dateRange?: DateRange },
    progress: SyncProgress,
    onProgress?: (progress: SyncProgress) => void
  ): Promise<void> {
    const batchSize = Math.min(this.config.batchSize || 50, 50); // Max 50 per batch
    
    // Process campaigns in batches
    for (let i = 0; i < campaigns.length; i += batchSize) {
      const batch = campaigns.slice(i, i + batchSize);
      
      try {
        // Create batch requests for insights
        const insightRequests: BatchRequestItem[] = batch.map((campaign) => {
          const params = new URLSearchParams({
            fields: FACEBOOK_INSIGHTS_METRICS.join(','),
            level: 'campaign',
          });

          if (options.dateRange) {
            params.append('time_range', JSON.stringify({
              since: options.dateRange.since,
              until: options.dateRange.until,
            }));
          }

          return {
            method: 'GET',
            relative_url: `${campaign.id}/insights?${params.toString()}`,
          };
        });

        // Execute batch request
        console.log(`Fetching insights for batch ${Math.floor(i / batchSize) + 1}: ${batch.length} campaigns`);
        const batchResponses = await this.batchRequest<{ data: FacebookInsights[] }>(insightRequests);

        // Merge insights with campaigns
        batch.forEach((campaign, index) => {
          const batchResponse = batchResponses[index];
          
          if (batchResponse && batchResponse.code === 200 && batchResponse.data?.data) {
            const insights = batchResponse.data.data[0]; // Take first insight record
            campaign.insights = insights;
          } else {
            console.warn(`No insights data for campaign ${campaign.id}:`, batchResponse);
          }

          progress.campaignsProcessed++;
        });

        onProgress?.(progress);
        console.log(`Batch ${Math.floor(i / batchSize) + 1} insights completed`);

      } catch (error) {
        // Log error but continue processing
        const errorMessage = `Failed to fetch insights for batch starting at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        progress.errors.push(errorMessage);
        console.error(errorMessage, error);

        // Still update progress for failed batch
        progress.campaignsProcessed += batch.length;
        onProgress?.(progress);
      }
    }
  }

  // Estimate sync duration based on data size
  estimateSyncDuration(accountIds: string[], includeInsights = true): Promise<number> {
    // Simple estimation based on number of accounts and whether insights are included
    const baseTimePerAccount = 2000; // 2 seconds per account
    const insightsMultiplier = includeInsights ? 2 : 1;
    
    return Promise.resolve(accountIds.length * baseTimePerAccount * insightsMultiplier);
  }

  // Cancel ongoing sync operation (basic implementation)
  private syncAbortController?: AbortController;

  cancelSync(): void {
    if (this.syncAbortController) {
      this.syncAbortController.abort();
      this.syncAbortController = undefined;
    }
  }

  // Check if sync is currently running
  isSyncRunning(): boolean {
    return !!this.syncAbortController && !this.syncAbortController.signal.aborted;
  }
}

// Create singleton instance
let serviceInstance: FacebookAPIService | null = null;

// Factory function to get service instance
export function getFacebookAPIService(config?: FacebookAPIServiceConfig): FacebookAPIService {
  if (!serviceInstance) {
    serviceInstance = new FacebookAPIService(undefined, config);
  }
  
  return serviceInstance;
}

// Reset singleton instance (useful for testing)
export function resetFacebookAPIService(): void {
  serviceInstance = null;
}