// Facebook API Constants and Endpoints

// Base URLs
export const FACEBOOK_BASE_URL = 'https://www.facebook.com';
export const FACEBOOK_GRAPH_API_BASE_URL = 'https://graph.facebook.com';

// API Version Configuration
export const API_VERSIONS = {
  CURRENT: 'v19.0',
  SUPPORTED: ['v18.0', 'v19.0'],
  DEPRECATED: ['v17.0', 'v16.0'],
} as const;

// OAuth Endpoints
export const FACEBOOK_OAUTH_ENDPOINTS = {
  AUTHORIZE: `${FACEBOOK_BASE_URL}/dialog/oauth`,
  TOKEN: `${FACEBOOK_GRAPH_API_BASE_URL}/oauth/access_token`,
  REVOKE: `${FACEBOOK_GRAPH_API_BASE_URL}/me/permissions`,
} as const;

// Graph API Endpoints
export const FACEBOOK_API_ENDPOINTS = {
  // User and Account endpoints
  ME: '/me',
  AD_ACCOUNTS: '/me/adaccounts',
  BUSINESSES: '/me/businesses',
  
  // Campaign structure endpoints
  CAMPAIGNS: (accountId: string) => `/${accountId}/campaigns`,
  ADSETS: (campaignId: string) => `/${campaignId}/adsets`,
  ADS: (adsetId: string) => `/${adsetId}/ads`,
  
  // Insights and reporting endpoints
  INSIGHTS: (objectId: string) => `/${objectId}/insights`,
  ACCOUNT_INSIGHTS: (accountId: string) => `/${accountId}/insights`,
  CAMPAIGN_INSIGHTS: (campaignId: string) => `/${campaignId}/insights`,
  ADSET_INSIGHTS: (adsetId: string) => `/${adsetId}/insights`,
  AD_INSIGHTS: (adId: string) => `/${adId}/insights`,
  
  // Batch and utility endpoints
  BATCH: '/batch',
  DEBUG_TOKEN: '/debug_token',
  
  // Creative endpoints
  CREATIVES: (adId: string) => `/${adId}/creatives`,
  AD_CREATIVES: (accountId: string) => `/${accountId}/adcreatives`,
} as const;

// API Field Sets
export const FACEBOOK_FIELDS = {
  AD_ACCOUNT: [
    'id',
    'name',
    'currency',
    'timezone_name',
    'account_status',
    'business_name',
    'business',
  ].join(','),
  
  CAMPAIGN: [
    'id',
    'name',
    'status',
    'objective',
    'created_time',
    'updated_time',
    'account_id',
    'daily_budget',
    'lifetime_budget',
  ].join(','),
  
  ADSET: [
    'id',
    'name',
    'status',
    'campaign_id',
    'daily_budget',
    'lifetime_budget',
    'targeting',
    'created_time',
    'updated_time',
  ].join(','),
  
  AD: [
    'id',
    'name',
    'status',
    'campaign_id',
    'adset_id',
    'creative',
    'created_time',
    'updated_time',
  ].join(','),
  
  CREATIVE: [
    'id',
    'title',
    'body',
    'image_url',
    'video_id',
    'call_to_action',
  ].join(','),
} as const;

// Insights Metrics
export const FACEBOOK_INSIGHTS_METRICS = [
  'impressions',
  'clicks',
  'spend',
  'reach',
  'frequency',
  'cpm',
  'cpc',
  'ctr',
  'actions',
  'cost_per_action_type',
] as const;

// Insights Breakdowns
export const FACEBOOK_INSIGHTS_BREAKDOWNS = {
  AGE: 'age',
  GENDER: 'gender',
  COUNTRY: 'country',
  REGION: 'region',
  PLACEMENT: 'publisher_platform',
  DEVICE: 'impression_device',
  DATE: 'date_preset',
} as const;

// Date Presets
export const FACEBOOK_DATE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  THIS_WEEK: 'this_week_mon_today',
  LAST_WEEK: 'last_week_mon_sun',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  LAST_3_DAYS: 'last_3d',
  LAST_7_DAYS: 'last_7d',
  LAST_14_DAYS: 'last_14d',
  LAST_30_DAYS: 'last_30d',
  LAST_90_DAYS: 'last_90d',
  LIFETIME: 'lifetime',
} as const;

// Campaign Objectives
export const FACEBOOK_CAMPAIGN_OBJECTIVES = {
  AWARENESS: 'BRAND_AWARENESS',
  REACH: 'REACH',
  TRAFFIC: 'LINK_CLICKS',
  ENGAGEMENT: 'ENGAGEMENT',
  APP_INSTALLS: 'APP_INSTALLS',
  VIDEO_VIEWS: 'VIDEO_VIEWS',
  LEAD_GENERATION: 'LEAD_GENERATION',
  MESSAGES: 'MESSAGES',
  CONVERSIONS: 'CONVERSIONS',
  CATALOG_SALES: 'PRODUCT_CATALOG_SALES',
  STORE_VISITS: 'STORE_VISITS',
} as const;

