import { useState, useMemo } from 'react';
import {
  calculateMetrics,
  analyzeSubIdPerformance,
  analyzePlatformPerformance,
  analyzeDailyBreakdownStable, // ✅ ใช้ตัวนี้แทน analyzeDailyPerformance
  type CalculatedMetrics,
  type DailyStableRow,        // ✅ ได้ field ordersSP/comSP พร้อมใช้กับกราฟ
  sumShopeeCommissionRaw
} from '@/utils/affiliateCalculations';
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
  
  // ✅ เปลี่ยน type เป็น DailyStableRow[] (มี ordersSP/comSP พร้อมใช้กราฟ)
  const [dailyMetrics, setDailyMetrics] = useState<DailyStableRow[]>(() => {
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

  // ✅ ปรับการกรองวันที่:
  //    - Shopee: ถ้ามีช่วงวันแล้ว "พาร์สไม่ได้" ให้ตัดทิ้ง (ไม่ include แบบเดิม)
  //    - Lazada: ลอง Conversion Time -> Order Time
  //    - Facebook: ใช้ Day
  const filterDataByDate = useMemo(() => (data: ImportedData, dateRange?: DateRange): ImportedData => {
    if (!dateRange?.from || !dateRange?.to) return data;

    const startOfFromDate = startOfDay(dateRange.from);
    const endOfToDate = endOfDay(dateRange.to);

    const filteredShopeeOrders = data.shopeeOrders.filter(order => {
      const possibleDateColumns = ['เวลาที่สั่งซื้อ', 'วันที่สั่งซื้อ', 'Order Time', 'Order Date', 'Date'];
      let orderDate: Date | null = null;
      for (const column of possibleDateColumns) {
        if (order[column]) {
          orderDate = parseDate(order[column]);
          if (orderDate) break;
        }
      }
      if (!orderDate) {
        // ❌ เดิม return true → รวม Unknown เข้ามาในช่วงวัน
        return false; // ✅ ตัดทิ้งถ้าพาร์สไม่ได้ เมื่อมีการกำหนดช่วงวัน
      }
      return isWithinInterval(orderDate, { start: startOfFromDate, end: endOfToDate });
    });

    const filteredLazadaOrders = data.lazadaOrders.filter(order => {
      const raw = order['Conversion Time'] || order['Order Time'];
      const orderDate = parseDate(raw);
      if (!orderDate) return false;
      return isWithinInterval(orderDate, { start: startOfFromDate, end: endOfToDate });
    });

    const filteredFacebookAds = data.facebookAds.filter(ad => {
      const adDate = parseDate(ad['Day']);
      if (!adDate) return false;
      return isWithinInterval(adDate, { start: startOfFromDate, end: endOfToDate });
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
    setLoading(true);
    
    try {
      setTimeout(() => {
        try {
          // ----- (คง logic merge data เดิมไว้) -----
          let mergedData = data;
          let mergeResults: any = {};

          const hasFileData = data.shopeeOrders.some((order: any) => !order._dataSource) || 
                              data.lazadaOrders.some((order: any) => !order._dataSource) ||
                              data.facebookAds.some((ad: any) => !ad._dataSource);

          const hasApiData = data.shopeeOrders.some((order: any) => order._dataSource === 'facebook_api') ||
                             data.lazadaOrders.some((order: any) => order._dataSource === 'facebook_api') ||
                             data.facebookAds.some((ad: any) => ad._dataSource === 'facebook_api');

          if (hasFileData && hasApiData) {
            const fileData = {
              shopeeOrders: data.shopeeOrders.filter((order: any) => !order._dataSource || order._dataSource === 'file_import'),
              lazadaOrders: data.lazadaOrders.filter((order: any) => !order._dataSource || order._dataSource === 'file_import'),
              facebookAds: data.facebookAds.filter((ad: any) => !ad._dataSource || ad._dataSource === 'file_import'),
              campaigns: []
            };

            const apiData = {
              shopeeOrders: data.shopeeOrders.filter((order: any) => order._dataSource === 'facebook_api'),
              lazadaOrders: data.lazadaOrders.filter((order: any) => order._dataSource === 'facebook_api'),
              facebookAds: data.facebookAds.filter((ad: any) => ad._dataSource === 'facebook_api'),
              campaigns: []
            };

            const comprehensiveMerge = dataMerger.mergeAllData(fileData, apiData);
            mergeResults = comprehensiveMerge.mergeResults;

            const conflictAnalysis = dataMerger.detectCrossPlatformConflicts(
              comprehensiveMerge.mergedData.shopeeOrders,
              comprehensiveMerge.mergedData.lazadaOrders,
              comprehensiveMerge.mergedData.facebookAds
            );

            const mergeReport = dataMerger.generateMergeReport(mergeResults);

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
          }

          // ----- กรองช่วงวันก่อน -----
          const dateFilteredData = filterDataByDate(mergedData, dateRange);

          // ----- คำนวณ KPI ด้วย "ฟิลเตอร์จาก UI" (เดิมส่งว่าง) -----
          const metrics = calculateMetrics(
            dateFilteredData.shopeeOrders,
            dateFilteredData.lazadaOrders,
            dateFilteredData.facebookAds,
            selectedSubIds,
            selectedValidity,
            selectedChannels,
            selectedPlatform,
            {
              shopeeOrderIdKey: 'รหัสการสั่งซื้อ'
            }
          );

          // ใช้ชุดที่ผ่านฟิลเตอร์จาก metrics ต่อให้ทุกส่วน เพื่อให้ตัวเลขตรงกันทั้งเว็บ
          const finalData = {
            shopeeOrders: metrics.filteredShopeeOrders || dateFilteredData.shopeeOrders,
            lazadaOrders: metrics.filteredLazadaOrders || dateFilteredData.lazadaOrders,
            facebookAds: metrics.filteredFacebookAds || dateFilteredData.facebookAds,
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
          if (!rawData) setRawData(data);
          setCalculatedMetrics(metrics);

          // ----- วิเคราะห์ SubId / Platform ด้วยข้อมูลเดียวกัน -----
          const subIds = analyzeSubIdPerformance(
            finalData.shopeeOrders,
            finalData.lazadaOrders,
            finalData.facebookAds
          );
          setSubIdAnalysis(subIds);

          const platforms = analyzePlatformPerformance(
            finalData.shopeeOrders,
            finalData.lazadaOrders,
            metrics.totalAdsSpent
          );
          setPlatformAnalysis(platforms);

          // ----- กราฟรายวัน: ใช้ analyzeDailyBreakdownStable + ตัด Unknown -----
          const daily = analyzeDailyBreakdownStable(
            finalData.shopeeOrders,
            finalData.lazadaOrders,
            finalData.facebookAds,
            {
              shopeeOrderIdKey: 'รหัสการสั่งซื้อ',
              includeUnknownBucket: false
            }
          );
          setDailyMetrics(daily);

          // ----- persistence -----
          try {
            localStorage.setItem('affiliateData', JSON.stringify(finalData));
            localStorage.setItem('affiliateRawData', JSON.stringify(data));
            localStorage.setItem('affiliateMetrics', JSON.stringify(metrics));
            localStorage.setItem('affiliateSubIdAnalysis', JSON.stringify(subIds));
            localStorage.setItem('affiliatePlatformAnalysis', JSON.stringify(platforms));
            localStorage.setItem('affiliateDailyMetrics', JSON.stringify(daily));
          } catch (error) {
            console.warn('Failed to save data to localStorage:', error);
          }

        } catch (error) {
          console.error('Error processing imported data:', error);
        } finally {
          setLoading(false);
        }
      }, 100);
    } catch (error) {
      console.error('Error in processImportedData:', error);
      setLoading(false);
    }
  };

  const resetToOriginalData = (originalData: ImportedData) => {
    setImportedData(originalData);
    
    const metrics = calculateMetrics(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      originalData.facebookAds,
      [], // No SubID filter
      "all", // No validity filter
      [], // No channel filter
      "all", // No platform filter
      { shopeeOrderIdKey: 'รหัสการสั่งซื้อ' }
    );
    setCalculatedMetrics(metrics);

    const subIds = analyzeSubIdPerformance(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      originalData.facebookAds
    );
    setSubIdAnalysis(subIds);

    const platforms = analyzePlatformPerformance(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      metrics.totalAdsSpent
    );
    setPlatformAnalysis(platforms);

    // กราฟรายวัน (unfiltered)
    const daily = analyzeDailyBreakdownStable(
      originalData.shopeeOrders,
      originalData.lazadaOrders,
      originalData.facebookAds,
      { shopeeOrderIdKey: 'รหัสการสั่งซื้อ', includeUnknownBucket: false }
    );
    setDailyMetrics(daily);
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
