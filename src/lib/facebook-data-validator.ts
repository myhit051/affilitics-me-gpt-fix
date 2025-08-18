import { ValidationResult } from '@/types/facebook';
import { DashboardCampaign } from './facebook-data-transformer';

// Schema definitions for validation
export interface CampaignSchema {
  id: { type: 'number'; required: true; min?: number };
  name: { type: 'string'; required: true; minLength?: number; maxLength?: number };
  platform: { type: 'string'; required: true; enum?: string[] };
  subId: { type: 'string'; required: true; pattern?: RegExp };
  orders: { type: 'number'; required: true; min?: number; max?: number };
  commission: { type: 'number'; required: true; min?: number };
  adSpend: { type: 'number'; required: true; min?: number };
  roi: { type: 'number'; required: true };
  status: { type: 'string'; required: true; enum?: string[] };
  startDate: { type: 'string'; required: true; format?: 'date' };
  performance: { type: 'string'; required: true; enum?: string[] };
}

export interface DataIntegrityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  missingDataRecords: number;
  outlierRecords: number;
  integrityScore: number; // 0-100
  issues: DataIntegrityIssue[];
}

export interface DataIntegrityIssue {
  type: 'duplicate' | 'missing_data' | 'outlier' | 'inconsistent' | 'invalid_format';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recordIndex: number;
  field?: string;
  message: string;
  suggestedFix?: string;
}

export interface DataLineage {
  recordId: string | number;
  sourceSystem: string;
  sourceRecordId?: string;
  transformationSteps: TransformationStep[];
  dataQuality: DataQualityMetrics;
  createdAt: Date;
  lastModified: Date;
}

export interface TransformationStep {
  stepName: string;
  timestamp: Date;
  inputData: any;
  outputData: any;
  transformationRules: string[];
  validationResults?: ValidationResult;
}

export interface DataQualityMetrics {
  completeness: number; // 0-100
  accuracy: number; // 0-100
  consistency: number; // 0-100
  validity: number; // 0-100
  overallScore: number; // 0-100
}

export class FacebookDataValidator {
  private campaignSchema: CampaignSchema = {
    id: { type: 'number', required: true, min: 1 },
    name: { type: 'string', required: true, minLength: 1, maxLength: 255 },
    platform: { type: 'string', required: true, enum: ['Facebook', 'Shopee', 'Lazada'] },
    subId: { 
      type: 'string', 
      required: true, 
      pattern: /^[a-zA-Z0-9_-]+$/ 
    },
    orders: { type: 'number', required: true, min: 0, max: 1000000 },
    commission: { type: 'number', required: true, min: 0 },
    adSpend: { type: 'number', required: true, min: 0 },
    roi: { type: 'number', required: true },
    status: { type: 'string', required: true, enum: ['active', 'paused', 'ended'] },
    startDate: { type: 'string', required: true, format: 'date' },
    performance: { type: 'string', required: true, enum: ['excellent', 'good', 'average', 'poor'] }
  };

  private dataLineageMap = new Map<string | number, DataLineage>();

