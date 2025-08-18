import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FacebookDataTransformer, 
  DashboardCampaign,
  CurrencyConversionRates,
  TransformationOptions 
} from '../facebook-data-transformer';
import { FacebookSyncResult, FacebookCampaign, FacebookInsights } from '@/types/facebook';

describe('FacebookDataTransformer', () => {
  let transformer: FacebookDataTransformer;
  let mockFacebookData: FacebookSyncResult;
  let mockCampaign: FacebookCampaign;

  beforeEach(() => {
    transformer = new FacebookDataTransformer();
    
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

    mockCampaign = {
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

    mockFacebookData = {
      campaigns: [mockCampaign],
      totalSpend: 1000,
      totalImpressions: 10000,
      totalClicks: 500,
      syncTimestamp: new Date('2024-01-31T12:00:00Z'),
      errors: []
    };
  });

  describe('transformFacebookData', () => {
    it('should transform Facebook data to dashboard format', () => {
      const result = transformer.transformFacebookData(mockFacebookData);

      expect(result.campaigns).toHaveLength(1);
      expect(result.metadata.source).toBe('facebook_api');
      expect(result.metadata.originalRecordCount).toBe(1);
      expect(result.metadata.transformedRecordCount).toBe(1);
    });

    it('should handle empty campaigns array', () => {
      const emptyData: FacebookSyncResult = {
        ...mockFacebookData,
        campaigns: []
      };

      const result = transformer.transformFacebookData(emptyData);

      expect(result.campaigns).toHaveLength(0);
      expect(result.metadata.originalRecordCount).toBe(0);
      expect(result.metadata.transformedRecordCount).toBe(0);
    });

    it('should apply transformation options', () => {
      const options: TransformationOptions = {
        estimateCommissionRate: 0.1, // 10%
        estimateOrdersFromClicks: true
      };

      const result = transformer.transformFacebookData(mockFacebookData, options);
      const campaign = result.campaigns[0];

      expect(campaign.commission).toBe(100); // 1000 * 0.1
      expect(campaign.orders).toBe(10); // 500 clicks * 0.02 conversion rate
    });
  });

  describe('campaign transformation', () => {
    it('should correctly transform a Facebook campaign', () => {
      const result = transformer.transformFacebookData(mockFacebookData);
      const campaign = result.campaigns[0];

      expect(campaign.name).toBe('Test Campaign');
      expect(campaign.platform).toBe('Facebook');
      expect(campaign.subId).toBe('fb_conversions_23456789');
      expect(campaign.orders).toBe(10); // 500 clicks * 0.02
      expect(campaign.commission).toBe(50); // 1000 * 0.05
      expect(campaign.adSpend).toBe(1000);
      expect(campaign.roi).toBe(-95); // ((50 - 1000) / 1000) * 100
      expect(campaign.status).toBe('active');
      expect(campaign.startDate).toBe('2024-01-01');
      expect(campaign.performance).toBe('poor'); // ROI < 0
    });

    it('should handle campaigns without insights', () => {
      const campaignWithoutInsights: FacebookCampaign = {
        ...mockCampaign,
        insights: undefined
      };

      const dataWithoutInsights: FacebookSyncResult = {
        ...mockFacebookData,
        campaigns: [campaignWithoutInsights]
      };

      const result = transformer.transformFacebookData(dataWithoutInsights);
      const campaign = result.campaigns[0];

      expect(campaign.adSpend).toBe(0);
      expect(campaign.orders).toBe(0);
      expect(campaign.commission).toBe(0);
      expect(campaign.roi).toBe(0);
    });

    it('should map Facebook statuses correctly', () => {
      const statuses = [
        { facebook: 'ACTIVE', expected: 'active' },
        { facebook: 'PAUSED', expected: 'paused' },
        { facebook: 'DELETED', expected: 'ended' },
        { facebook: 'ARCHIVED', expected: 'ended' }
      ];

      statuses.forEach(({ facebook, expected }) => {
        const campaign: FacebookCampaign = {
          ...mockCampaign,
          status: facebook as any
        };

        const data: FacebookSyncResult = {
          ...mockFacebookData,
          campaigns: [campaign]
        };

        const result = transformer.transformFacebookData(data);
        expect(result.campaigns[0].status).toBe(expected);
      });
    });

    it('should calculate performance ratings correctly', () => {
      const testCases = [
        { roi: 150, expected: 'excellent' },
        { roi: 75, expected: 'good' },
        { roi: 25, expected: 'average' },
        { roi: -10, expected: 'poor' }
      ];

      testCases.forEach(({ roi, expected }) => {
        // Create campaign with specific ROI by adjusting commission
        const spend = 1000;
        const commission = spend + (spend * roi / 100);
        
        const insights: FacebookInsights = {
          ...mockCampaign.insights!,
          spend
        };

        const campaign: FacebookCampaign = {
          ...mockCampaign,
          insights
        };

        const options: TransformationOptions = {
          estimateCommissionRate: commission / spend
        };

        const data: FacebookSyncResult = {
          ...mockFacebookData,
          campaigns: [campaign]
        };

        const result = transformer.transformFacebookData(data, options);
        expect(result.campaigns[0].performance).toBe(expected);
      });
    });
  });

  describe('currency conversion', () => {
    it('should convert currencies when rates are provided', () => {
      const conversionRates: CurrencyConversionRates = {
        'USD': 1,
        'EUR': 0.85,
        'THB': 35
      };

      const options: TransformationOptions = {
        targetCurrency: 'THB',
        conversionRates
      };

      const result = transformer.transformFacebookData(mockFacebookData, options);
      const campaign = result.campaigns[0];

      expect(campaign.adSpend).toBe(35000); // 1000 USD * 35
      expect(campaign.commission).toBe(1750); // 50 USD * 35
    });

    it('should not convert when target currency is same as source', () => {
      const options: TransformationOptions = {
        targetCurrency: 'USD'
      };

      const result = transformer.transformFacebookData(mockFacebookData, options);
      const campaign = result.campaigns[0];

      expect(campaign.adSpend).toBe(1000);
      expect(campaign.commission).toBe(50);
    });
  });

  describe('mergeFacebookWithExisting', () => {
    let existingCampaigns: DashboardCampaign[];
    let facebookCampaigns: DashboardCampaign[];

    beforeEach(() => {
      existingCampaigns = [
        {
          id: 1,
          name: 'Existing Campaign 1',
          platform: 'Shopee',
          subId: 'shopee_001',
          orders: 20,
          commission: 500,
          adSpend: 300,
          roi: 66.7,
          status: 'active',
          startDate: '2024-01-01',
          performance: 'good'
        },
        {
          id: 2,
          name: 'Existing Campaign 2',
          platform: 'Facebook',
          subId: 'fb_conversions_12345',
          orders: 15,
          commission: 400,
          adSpend: 250,
          roi: 60,
          status: 'active',
          startDate: '2024-01-05',
          performance: 'good'
        }
      ];

      facebookCampaigns = [
        {
          id: 1001,
          name: 'New Facebook Campaign',
          platform: 'Facebook',
          subId: 'fb_conversions_67890',
          orders: 10,
          commission: 300,
          adSpend: 200,
          roi: 50,
          status: 'active',
          startDate: '2024-01-10',
          performance: 'good'
        },
        {
          id: 1002,
          name: 'Updated Facebook Campaign',
          platform: 'Facebook',
          subId: 'fb_conversions_12345', // Same subId as existing
          orders: 25,
          commission: 600,
          adSpend: 350,
          roi: 71.4,
          status: 'active',
          startDate: '2024-01-15', // Newer date
          performance: 'good'
        }
      ];
    });

    it('should merge new Facebook campaigns with existing data', () => {
      const result = transformer.mergeFacebookWithExisting(facebookCampaigns, existingCampaigns);

      expect(result).toHaveLength(3); // 2 existing + 1 new
      
      // Should contain the new Facebook campaign
      const newCampaign = result.find(c => c.subId === 'fb_conversions_67890');
      expect(newCampaign).toBeDefined();
      expect(newCampaign?.name).toBe('New Facebook Campaign');
    });

    it('should update existing campaigns with newer Facebook data', () => {
      const result = transformer.mergeFacebookWithExisting(facebookCampaigns, existingCampaigns);

      // Should update the existing Facebook campaign
      const updatedCampaign = result.find(c => c.subId === 'fb_conversions_12345');
      expect(updatedCampaign).toBeDefined();
      expect(updatedCampaign?.name).toBe('Updated Facebook Campaign');
      expect(updatedCampaign?.orders).toBe(25);
      expect(updatedCampaign?.id).toBe(2); // Should preserve original ID
    });

    it('should not update existing campaigns with older Facebook data', () => {
      // Make Facebook data older
      facebookCampaigns[1].startDate = '2024-01-01'; // Older than existing

      const result = transformer.mergeFacebookWithExisting(facebookCampaigns, existingCampaigns);

      const existingCampaign = result.find(c => c.subId === 'fb_conversions_12345');
      expect(existingCampaign?.name).toBe('Existing Campaign 2'); // Should not be updated
      expect(existingCampaign?.orders).toBe(15);
    });

    it('should preserve non-Facebook campaigns', () => {
      const result = transformer.mergeFacebookWithExisting(facebookCampaigns, existingCampaigns);

      const shopeeCampaign = result.find(c => c.platform === 'Shopee');
      expect(shopeeCampaign).toBeDefined();
      expect(shopeeCampaign?.name).toBe('Existing Campaign 1');
    });
  });

  describe('validateDataStructure', () => {
    let validCampaign: DashboardCampaign;

    beforeEach(() => {
      validCampaign = {
        id: 1,
        name: 'Valid Campaign',
        platform: 'Facebook',
        subId: 'fb_test_123',
        orders: 10,
        commission: 500,
        adSpend: 300,
        roi: 66.7,
        status: 'active',
        startDate: '2024-01-01',
        performance: 'good'
      };
    });

    it('should validate correct data structure', () => {
      const result = transformer.validateDataStructure([validCampaign]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidCampaign = {
        ...validCampaign,
        name: '',
        platform: '',
        subId: ''
      };

      const result = transformer.validateDataStructure([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campaign at index 0: name is required');
      expect(result.errors).toContain('Campaign at index 0: platform is required');
      expect(result.errors).toContain('Campaign at index 0: subId is required');
    });

    it('should detect invalid numeric fields', () => {
      const invalidCampaign = {
        ...validCampaign,
        orders: -1,
        commission: -100,
        adSpend: -50
      };

      const result = transformer.validateDataStructure([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campaign at index 0: orders must be a non-negative number');
      expect(result.errors).toContain('Campaign at index 0: commission must be a non-negative number');
      expect(result.errors).toContain('Campaign at index 0: adSpend must be a non-negative number');
    });

    it('should detect invalid date format', () => {
      const invalidCampaign = {
        ...validCampaign,
        startDate: 'invalid-date'
      };

      const result = transformer.validateDataStructure([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campaign at index 0: startDate must be a valid date');
    });

    it('should detect invalid status and performance values', () => {
      const invalidCampaign = {
        ...validCampaign,
        status: 'invalid-status',
        performance: 'invalid-performance'
      };

      const result = transformer.validateDataStructure([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campaign at index 0: status must be one of active, paused, ended');
      expect(result.errors).toContain('Campaign at index 0: performance must be one of excellent, good, average, poor');
    });

    it('should generate warnings for unusual values', () => {
      const unusualCampaign = {
        ...validCampaign,
        roi: -150, // Very low ROI
        adSpend: 0,
        orders: 10 // Orders without spend
      };

      const result = transformer.validateDataStructure([unusualCampaign]);

      expect(result.warnings).toContain('Campaign at index 0: ROI is unusually low (-150%)');
      expect(result.warnings).toContain('Campaign at index 0: has orders but no ad spend');
    });
  });

  describe('sanitizeData', () => {
    it('should remove campaigns with missing critical data', () => {
      const campaigns = [
        {
          id: 1,
          name: 'Valid Campaign',
          platform: 'Facebook',
          subId: 'fb_test_123',
          orders: 10,
          commission: 500,
          adSpend: 300,
          roi: 66.7,
          status: 'active',
          startDate: '2024-01-01',
          performance: 'good'
        },
        {
          id: 2,
          name: '', // Missing name
          platform: 'Facebook',
          subId: 'fb_test_456',
          orders: 5,
          commission: 200,
          adSpend: 150,
          roi: 33.3,
          status: 'active',
          startDate: '2024-01-01',
          performance: 'average'
        }
      ];

      const result = transformer.sanitizeData(campaigns);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Valid Campaign');
    });

    it('should fix common data issues', () => {
      const campaigns = [
        {
          id: 1,
          name: '  Campaign with spaces  ',
          platform: '  Facebook  ',
          subId: '  fb_test_123  ',
          orders: 10.7, // Should be rounded
          commission: 500.999, // Should be rounded to 2 decimals
          adSpend: -100, // Should be made positive
          roi: 66.666, // Should be rounded to 1 decimal
          status: 'ACTIVE', // Should be lowercase
          startDate: '2024-01-01',
          performance: 'GOOD' // Should be lowercase
        }
      ];

      const result = transformer.sanitizeData(campaigns);

      expect(result[0].name).toBe('Campaign with spaces');
      expect(result[0].platform).toBe('Facebook');
      expect(result[0].subId).toBe('fb_test_123');
      expect(result[0].orders).toBe(11);
      expect(result[0].commission).toBe(501);
      expect(result[0].adSpend).toBe(0);
      expect(result[0].roi).toBe(66.7);
      expect(result[0].status).toBe('active');
      expect(result[0].performance).toBe('good');
    });
  });

  describe('sub ID generation', () => {
    it('should generate meaningful sub IDs', () => {
      const campaigns = [
        { ...mockCampaign, objective: 'CONVERSIONS' },
        { ...mockCampaign, objective: 'LINK_CLICKS' },
        { ...mockCampaign, objective: 'REACH' }
      ];

      campaigns.forEach(campaign => {
        const data: FacebookSyncResult = {
          ...mockFacebookData,
          campaigns: [campaign]
        };

        const result = transformer.transformFacebookData(data);
        const transformedCampaign = result.campaigns[0];

        expect(transformedCampaign.subId).toMatch(/^fb_\w+_\w{8}$/);
        expect(transformedCampaign.subId).toContain(campaign.objective.toLowerCase().replace(/_/g, ''));
      });
    });
  });
});