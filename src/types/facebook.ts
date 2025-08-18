// Facebook API Data Models and Types

export interface FacebookTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
  scope: string[];
}

export interface FacebookAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  accountStatus: string;
  businessName?: string;
  businessId?: string;
  spend30Days?: number;
}

export interface FacebookCampaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  objective: string;
  created_time: string;
  updated_time: string;
  account_id: string;
  daily_budget?: number;
  lifetime_budget?: number;
  insights?: FacebookInsights;
}

export interface FacebookAdSet {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  campaign_id: string;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: FacebookTargeting;
  created_time: string;
  updated_time: string;
}

export interface FacebookAd {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED';
  campaign_id: string;
  adset_id: string;
  creative: FacebookCreative;
  insights?: FacebookInsights;
  created_time: string;
  updated_time: string;
}

export interface FacebookCreative {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  video_url?: string;
  call_to_action?: {
    type: string;
    value: {
      link?: string;
      application?: string;
    };
  };
}

export interface FacebookInsights {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  date_start: string;
  date_stop: string;
  actions?: FacebookAction[];
  cost_per_action_type?: FacebookCostPerAction[];
}

export interface FacebookAction {
  action_type: string;
  value: number;
}

export interface FacebookCostPerAction {
  action_type: string;
  value: number;
}

export interface FacebookTargeting {
  age_min?: number;
  age_max?: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string; name: string }>;
    cities?: Array<{ key: string; name: string; radius?: number }>;
  };
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  custom_audiences?: Array<{ id: string; name: string }>;
}// Ser
vice and API Response Types

export interface FacebookSyncResult {
  campaigns: FacebookCampaign[];
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  syncTimestamp: Date;
  errors: string[];
}

export interface FacebookConnectionState {
  isConnected: boolean;
  connectedAccounts: FacebookAdAccount[];
  lastSyncTime?: Date;
  syncStatus: 'idle' | 'syncing' | 'error';
  error?: string;
}

export interface FacebookConnectionData {
  tokens: FacebookTokens;
  connectedAccounts: FacebookAdAccount[];
  preferences: {
    autoSync: boolean;
    syncInterval: number; // minutes
    selectedAccounts: string[];
  };
  lastSync: Date;
}

export interface SyncHistory {
  id: string;
  timestamp: Date;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  errors: string[];
  duration: number; // milliseconds
}

// API Error Types

export interface FacebookAPIError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
}

export interface AuthError extends Error {
  code: string;
  type: 'auth_error';
  cause?: any;
}

export interface APIError extends Error {
  code: number;
  type: 'api_error';
  subcode?: number;
  fbtrace_id?: string;
}

export interface DataError extends Error {
  type: 'data_error';
  field?: string;
}

// Utility Types

export type InsightLevel = 'account' | 'campaign' | 'adset' | 'ad';

export interface DateRange {
  since: string; // YYYY-MM-DD format
  until: string; // YYYY-MM-DD format
}

export interface FacebookConfig {
  FACEBOOK_APP_ID: string;
  FACEBOOK_API_VERSION: string;
  FACEBOOK_REDIRECT_URI: string;
  FACEBOOK_SCOPES: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TransformedData {
  campaigns: any[]; // Will match existing dashboard data structure
  ads: any[];
  insights: any[];
  metadata: DataMetadata;
}

export interface DataMetadata {
  source: 'facebook_api';
  transformedAt: Date;
  originalRecordCount: number;
  transformedRecordCount: number;
  dataVersion: string;
}