  /**
   * Validate campaign data against schema
   */
  validateCampaignSchema(campaigns: DashboardCampaign[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    campaigns.forEach((campaign, index) => {
      const fieldErrors = this.validateCampaignFields(campaign, index);
      errors.push(...fieldErrors.errors);
      warnings.push(...fieldErrors.warnings);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate individual campaign fields
   */
  private validateCampaignFields(campaign: DashboardCampaign, index: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    Object.entries(this.campaignSchema).forEach(([fieldName, schema]) => {
      const value = (campaign as any)[fieldName];
      const fieldPath = `Campaign at index ${index}, field '${fieldName}'`;

      // Required field check
      if (schema.required && (value === undefined || value === null || value === '')) {
        errors.push(`${fieldPath}: is required`);
        return;
      }

      if (value === undefined || value === null) return;

      // Type validation
      if (schema.type === 'string' && typeof value !== 'string') {
        errors.push(`${fieldPath}: must be a string, got ${typeof value}`);
        return;
      }

      if (schema.type === 'number' && typeof value !== 'number') {
        errors.push(`${fieldPath}: must be a number, got ${typeof value}`);
        return;
      }

      // String validations
      if (schema.type === 'string' && typeof value === 'string') {
        if (schema.minLength && value.length < schema.minLength) {
          errors.push(`${fieldPath}: must be at least ${schema.minLength} characters long`);
        }

        if (schema.maxLength && value.length > schema.maxLength) {
          errors.push(`${fieldPath}: must be no more than ${schema.maxLength} characters long`);
        }

        if (schema.pattern && !schema.pattern.test(value)) {
          errors.push(`${fieldPath}: does not match required pattern`);
        }

        if (schema.enum && !schema.enum.includes(value)) {
          errors.push(`${fieldPath}: must be one of [${schema.enum.join(', ')}], got '${value}'`);
        }

        if (schema.format === 'date' && isNaN(Date.parse(value))) {
          errors.push(`${fieldPath}: must be a valid date format`);
        }
      }

      // Number validations
      if (schema.type === 'number' && typeof value === 'number') {
        if (schema.min !== undefined && value < schema.min) {
          errors.push(`${fieldPath}: must be at least ${schema.min}, got ${value}`);
        }

        if (schema.max !== undefined && value > schema.max) {
          warnings.push(`${fieldPath}: unusually high value ${value}, maximum expected is ${schema.max}`);
        }

        if (isNaN(value)) {
          errors.push(`${fieldPath}: cannot be NaN`);
        }

        if (!isFinite(value)) {
          errors.push(`${fieldPath}: must be a finite number`);
        }
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Perform comprehensive data integrity checks
   */
  performDataIntegrityCheck(campaigns: DashboardCampaign[]): DataIntegrityReport {
    const issues: DataIntegrityIssue[] = [];

    // Check for duplicates
    const duplicateIssues = this.checkForDuplicates(campaigns);
    issues.push(...duplicateIssues);

    // Check for missing critical data
    const missingDataIssues = this.checkForMissingData(campaigns);
    issues.push(...missingDataIssues);

    // Check for outliers
    const outlierIssues = this.checkForOutliers(campaigns);
    issues.push(...outlierIssues);

    // Check for data consistency
    const consistencyIssues = this.checkDataConsistency(campaigns);
    issues.push(...consistencyIssues);

    // Count records with issues (unique record indices)
    const recordsWithIssues = new Set([
      ...duplicateIssues.map(i => i.recordIndex),
      ...missingDataIssues.map(i => i.recordIndex),
      ...outlierIssues.map(i => i.recordIndex),
      ...consistencyIssues.map(i => i.recordIndex)
    ]);

    const validRecords = campaigns.length - recordsWithIssues.size;
    const duplicateRecords = new Set(duplicateIssues.map(i => i.recordIndex)).size;
    const missingDataRecords = new Set(missingDataIssues.map(i => i.recordIndex)).size;
    const outlierRecords = new Set(outlierIssues.map(i => i.recordIndex)).size;

    const integrityScore = this.calculateIntegrityScore(campaigns.length, issues);

    return {
      totalRecords: campaigns.length,
      validRecords,
      invalidRecords: campaigns.length - validRecords,
      duplicateRecords,
      missingDataRecords,
      outlierRecords,
      integrityScore,
      issues
    };
  }

  /**
   * Check for duplicate records
   */
  private checkForDuplicates(campaigns: DashboardCampaign[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    const seenSubIds = new Map<string, number>();
    const seenNames = new Map<string, number>();

    campaigns.forEach((campaign, index) => {
      // Check for duplicate subIds
      if (seenSubIds.has(campaign.subId)) {
        issues.push({
          type: 'duplicate',
          severity: 'high',
          recordIndex: index,
          field: 'subId',
          message: `Duplicate subId '${campaign.subId}' found (first occurrence at index ${seenSubIds.get(campaign.subId)})`,
          suggestedFix: 'Remove duplicate record or update subId to be unique'
        });
      } else {
        seenSubIds.set(campaign.subId, index);
      }

      // Check for duplicate names within same platform
      const nameKey = `${campaign.platform}:${campaign.name}`;
      if (seenNames.has(nameKey)) {
        issues.push({
          type: 'duplicate',
          severity: 'medium',
          recordIndex: index,
          field: 'name',
          message: `Duplicate campaign name '${campaign.name}' for platform '${campaign.platform}' (first occurrence at index ${seenNames.get(nameKey)})`,
          suggestedFix: 'Consider renaming campaign or merging duplicate campaigns'
        });
      } else {
        seenNames.set(nameKey, index);
      }
    });

    return issues;
  }

  /**
   * Check for missing critical data
   */
  private checkForMissingData(campaigns: DashboardCampaign[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];

    campaigns.forEach((campaign, index) => {
      // Check for zero values that might indicate missing data
      if (campaign.adSpend === 0 && campaign.orders > 0) {
        issues.push({
          type: 'missing_data',
          severity: 'medium',
          recordIndex: index,
          field: 'adSpend',
          message: 'Campaign has orders but no ad spend recorded',
          suggestedFix: 'Verify if ad spend data is missing or if this is organic traffic'
        });
      }

      if (campaign.commission === 0 && campaign.orders > 0) {
        issues.push({
          type: 'missing_data',
          severity: 'high',
          recordIndex: index,
          field: 'commission',
          message: 'Campaign has orders but no commission recorded',
          suggestedFix: 'Check commission calculation or data source'
        });
      }

      // Check for suspiciously old start dates
      const startDate = new Date(campaign.startDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      if (startDate < oneYearAgo) {
        issues.push({
          type: 'missing_data',
          severity: 'low',
          recordIndex: index,
          field: 'startDate',
          message: `Campaign start date is more than one year old (${campaign.startDate})`,
          suggestedFix: 'Verify if this is historical data or if date is incorrect'
        });
      }
    });

    return issues;
  }

  /**
   * Check for statistical outliers
   */
  private checkForOutliers(campaigns: DashboardCampaign[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];

    if (campaigns.length < 4) return issues; // Need at least 4 records for meaningful outlier detection

    // Calculate statistics for numeric fields
    const numericFields = ['orders', 'commission', 'adSpend', 'roi'];
    
    numericFields.forEach(field => {
      const values = campaigns.map(c => (c as any)[field]).filter(v => typeof v === 'number' && isFinite(v));
      if (values.length < 4) return;

      const { mean, stdDev, q1, q3, iqr } = this.calculateStatistics(values);
      
      // Only proceed if we have valid statistics
      if (!isFinite(q1) || !isFinite(q3) || !isFinite(iqr) || iqr === 0) return;
      
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      campaigns.forEach((campaign, index) => {
        const value = (campaign as any)[field];
        if (typeof value !== 'number' || !isFinite(value)) return;

        if (value < lowerBound || value > upperBound) {
          const severity = Math.abs(value - mean) > 3 * stdDev ? 'high' : 'medium';
          
          issues.push({
            type: 'outlier',
            severity,
            recordIndex: index,
            field,
            message: `${field} value ${value} is a statistical outlier (expected range: ${lowerBound.toFixed(2)} - ${upperBound.toFixed(2)})`,
            suggestedFix: 'Review data source and verify if this value is correct'
          });
        }
      });
    });

    return issues;
  }

  /**
   * Check for data consistency issues
   */
  private checkDataConsistency(campaigns: DashboardCampaign[]): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];

    campaigns.forEach((campaign, index) => {
      // Check ROI calculation consistency
      const expectedRoi = campaign.adSpend > 0 
        ? ((campaign.commission - campaign.adSpend) / campaign.adSpend) * 100 
        : 0;
      
      const roiDifference = Math.abs(campaign.roi - expectedRoi);
      
      if (roiDifference > 1) { // Allow 1% tolerance for rounding
        issues.push({
          type: 'inconsistent',
          severity: 'medium',
          recordIndex: index,
          field: 'roi',
          message: `ROI calculation inconsistent: recorded ${campaign.roi}%, calculated ${expectedRoi.toFixed(1)}%`,
          suggestedFix: 'Recalculate ROI or verify commission and ad spend values'
        });
      }

      // Check performance rating consistency
      const expectedPerformance = this.calculateExpectedPerformance(campaign.roi);
      if (campaign.performance !== expectedPerformance) {
        issues.push({
          type: 'inconsistent',
          severity: 'low',
          recordIndex: index,
          field: 'performance',
          message: `Performance rating '${campaign.performance}' inconsistent with ROI ${campaign.roi}% (expected '${expectedPerformance}')`,
          suggestedFix: 'Update performance rating to match ROI'
        });
      }

      // Check status consistency
      if (campaign.status === 'active' && campaign.roi < -50) {
        issues.push({
          type: 'inconsistent',
          severity: 'medium',
          recordIndex: index,
          field: 'status',
          message: `Campaign is active but has very poor ROI (${campaign.roi}%)`,
          suggestedFix: 'Consider pausing campaign or reviewing performance'
        });
      }
    });

    return issues;
  }

  /**
   * Calculate expected performance based on ROI
   */
  private calculateExpectedPerformance(roi: number): string {
    if (roi >= 100) return 'excellent';
    if (roi >= 50) return 'good';
    if (roi >= 0) return 'average';
    return 'poor';
  }

  /**
   * Calculate statistical measures
   */
  private calculateStatistics(values: number[]) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    if (n === 0) {
      return { mean: 0, stdDev: 0, q1: 0, q3: 0, iqr: 0 };
    }
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    // More accurate quartile calculation
    const q1Index = Math.max(0, Math.floor((n - 1) * 0.25));
    const q3Index = Math.min(n - 1, Math.floor((n - 1) * 0.75));
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;

    return { mean, stdDev, q1, q3, iqr };
  }

  /**
   * Calculate overall data integrity score
   */
  private calculateIntegrityScore(totalRecords: number, issues: DataIntegrityIssue[]): number {
    if (totalRecords === 0) return 100;

    let penaltyPoints = 0;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          penaltyPoints += 10;
          break;
        case 'high':
          penaltyPoints += 5;
          break;
        case 'medium':
          penaltyPoints += 2;
          break;
        case 'low':
          penaltyPoints += 1;
          break;
      }
    });

    const maxPenalty = totalRecords * 10; // Maximum possible penalty
    const score = Math.max(0, 100 - (penaltyPoints / maxPenalty) * 100);
    
    return Math.round(score * 10) / 10;
  }

  /**
   * Track data lineage for a record
   */
  trackDataLineage(
    recordId: string | number,
    sourceSystem: string,
    sourceRecordId?: string
  ): void {
    const lineage: DataLineage = {
      recordId,
      sourceSystem,
      sourceRecordId,
      transformationSteps: [],
      dataQuality: {
        completeness: 0,
        accuracy: 0,
        consistency: 0,
        validity: 0,
        overallScore: 0
      },
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.dataLineageMap.set(recordId, lineage);
  }

  /**
   * Add transformation step to lineage
   */
  addTransformationStep(
    recordId: string | number,
    stepName: string,
    inputData: any,
    outputData: any,
    transformationRules: string[],
    validationResults?: ValidationResult
  ): void {
    const lineage = this.dataLineageMap.get(recordId);
    if (!lineage) return;

    const step: TransformationStep = {
      stepName,
      timestamp: new Date(),
      inputData,
      outputData,
      transformationRules,
      validationResults
    };

    lineage.transformationSteps.push(step);
    lineage.lastModified = new Date();

    // Update data quality metrics
    this.updateDataQualityMetrics(lineage, outputData);
  }

  /**
   * Update data quality metrics for a record
   */
  private updateDataQualityMetrics(lineage: DataLineage, data: any): void {
    const completeness = this.calculateCompleteness(data);
    const validity = this.calculateValidity(data);
    const consistency = this.calculateConsistency(data);
    const accuracy = 100; // Assume 100% accuracy for transformed data

    lineage.dataQuality = {
      completeness,
      accuracy,
      consistency,
      validity,
      overallScore: (completeness + accuracy + consistency + validity) / 4
    };
  }

  /**
   * Calculate data completeness score
   */
  private calculateCompleteness(data: any): number {
    if (!data || typeof data !== 'object') return 0;

    const fields = Object.keys(this.campaignSchema);
    const presentFields = fields.filter(field => {
      const value = data[field];
      return value !== undefined && value !== null && value !== '';
    });

    return (presentFields.length / fields.length) * 100;
  }

  /**
   * Calculate data validity score
   */
  private calculateValidity(data: any): number {
    if (!data || typeof data !== 'object') return 0;

    const validation = this.validateCampaignFields(data, 0);
    const totalChecks = Object.keys(this.campaignSchema).length;
    const failedChecks = validation.errors.length;

    return Math.max(0, ((totalChecks - failedChecks) / totalChecks) * 100);
  }

  /**
   * Calculate data consistency score
   */
  private calculateConsistency(data: any): number {
    if (!data || typeof data !== 'object') return 0;

    // Check internal consistency (e.g., ROI calculation)
    let consistencyScore = 100;

    if (data.adSpend > 0) {
      const expectedRoi = ((data.commission - data.adSpend) / data.adSpend) * 100;
      const roiDifference = Math.abs(data.roi - expectedRoi);
      
      if (roiDifference > 5) {
        consistencyScore -= 20;
      }
    }

    return Math.max(0, consistencyScore);
  }

  /**
   * Get data lineage for a record
   */
  getDataLineage(recordId: string | number): DataLineage | undefined {
    return this.dataLineageMap.get(recordId);
  }

  /**
   * Get all data lineage records
   */
  getAllDataLineage(): DataLineage[] {
    return Array.from(this.dataLineageMap.values());
  }

  /**
   * Clear data lineage history
   */
  clearDataLineage(): void {
    this.dataLineageMap.clear();
  }

  /**
   * Export data lineage as JSON
   */
  exportDataLineage(): string {
    const lineageData = Array.from(this.dataLineageMap.entries()).map(([id, lineage]) => ({
      id,
      ...lineage
    }));

    return JSON.stringify(lineageData, null, 2);
  }
}

// Export singleton instance
export const facebookDataValidator = new FacebookDataValidator();