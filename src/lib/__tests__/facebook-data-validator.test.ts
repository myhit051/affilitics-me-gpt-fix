import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FacebookDataValidator,
  DataIntegrityReport,
  DataLineage 
} from '../facebook-data-validator';
import { DashboardCampaign } from '../facebook-data-transformer';

describe('FacebookDataValidator', () => {
  let validator: FacebookDataValidator;
  let validCampaign: DashboardCampaign;
  let validCampaigns: DashboardCampaign[];

  beforeEach(() => {
    validator = new FacebookDataValidator();
    
    // Use current date to avoid "old date" issues
    const currentDate = new Date().toISOString().split('T')[0];
    
    validCampaign = {
      id: 1,
      name: 'Test Campaign',
      platform: 'Facebook',
      subId: 'fb_test_123',
      orders: 10,
      commission: 500,
      adSpend: 300,
      roi: 66.7,
      status: 'active',
      startDate: currentDate,
      performance: 'good'
    };

    validCampaigns = [
      validCampaign,
      {
        id: 2,
        name: 'Another Campaign',
        platform: 'Shopee',
        subId: 'shopee_test_456',
        orders: 15,
        commission: 750,
        adSpend: 400,
        roi: 87.5,
        status: 'active',
        startDate: currentDate,
        performance: 'good'
      }
    ];
  });

  describe('validateCampaignSchema', () => {
    it('should validate correct campaign data', () => {
      const result = validator.validateCampaignSchema(validCampaigns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidCampaign = {
        ...validCampaign,
        name: '',
        platform: undefined,
        subId: null
      } as any;

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'name': is required");
      expect(result.errors).toContain("Campaign at index 0, field 'platform': is required");
      expect(result.errors).toContain("Campaign at index 0, field 'subId': is required");
    });

    it('should detect invalid data types', () => {
      const invalidCampaign = {
        ...validCampaign,
        orders: 'invalid',
        commission: 'not-a-number',
        roi: null
      } as any;

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'orders': must be a number, got string");
      expect(result.errors).toContain("Campaign at index 0, field 'commission': must be a number, got string");
      expect(result.errors).toContain("Campaign at index 0, field 'roi': is required");
    });

    it('should validate string length constraints', () => {
      const invalidCampaign = {
        ...validCampaign,
        name: 'A'.repeat(300) // Exceeds maxLength
      };

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'name': must be no more than 255 characters long");
    });

    it('should validate enum values', () => {
      const invalidCampaign = {
        ...validCampaign,
        platform: 'InvalidPlatform',
        status: 'invalid-status',
        performance: 'invalid-performance'
      };

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'platform': must be one of [Facebook, Shopee, Lazada], got 'InvalidPlatform'");
      expect(result.errors).toContain("Campaign at index 0, field 'status': must be one of [active, paused, ended], got 'invalid-status'");
      expect(result.errors).toContain("Campaign at index 0, field 'performance': must be one of [excellent, good, average, poor], got 'invalid-performance'");
    });

    it('should validate numeric constraints', () => {
      const invalidCampaign = {
        ...validCampaign,
        id: 0, // Below minimum
        orders: -5, // Negative value
        commission: -100, // Negative value
        adSpend: -50 // Negative value
      };

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'id': must be at least 1, got 0");
      expect(result.errors).toContain("Campaign at index 0, field 'orders': must be at least 0, got -5");
      expect(result.errors).toContain("Campaign at index 0, field 'commission': must be at least 0, got -100");
      expect(result.errors).toContain("Campaign at index 0, field 'adSpend': must be at least 0, got -50");
    });

    it('should validate date format', () => {
      const invalidCampaign = {
        ...validCampaign,
        startDate: 'invalid-date'
      };

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'startDate': must be a valid date format");
    });

    it('should validate pattern matching', () => {
      const invalidCampaign = {
        ...validCampaign,
        subId: 'invalid subId with spaces!'
      };

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'subId': does not match required pattern");
    });

    it('should generate warnings for unusual values', () => {
      const unusualCampaign = {
        ...validCampaign,
        orders: 1500000 // Exceeds expected maximum
      };

      const result = validator.validateCampaignSchema([unusualCampaign]);

      expect(result.warnings).toContain("Campaign at index 0, field 'orders': unusually high value 1500000, maximum expected is 1000000");
    });

    it('should handle NaN and infinite values', () => {
      const invalidCampaign = {
        ...validCampaign,
        roi: NaN,
        commission: Infinity
      };

      const result = validator.validateCampaignSchema([invalidCampaign]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'roi': cannot be NaN");
      expect(result.errors).toContain("Campaign at index 0, field 'commission': must be a finite number");
    });
  });

  describe('performDataIntegrityCheck', () => {
    it('should return perfect score for valid data', () => {
      const report = validator.performDataIntegrityCheck(validCampaigns);

      expect(report.totalRecords).toBe(2);
      expect(report.validRecords).toBe(2);
      expect(report.invalidRecords).toBe(0);
      expect(report.integrityScore).toBeGreaterThan(90);
      expect(report.issues).toHaveLength(0);
    });

    it('should detect duplicate subIds', () => {
      const duplicateCampaigns = [
        validCampaign,
        { ...validCampaign, id: 2, name: 'Different Name' } // Same subId
      ];

      const report = validator.performDataIntegrityCheck(duplicateCampaigns);

      expect(report.duplicateRecords).toBe(1);
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'duplicate',
          severity: 'high',
          field: 'subId',
          recordIndex: 1
        })
      );
    });

    it('should detect duplicate campaign names within same platform', () => {
      const duplicateCampaigns = [
        validCampaign,
        { ...validCampaign, id: 2, subId: 'different_subid' } // Same name and platform
      ];

      const report = validator.performDataIntegrityCheck(duplicateCampaigns);

      expect(report.duplicateRecords).toBe(1);
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'duplicate',
          severity: 'medium',
          field: 'name',
          recordIndex: 1
        })
      );
    });

    it('should detect missing data issues', () => {
      const campaignsWithMissingData = [
        {
          ...validCampaign,
          adSpend: 0,
          orders: 10 // Orders without spend
        },
        {
          ...validCampaign,
          id: 2,
          subId: 'test_2',
          commission: 0,
          orders: 5 // Orders without commission
        }
      ];

      const report = validator.performDataIntegrityCheck(campaignsWithMissingData);

      expect(report.missingDataRecords).toBe(2);
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing_data',
          severity: 'medium',
          field: 'adSpend',
          recordIndex: 0
        })
      );
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing_data',
          severity: 'high',
          field: 'commission',
          recordIndex: 1
        })
      );
    });

    it('should detect old start dates', () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2);

      const campaignWithOldDate = {
        ...validCampaign,
        startDate: oldDate.toISOString().split('T')[0]
      };

      const report = validator.performDataIntegrityCheck([campaignWithOldDate]);

      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'missing_data',
          severity: 'low',
          field: 'startDate',
          recordIndex: 0
        })
      );
    });

    it('should detect statistical outliers', () => {
      const campaignsWithOutliers = [
        { ...validCampaign, roi: 10 },
        { ...validCampaign, id: 2, subId: 'test_2', roi: 15 },
        { ...validCampaign, id: 3, subId: 'test_3', roi: 12 },
        { ...validCampaign, id: 4, subId: 'test_4', roi: 1000 } // Extreme outlier
      ];

      const report = validator.performDataIntegrityCheck(campaignsWithOutliers);

      expect(report.outlierRecords).toBe(1);
      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'outlier',
          field: 'roi',
          recordIndex: 3
        })
      );
    });

    it('should detect ROI calculation inconsistencies', () => {
      const inconsistentCampaign = {
        ...validCampaign,
        commission: 500,
        adSpend: 300,
        roi: 100 // Should be 66.7%
      };

      const report = validator.performDataIntegrityCheck([inconsistentCampaign]);

      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'inconsistent',
          severity: 'medium',
          field: 'roi',
          recordIndex: 0
        })
      );
    });

    it('should detect performance rating inconsistencies', () => {
      const inconsistentCampaign = {
        ...validCampaign,
        roi: 150, // Should be 'excellent'
        performance: 'poor'
      };

      const report = validator.performDataIntegrityCheck([inconsistentCampaign]);

      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'inconsistent',
          severity: 'low',
          field: 'performance',
          recordIndex: 0
        })
      );
    });

    it('should detect active campaigns with poor performance', () => {
      const poorPerformingCampaign = {
        ...validCampaign,
        roi: -75,
        status: 'active'
      };

      const report = validator.performDataIntegrityCheck([poorPerformingCampaign]);

      expect(report.issues).toContainEqual(
        expect.objectContaining({
          type: 'inconsistent',
          severity: 'medium',
          field: 'status',
          recordIndex: 0
        })
      );
    });

    it('should calculate integrity score correctly', () => {
      const campaignsWithIssues = [
        validCampaign,
        { ...validCampaign, id: 2, subId: 'test_2' }, // Duplicate name (medium severity)
        { ...validCampaign, id: 3, subId: 'test_3', adSpend: 0, orders: 10 } // Missing data (medium severity)
      ];

      const report = validator.performDataIntegrityCheck(campaignsWithIssues);

      expect(report.integrityScore).toBeLessThan(100);
      expect(report.integrityScore).toBeGreaterThan(0);
    });
  });

  describe('data lineage tracking', () => {
    it('should track data lineage for a record', () => {
      validator.trackDataLineage(1, 'facebook_api', 'fb_campaign_123');

      const lineage = validator.getDataLineage(1);

      expect(lineage).toBeDefined();
      expect(lineage?.recordId).toBe(1);
      expect(lineage?.sourceSystem).toBe('facebook_api');
      expect(lineage?.sourceRecordId).toBe('fb_campaign_123');
      expect(lineage?.transformationSteps).toHaveLength(0);
      expect(lineage?.createdAt).toBeInstanceOf(Date);
    });

    it('should add transformation steps to lineage', () => {
      validator.trackDataLineage(1, 'facebook_api');
      
      const inputData = { name: 'Original Campaign', spend: 1000 };
      const outputData = { name: 'Transformed Campaign', adSpend: 1000 };
      const rules = ['Map spend to adSpend', 'Validate campaign name'];

      validator.addTransformationStep(
        1,
        'facebook_to_dashboard_transform',
        inputData,
        outputData,
        rules
      );

      const lineage = validator.getDataLineage(1);

      expect(lineage?.transformationSteps).toHaveLength(1);
      expect(lineage?.transformationSteps[0].stepName).toBe('facebook_to_dashboard_transform');
      expect(lineage?.transformationSteps[0].inputData).toEqual(inputData);
      expect(lineage?.transformationSteps[0].outputData).toEqual(outputData);
      expect(lineage?.transformationSteps[0].transformationRules).toEqual(rules);
    });

    it('should calculate data quality metrics', () => {
      validator.trackDataLineage(1, 'facebook_api');
      
      validator.addTransformationStep(
        1,
        'transform',
        {},
        validCampaign,
        ['transform']
      );

      const lineage = validator.getDataLineage(1);

      expect(lineage?.dataQuality.completeness).toBe(100);
      expect(lineage?.dataQuality.validity).toBe(100);
      expect(lineage?.dataQuality.consistency).toBe(100);
      expect(lineage?.dataQuality.accuracy).toBe(100);
      expect(lineage?.dataQuality.overallScore).toBe(100);
    });

    it('should handle incomplete data in quality metrics', () => {
      validator.trackDataLineage(1, 'facebook_api');
      
      const incompleteData = {
        ...validCampaign,
        name: '', // Missing required field
        commission: undefined
      };

      validator.addTransformationStep(
        1,
        'transform',
        {},
        incompleteData,
        ['transform']
      );

      const lineage = validator.getDataLineage(1);

      expect(lineage?.dataQuality.completeness).toBeLessThan(100);
      expect(lineage?.dataQuality.validity).toBeLessThan(100);
      expect(lineage?.dataQuality.overallScore).toBeLessThan(100);
    });

    it('should export data lineage as JSON', () => {
      validator.trackDataLineage(1, 'facebook_api', 'fb_123');
      validator.trackDataLineage(2, 'manual_import', 'manual_456');

      const exportedData = validator.exportDataLineage();
      const parsedData = JSON.parse(exportedData);

      expect(parsedData).toHaveLength(2);
      expect(parsedData[0].id).toBe(1);
      expect(parsedData[0].sourceSystem).toBe('facebook_api');
      expect(parsedData[1].id).toBe(2);
      expect(parsedData[1].sourceSystem).toBe('manual_import');
    });

    it('should clear data lineage', () => {
      validator.trackDataLineage(1, 'facebook_api');
      validator.trackDataLineage(2, 'manual_import');

      expect(validator.getAllDataLineage()).toHaveLength(2);

      validator.clearDataLineage();

      expect(validator.getAllDataLineage()).toHaveLength(0);
      expect(validator.getDataLineage(1)).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty campaign array', () => {
      const result = validator.validateCampaignSchema([]);
      const report = validator.performDataIntegrityCheck([]);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(report.totalRecords).toBe(0);
      expect(report.integrityScore).toBe(100);
    });

    it('should handle campaigns with minimal data for outlier detection', () => {
      const singleCampaign = [validCampaign];
      const report = validator.performDataIntegrityCheck(singleCampaign);

      // Should not crash and should not detect outliers with insufficient data
      expect(report.outlierRecords).toBe(0);
    });

    it('should handle null and undefined values gracefully', () => {
      const campaignWithNulls = {
        ...validCampaign,
        commission: null,
        adSpend: undefined
      } as any;

      const result = validator.validateCampaignSchema([campaignWithNulls]);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Campaign at index 0, field 'commission': is required");
      expect(result.errors).toContain("Campaign at index 0, field 'adSpend': is required");
    });
  });
});