// Status Constants
export const FACEBOOK_STATUS = {
  CAMPAIGN: {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    DELETED: 'DELETED',
    ARCHIVED: 'ARCHIVED',
  },
  ADSET: {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    DELETED: 'DELETED',
    ARCHIVED: 'ARCHIVED',
  },
  AD: {
    ACTIVE: 'ACTIVE',
    PAUSED: 'PAUSED',
    DELETED: 'DELETED',
    ARCHIVED: 'ARCHIVED',
  },
} as const;

// Error Codes
export const FACEBOOK_ERROR_CODES = {
  // Authentication Errors
  INVALID_ACCESS_TOKEN: 190,
  ACCESS_TOKEN_EXPIRED: 463,
  INSUFFICIENT_PERMISSIONS: 200,
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 17,
  USER_REQUEST_LIMIT_REACHED: 613,
  
  // API Errors
  INVALID_PARAMETER: 100,
  MISSING_PARAMETER: 2500,
  UNKNOWN_ERROR: 1,
  TEMPORARILY_UNAVAILABLE: 2,
  
  // Account Errors
  ACCOUNT_DISABLED: 368,
  ACCOUNT_RESTRICTED: 80004,
} as const;

// Rate Limiting Constants
export const RATE_LIMITING = {
  DEFAULT_REQUESTS_PER_HOUR: 200,
  BATCH_SIZE_LIMIT: 50,
  RETRY_AFTER_DEFAULT: 300, // 5 minutes in seconds
  EXPONENTIAL_BACKOFF_BASE: 2,
  MAX_RETRY_ATTEMPTS: 3,
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
  DEFAULT_AFTER: '',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  FACEBOOK_TOKENS: 'facebook_tokens',
  FACEBOOK_CONNECTION_DATA: 'facebook_connection_data',
  FACEBOOK_SYNC_HISTORY: 'facebook_sync_history',
  FACEBOOK_PREFERENCES: 'facebook_preferences',
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  DEFAULT_INTERVAL_MINUTES: 60,
  MIN_INTERVAL_MINUTES: 15,
  MAX_INTERVAL_MINUTES: 1440, // 24 hours
  BATCH_SIZE: 25,
  CONCURRENT_REQUESTS: 5,
  TIMEOUT_MS: 30000,
} as const;

// OAuth Configuration Constants
export const OAUTH_CONSTANTS = {
  POPUP_FEATURES: 'width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no',
  POPUP_TIMEOUT_MS: 300000, // 5 minutes
  STATE_STORAGE_KEY: 'facebook_oauth_state',
  CODE_VERIFIER_STORAGE_KEY: 'facebook_code_verifier',
  RESPONSE_TYPE: 'code',
  STATE_LENGTH: 32,
  CODE_CHALLENGE_METHOD: 'S256',
  CODE_VERIFIER_LENGTH: 128,
} as const;

// Default Permissions/Scopes
export const FACEBOOK_PERMISSIONS = {
  ADS_READ: 'ads_read',
  ADS_MANAGEMENT: 'ads_management',
  BUSINESS_MANAGEMENT: 'business_management',
  PAGES_READ_ENGAGEMENT: 'pages_read_engagement',
} as const;

// Default Configuration Values (as specified in design document)
export const DEFAULT_CONFIG = {
  API_VERSION: 'v19.0',
  SCOPES: ['ads_read', 'ads_management'],
  SYNC_INTERVAL: 60, // minutes
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 30000, // milliseconds
  POPUP_WIDTH: 600,
  POPUP_HEIGHT: 700,
} as const;

// Data Transformation Constants
export const DATA_MAPPING = {
  PLATFORM_NAME: 'Facebook',
  CURRENCY_DEFAULT: 'USD',
  TIMEZONE_DEFAULT: 'UTC',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DDTHH:mm:ssZ',
} as const;

// HTTP Configuration Constants
export const HTTP_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  RETRY_TIMEOUT: 5000, // 5 seconds
  MAX_RETRIES: 3,
  RETRY_STATUS_CODES: [429, 500, 502, 503, 504],
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute
} as const;

// Request Configuration
export const REQUEST_CONFIG = {
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  USER_AGENT: 'Affilitics.me/1.0',
  API_TIMEOUT: 30000,
} as const;

// Validation Constants
export const VALIDATION_RULES = {
  MIN_CAMPAIGN_NAME_LENGTH: 1,
  MAX_CAMPAIGN_NAME_LENGTH: 400,
  MIN_BUDGET: 1,
  MAX_BUDGET: 999999999,
  DATE_RANGE_MAX_DAYS: 365,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_BATCH_REQUESTS: true,
  ENABLE_CIRCUIT_BREAKER: true,
  ENABLE_REQUEST_CACHING: true,
  ENABLE_DEBUG_LOGGING: false,
  ENABLE_PERFORMANCE_MONITORING: true,
} as const;