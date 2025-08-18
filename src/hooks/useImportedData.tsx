
import { useState, useMemo } from 'react';
import { calculateMetrics, analyzeSubIdPerformance, analyzePlatformPerformance, analyzeDailyPerformance, CalculatedMetrics, DailyMetrics, sumShopeeCommissionRaw } from '@/utils/affiliateCalculations';
import { dataMerger, DataSource } from '@/lib/data-merger';
import { parse, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ImportedData {
  shopeeOrders: any[];
  lazadaOrders: any[];
  facebookAds: any[];
  totalRows: number;
  errors: string[];
  // Data source tracking
  dataSourceStats?: {
    shopee: { fileImport: number; facebookApi: number; merged: number; total: number };
    lazada: { fileImport: number; facebookApi: number; merged: number; total: number };
    facebook: { fileImport: number; facebookApi: number; merged: number; total: number };
  };
  mergeResults?: {
    shopee?: any;
    lazada?: any;
    facebook?: any;
  };
  conflictAnalysis?: {
    conflicts: Array<{
      type: 'date_mismatch' | 'spend_mismatch' | 'performance_anomaly';
      description: string;
      affectedRecords: any[];
      severity: 'low' | 'medium' | 'high';
    }>;
    recommendations: string[];
  };
  mergeReport?: {
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
  };
}

export function useImportedData() {
  // Load data from localStorage on initialization
  const [importedData, setImportedData] = useState<ImportedData | null>(() => {
    try {
      const stored = localStorage.getItem('affiliateData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [rawData, setRawData] = useState<ImportedData | null>(() => {
    try {
      const stored = localStorage.getItem('affiliateRawData');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [calculatedMetrics, setCalculatedMetrics] = useState<CalculatedMetrics | null>(() => {
    try {
      const stored = localStorage.getItem('affiliateMetrics');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [subIdAnalysis, setSubIdAnalysis] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('affiliateSubIdAnalysis');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [platformAnalysis, setPlatformAnalysis] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('affiliatePlatformAnalysis');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>(() => {
    try {
      const stored = localStorage.getItem('affiliateDailyMetrics');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  const [loading, setLoading] = useState(false);

  const parseDate = (dateStr: string, timeStr?: string): Date | null => {
    if (!dateStr) return null;
    
    try {
      let fullDateStr = dateStr.trim();
      if (timeStr) {
        fullDateStr = `${dateStr.trim()} ${timeStr.trim()}`;
      }
      
      // Try different date formats (Thai and international)
      const formats = [
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-dd HH:mm',
        'dd/MM/yyyy HH:mm:ss',
        'dd/MM/yyyy HH:mm',
        'MM/dd/yyyy HH:mm:ss',
        'MM/dd/yyyy HH:mm',
        'yyyy-MM-dd',
        'dd/MM/yyyy',
        'MM/dd/yyyy',
        'dd-MM-yyyy',
        'MM-dd-yyyy',
        'yyyy/MM/dd HH:mm:ss',
        'yyyy/MM/dd HH:mm',
        'yyyy/MM/dd',
        'dd.MM.yyyy HH:mm:ss',
        'dd.MM.yyyy HH:mm',
        'dd.MM.yyyy'
      ];
      
      // Try native Date parsing first (more flexible)
      const nativeDate = new Date(fullDateStr);
      if (!isNaN(nativeDate.getTime())) {
        return nativeDate;
      }
      
      // If native parsing fails, try specific formats
      for (const format of formats) {
        try {
          const parsedDate = parse(fullDateStr, format, new Date());
          if (parsedDate && !isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        } catch {
          continue;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

  const filterDataByDate = useMemo(() => (data: ImportedData, dateRange?: DateRange): ImportedData => {
    if (!dateRange?.from || !dateRange?.to) return data;

    console.log('Filtering data by date range:', dateRange);
    
    // Extend date range to cover full days
    const startOfFromDate = startOfDay(dateRange.from);
    const endOfToDate = endOfDay(dateRange.to);
    console.log('Extended date range:', { start: startOfFromDate, end: endOfToDate });

    const filteredShopeeOrders = data.shopeeOrders.filter(order => {
      // Try multiple possible date columns for Shopee
      const possibleDateColumns = ['เวลาที่สั่งซื้อ', 'วันที่สั่งซื้อ', 'Order Time', 'Order Date', 'Date'];
      let orderDate = null;
      
      for (const column of possibleDateColumns) {
        if (order[column]) {
          orderDate = parseDate(order[column]);
          if (orderDate) break;
        }
      }
      
      if (!orderDate) {
        const dateValues = possibleDateColumns.map(col => `${col}: ${order[col]}`);
        console.log('Invalid Shopee date - tried columns:', dateValues);
        console.log('Sample invalid order:', Object.keys(order).slice(0, 10));
        return true; // Include orders with invalid dates (assume they're in range)
      }
      
      const isInRange = isWithinInterval(orderDate, { 
        start: startOfFromDate, 
        end: endOfToDate 
      });
      
      return isInRange;
    });

    const filteredLazadaOrders = data.lazadaOrders.filter(order => {
      // Use correct column: Conversion Time
      const orderDate = parseDate(order['Conversion Time']);
      if (!orderDate) {
        console.log('Invalid Lazada date:', order['Conversion Time']);
        return false; // Exclude invalid dates
      }
      
      const isInRange = isWithinInterval(orderDate, { 
        start: startOfFromDate, 
        end: endOfToDate 
      });
      
      return isInRange;
    });

    const filteredFacebookAds = data.facebookAds.filter(ad => {
      // Use correct column: Day
      const adDate = parseDate(ad['Day']);
      if (!adDate) {
        console.log('Invalid Facebook date:', ad['Day']);
        return false; // Exclude invalid dates
      }
      
      const isInRange = isWithinInterval(adDate, { 
        start: startOfFromDate, 
        end: endOfToDate 
      });
      
      return isInRange;
    });

    console.log('Filtered results:', {
      shopee: filteredShopeeOrders.length,
      lazada: filteredLazadaOrders.length,
      facebook: filteredFacebookAds.length
    });

    return {
      ...data,
      shopeeOrders: filteredShopeeOrders,
      lazadaOrders: filteredLazadaOrders,
      facebookAds: filteredFacebookAds
    };
  }, []);

  const processImportedData = (
    data: ImportedData, 
    selectedSubIds: string[] = [], 
    selectedValidity: string = "all",
    selectedChannels: string[] = [],
    dateRange?: DateRange,
    selectedPlatform: string = "all"
  ) => {
    console.log('processImportedData called with data:', data);
    setLoading(true);
    
    try {
      // Add small delay to prevent UI blocking with large datasets
      setTimeout(() => {
        try {
          // First, merge data from different sources if needed
          let mergedData = data;
          let mergeResults: any = {};

          // Check if we have data from multiple sources that need merging
          const hasFileData = data.shopeeOrders.some((order: any) => !order._dataSource) || 
                             data.lazadaOrders.some((order: any) => !order._dataSource) ||
                             data.facebookAds.some((ad: any) => !ad._dataSource);

          const hasApiData = data.shopeeOrders.some((order: any) => order._dataSource === 'facebook_api') ||
                            data.lazadaOrders.some((order: any) => order._dataSource === 'facebook_api') ||
                            data.facebookAds.some((ad: any) => ad._dataSource === 'facebook_api');

          if (hasFileData && hasApiData) {
            console.log('Merging data from multiple sources...');
            
            // Separate file and API data
            const fileData = {
              shopeeOrders: data.shopeeOrders.filter((order: any) => !order._dataSource || order._dataSource === 'file_import'),
              lazadaOrders: data.lazadaOrders.filter((order: any) => !order._dataSource || order._dataSource === 'file_import'),
              facebookAds: data.facebookAds.filter((ad: any) => !ad._dataSource || ad._dataSource === 'file_import'),
              campaigns: [] // Will be populated if campaign data exists
            };

            const apiData = {
              shopeeOrders: data.shopeeOrders.filter((order: any) => order._dataSource === 'facebook_api'),
              lazadaOrders: data.lazadaOrders.filter((order: any) => order._dataSource === 'facebook_api'),
              facebookAds: data.facebookAds.filter((ad: any) => ad._dataSource === 'facebook_api'),
              campaigns: [] // Will be populated if campaign data exists
            };

            // Use comprehensive merge functionality
            const comprehensiveMerge = dataMerger.mergeAllData(fileData, apiData);

            mergeResults = comprehensiveMerge.mergeResults;

            // Detect cross-platform conflicts
            const conflictAnalysis = dataMerger.detectCrossPlatformConflicts(
              comprehensiveMerge.mergedData.shopeeOrders,
              comprehensiveMerge.mergedData.lazadaOrders,
              comprehensiveMerge.mergedData.facebookAds
            );

            // Generate merge report
            const mergeReport = dataMerger.generateMergeReport(mergeResults);

            // Strip data source tracking for backward compatibility with existing code
            mergedData = {
              ...data,
              shopeeOrders: dataMerger.stripDataSourceTracking(comprehensiveMerge.mergedData.shopeeOrders),
              lazadaOrders: dataMerger.stripDataSourceTracking(comprehensiveMerge.mergedData.lazadaOrders),
              facebookAds: dataMerger.stripDataSourceTracking(comprehensiveMerge.mergedData.facebookAds),
              totalRows: comprehensiveMerge.overallStatistics.totalMerged,
              mergeResults,
              conflictAnalysis,
              mergeReport
            };

            console.log('Data merge completed:', {
              overallStats: comprehensiveMerge.overallStatistics,
              conflicts: conflictAnalysis.conflicts.length,
              recommendations: conflictAnalysis.recommendations.length,
              report: mergeReport.summary
            });
          }

          const dateFilteredData = filterDataByDate(mergedData, dateRange);
        
          console.log('Processing imported data with filters:', {
            shopee: dateFilteredData.shopeeOrders.length,
            lazada: dateFilteredData.lazadaOrders.length,
            facebook: dateFilteredData.facebookAds.length,
            selectedSubIds,
            selectedValidity,
            selectedChannels,
            dateRange,
            selectedPlatform
          });

          // Use the same filtered data for everything
          const finalFilteredData = {
            shopeeOrders: dateFilteredData.shopeeOrders,
            lazadaOrders: dateFilteredData.lazadaOrders,
            facebookAds: dateFilteredData.facebookAds
          };

          const metrics = calculateMetrics(
            finalFilteredData.shopeeOrders,
            finalFilteredData.lazadaOrders,
            finalFilteredData.facebookAds,
            [], // Don't filter further - data is already filtered by date
            "all", // Don't filter further
            [], // Don't filter further
            "all" // Don't filter further
          );

          // Use the SAME filtered data for EVERYTHING
          const finalData = {
            shopeeOrders: metrics.filteredShopeeOrders || finalFilteredData.shopeeOrders,
            lazadaOrders: metrics.filteredLazadaOrders || finalFilteredData.lazadaOrders,
            facebookAds: metrics.filteredFacebookAds || finalFilteredData.facebookAds,
            totalRows: (metrics.filteredShopeeOrders?.length || 0) + (metrics.filteredLazadaOrders?.length || 0) + (metrics.filteredFacebookAds?.length || 0),
            errors: [],
            mergeResults,
            dataSourceStats: mergeResults.shopee ? {
              shopee: dataMerger.getDataSourceStatistics(mergeResults.shopee.mergedData),
              lazada: dataMerger.getDataSourceStatistics(mergeResults.lazada.mergedData),
              facebook: dataMerger.getDataSourceStatistics(mergeResults.facebook.mergedData)
            } : undefined
          };

          setImportedData(finalData);
          
          // Also store raw data for components that need unfiltered data
          if (!rawData) {
            setRawData(data);
          }
          setCalculatedMetrics(metrics);

          // Use the SAME filtered data for all analysis
          const subIds = analyzeSubIdPerformance(
            finalData.shopeeOrders,
            finalData.lazadaOrders,
            finalData.facebookAds,
            metrics.totalAdsSpent
          );
          setSubIdAnalysis(subIds);

          const platforms = analyzePlatformPerformance(
            finalData.shopeeOrders,
            finalData.lazadaOrders,
            metrics.totalAdsSpent
          );
          setPlatformAnalysis(platforms);

          const daily = analyzeDailyPerformance(
            finalFilteredData.shopeeOrders,
            finalFilteredData.lazadaOrders,
            finalFilteredData.facebookAds
          );
          console.log('🔍 DAILY METRICS DEBUG:');
          console.log('Filtered data counts:', {
            shopee: finalFilteredData.shopeeOrders.length,
            lazada: finalFilteredData.lazadaOrders.length,
            facebook: finalFilteredData.facebookAds.length
          });
          console.log('Daily metrics result:', daily);
          console.log('Daily metrics length:', daily.length);
          setDailyMetrics(daily);
          
          // Save to localStorage for persistence
          try {
            localStorage.setItem('affiliateData', JSON.stringify(finalData));
            localStorage.setItem('affiliateRawData', JSON.stringify(data));
            localStorage.setItem('affiliateMetrics', JSON.stringify(metrics));
            localStorage.setItem('affiliateSubIdAnalysis', JSON.stringify(subIds));
            localStorage.setItem('affiliatePlatformAnalysis', JSON.stringify(platforms));
            localStorage.setItem('affiliateDailyMetrics', JSON.stringify(daily));
            console.log('✅ Data saved to localStorage');
          } catch (error) {
            console.warn('Failed to save data to localStorage:', error);
          }

          // Debug logging
          console.log('=== DATA CONSISTENCY CHECK ===');
          console.log('calculatedMetrics.totalCom:', metrics.totalCom);
          console.log('calculatedMetrics.totalComSP:', metrics.totalComSP);
          console.log('calculatedMetrics.totalOrdersSP:', metrics.totalOrdersSP);
          console.log('calculatedMetrics.cpoSP:', metrics.cpoSP);
          console.log('dailyMetrics total:', daily.reduce((sum, day) => sum + day.totalCom, 0));
          console.log('dailyMetrics sample:', daily.slice(0, 3));
          console.log('finalData counts:', {
            shopee: finalData.shopeeOrders.length,
            lazada: finalData.lazadaOrders.length,
            facebook: finalData.facebookAds.length
          });
          console.log('finalFilteredData counts:', {
            shopee: finalFilteredData.shopeeOrders.length,
            lazada: finalFilteredData.lazadaOrders.length,
            facebook: finalFilteredData.facebookAds.length
          });
          console.log('Date range:', dateRange);

          console.log('Data processing completed successfully');
          console.log('Calculated metrics:', metrics);
          
        } catch (error) {
          console.error('Error processing imported data:', error);
        } finally {
          setLoading(false);
        }
      }, 100); // Small delay to prevent UI blocking
    } catch (error) {
      console.error('Error in processImportedData:', error);
      setLoading(false);
    }
  };

  const resetToOriginalData = (originalData: ImportedData) => {
    // Reset to original data without any filters
    setImportedData(originalData);
    
    // Recalculate metrics with no filters applied
    const metrics = calculateMetrics(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      originalData.facebookAds,
      [], // No SubID filter
      "all", // No validity filter
      [], // No channel filter
      "all" // No platform filter
    );
    setCalculatedMetrics(metrics);

    const subIds = analyzeSubIdPerformance(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      originalData.facebookAds,
      metrics.totalAdsSpent
    );
    setSubIdAnalysis(subIds);

    const platforms = analyzePlatformPerformance(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      metrics.totalAdsSpent
    );
    setPlatformAnalysis(platforms);
  };

  const hasData = importedData !== null && (
    (importedData.shopeeOrders && importedData.shopeeOrders.length > 0) ||
    (importedData.lazadaOrders && importedData.lazadaOrders.length > 0) ||
    (importedData.facebookAds && importedData.facebookAds.length > 0)
  );

  const rawShopeeCommission = useMemo(() => {
    return importedData && importedData.shopeeOrders ? sumShopeeCommissionRaw(importedData.shopeeOrders) : 0;
  }, [importedData]);

  const rawShopeeOrderCount = useMemo(() => {
    return importedData && importedData.shopeeOrders ? importedData.shopeeOrders.length : 0;
  }, [importedData]);

  const uniqueShopeeOrderCount = useMemo(() => {
    if (!importedData || !importedData.shopeeOrders) return 0;
    const unique = new Set(importedData.shopeeOrders.map(order => order['เลขที่คำสั่งซื้อ']));
    return unique.size;
  }, [importedData]);

  console.log('useImportedData state:', {
    hasImportedData: importedData !== null,
    hasData,
    shopeeCount: importedData?.shopeeOrders?.length || 0,
    lazadaCount: importedData?.lazadaOrders?.length || 0,
    facebookCount: importedData?.facebookAds?.length || 0,
    hasCalculatedMetrics: calculatedMetrics !== null
  });

  return {
    importedData,
    rawData,
    calculatedMetrics,
    subIdAnalysis,
    platformAnalysis,
    dailyMetrics,
    loading,
    processImportedData,
    resetToOriginalData,
    hasData,
    rawShopeeCommission,
    rawShopeeOrderCount,
    uniqueShopeeOrderCount,
  };
}
