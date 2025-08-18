import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DataImport from "@/components/DataImport";
import AdPlanning from "@/components/AdPlanning";
import Settings from "@/components/Settings";
import Update from "@/pages/Update";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import CampaignTable from "@/components/CampaignTable";
import DataSourceIndicator from "@/components/DataSourceIndicator";
import SubIdTable from "@/components/SubIdTable";
import TopProductsTable from "@/components/TopProductsTable";
import TopCategoryTable from "@/components/TopCategoryTable";
import TopAdsTable from "@/components/TopAdsTable";
import TopCategoryDonutChart from "@/components/TopCategoryDonutChart";
import TotalComDailyTable from "@/components/TotalComDailyTable";
import BubblePlotChart from "@/components/BubblePlotChart";
import StatsChart from "@/components/StatsChart";
import OrderChart from "@/components/OrderChart";
import ComChart from "@/components/ComChart";
import AdsChart from "@/components/AdsChart";

import DateRangeSelector from "@/components/DateRangeSelector";
import SubIdFilter from "@/components/SubIdFilter";
import PlatformFilter from "@/components/PlatformFilter";
import ChannelFilter from "@/components/ChannelFilter";
import { useImportedData } from "@/hooks/useImportedData";
import { generateTraditionalCampaigns } from "@/utils/affiliateCalculations";
import { DollarSign, TrendingUp, Target, ShoppingCart, Upload, RotateCcw, AlertTriangle, CheckCircle } from "lucide-react";
import AffiliatePerformanceChart from "@/components/AffiliatePerformanceChart";
import { getProductionConfig } from "@/config/production";
import { performanceMonitor } from "@/lib/performance-monitor";
import { analytics } from "@/lib/analytics";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>([]);
  const [selectedValidity, setSelectedValidity] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [originalData, setOriginalData] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const config = getProductionConfig();
  
  // Persistent data storage for each platform
  const [storedData, setStoredData] = useState<{
    shopee: { data: any[], fileName: string, timestamp: Date, size: number, rowCount: number } | null;
    lazada: { data: any[], fileName: string, timestamp: Date, size: number, rowCount: number } | null;
    facebook: { data: any[], fileName: string, timestamp: Date, size: number, rowCount: number } | null;
  }>(() => {
    // Note: We don't load from localStorage anymore due to size limitations
    // Data will be lost on refresh, but this prevents quota errors
    return {
      shopee: null,
      lazada: null,
      facebook: null,
    };
  });

  // Save to localStorage whenever storedData changes (with size limit)
  useEffect(() => {
    try {
      // Only save metadata, not the actual data arrays (too large for localStorage)
      const metadataOnly = {
        shopee: storedData.shopee ? {
          fileName: storedData.shopee.fileName,
          timestamp: storedData.shopee.timestamp,
          size: storedData.shopee.size,
          rowCount: storedData.shopee.rowCount,
          data: [] // Don't save actual data
        } : null,
        lazada: storedData.lazada ? {
          fileName: storedData.lazada.fileName,
          timestamp: storedData.lazada.timestamp,
          size: storedData.lazada.size,
          rowCount: storedData.lazada.rowCount,
          data: [] // Don't save actual data
        } : null,
        facebook: storedData.facebook ? {
          fileName: storedData.facebook.fileName,
          timestamp: storedData.facebook.timestamp,
          size: storedData.facebook.size,
          rowCount: storedData.facebook.rowCount,
          data: [] // Don't save actual data
        } : null,
      };
      localStorage.setItem('affilitics-stored-metadata', JSON.stringify(metadataOnly));
    } catch (error) {
      console.error('Error saving stored data metadata to localStorage:', error);
    }
  }, [storedData]);
  
  const { 
    importedData, 
    rawData,
    calculatedMetrics, 
    subIdAnalysis, 
    dailyMetrics,
    loading: importLoading, 
    processImportedData, 
    resetToOriginalData,
    hasData, 
    rawShopeeCommission,
    rawShopeeOrderCount,
    uniqueShopeeOrderCount
  } = useImportedData();

  // Load data from storedData on app start
  useEffect(() => {
    const hasStoredData = storedData.shopee || storedData.lazada || storedData.facebook;
    const totalStoredRows = (storedData.shopee?.rowCount || 0) + (storedData.lazada?.rowCount || 0) + (storedData.facebook?.rowCount || 0);
    
    if (hasStoredData && totalStoredRows > 0 && !originalData) {
      const loadedData = {
        shopeeOrders: storedData.shopee?.data || [],
        lazadaOrders: storedData.lazada?.data || [],
        facebookAds: storedData.facebook?.data || [],
        totalRows: totalStoredRows,
        errors: [],
      };
      console.log('Loading data from storedData on app start:', loadedData);
      console.log('StoredData details:', {
        shopee: storedData.shopee?.rowCount || 0,
        lazada: storedData.lazada?.rowCount || 0,
        facebook: storedData.facebook?.rowCount || 0,
        total: totalStoredRows
      });
      setOriginalData(loadedData);
      processImportedData(loadedData, selectedSubIds, selectedValidity, selectedChannels, dateRange, selectedPlatform);
    }
  }, [storedData]);

  // Re-process data when filters change (with debouncing for date range)
  useEffect(() => {
    if (originalData) {
      const timeoutId = setTimeout(() => {
        processImportedData(originalData, selectedSubIds, selectedValidity, selectedChannels, dateRange, selectedPlatform);
      }, dateRange ? 300 : 0); // 300ms delay for date range changes, immediate for others
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedSubIds, selectedValidity, selectedChannels, dateRange, selectedPlatform]);

  const getStatValue = (key: string, defaultValue: number = 0) => {
    if (hasData && calculatedMetrics) {
      const value = calculatedMetrics[key as keyof typeof calculatedMetrics];
      return typeof value === 'number' && !isNaN(value) ? value : defaultValue;
    }
    return defaultValue;
  };

  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const handleImportClick = () => {
    setActiveView("import");
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
  };

  const handleDataImport = (data: any) => {
    console.log('Received data in handleDataImport:', data);
    console.log('Data details:', {
      shopeeCount: data.shopeeOrders?.length || 0,
      lazadaCount: data.lazadaOrders?.length || 0,
      facebookCount: data.facebookAds?.length || 0,
      totalRows: data.totalRows
    });
    setOriginalData(data); // Store original data
    processImportedData(data, selectedSubIds, selectedValidity, selectedChannels, dateRange, selectedPlatform);
  };

  const handleResetFilters = () => {
    setSelectedSubIds([]);
    setSelectedValidity("all");
    setSelectedPlatform("all");
    setSelectedChannels([]);
    setDateRange(undefined);
    
    // Reset to original unfiltered data
    if (originalData) {
      resetToOriginalData(originalData);
    }
  };

  if (importLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-lg text-white/70">กำลังประมวลผลข้อมูล...</div>
          <div className="text-sm text-white/50">กรุณารอสักครู่</div>
        </div>
      </div>
    );
  }

  const renderFilters = () => (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-card rounded-lg border">
      <DateRangeSelector 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {hasData && (
        <>
          <SubIdFilter
            shopeeOrders={importedData?.shopeeOrders || []}
            lazadaOrders={importedData?.lazadaOrders || []}
            selectedSubIds={selectedSubIds}
            onSubIdChange={setSelectedSubIds}
          />

          <ChannelFilter
            shopeeOrders={importedData?.shopeeOrders || []}
            selectedChannels={selectedChannels}
            onChannelChange={setSelectedChannels}
          />

          <PlatformFilter
            selectedPlatform={selectedPlatform}
            onPlatformChange={setSelectedPlatform}
          />

          <Select value={selectedValidity} onValueChange={setSelectedValidity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="🔍 Validity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Validity</SelectItem>
              <SelectItem value="valid">Valid Only</SelectItem>
              <SelectItem value="invalid">Invalid Only</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            onClick={handleResetFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            รีเซ็ตตัวกรอง
          </Button>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "import":
        return (
          <DataImport 
            onDataImported={handleDataImport} 
            onNavigateToDashboard={() => setActiveView("dashboard")}
            storedData={storedData}
            onStoredDataUpdate={setStoredData}
          />
        );
      
      case "planning":
        return (
          <div className="space-y-6">
            {renderFilters()}
            <AdPlanning 
              shopeeOrders={importedData?.shopeeOrders || []}
              lazadaOrders={importedData?.lazadaOrders || []}
              facebookAds={importedData?.facebookAds || []}
              dateRange={dateRange}
            />
          </div>
        );
      
      case "update":
        return <Update />;
      
      case "settings":
        return <Settings />;
      
      default:
        return (
          <div className="space-y-6">
            {/* Loading overlay for data processing */}
            {importLoading && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-card p-6 rounded-xl border shadow-xl text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <div className="text-white">กำลังประมวลผลข้อมูล...</div>
                </div>
              </div>
            )}
            
            {/* Debug: {console.log('Dashboard render - hasData:', hasData, 'importedData:', importedData, 'calculatedMetrics:', calculatedMetrics)} */}
            {!hasData ? (
              <div className="relative min-h-[80vh]">
                {/* Background Preview */}
                <div className="absolute inset-0 opacity-8 pointer-events-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="glass-panel p-6 rounded-lg bg-gradient-to-br from-red-500/5 to-red-600/5 border-red-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground/70">Ad Spend</div>
                        <DollarSign className="h-5 w-5 text-red-400/70" />
                      </div>
                      <div className="h-6 bg-foreground/10 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-foreground/10 rounded w-1/2"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-lg bg-gradient-to-br from-green-500/5 to-green-600/5 border-green-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground/70">Total Com</div>
                        <TrendingUp className="h-5 w-5 text-green-400/70" />
                      </div>
                      <div className="h-6 bg-foreground/10 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-foreground/10 rounded w-1/2"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-lg bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground/70">Total Profit</div>
                        <Target className="h-5 w-5 text-blue-400/70" />
                      </div>
                      <div className="h-6 bg-foreground/10 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-foreground/10 rounded w-1/2"></div>
                    </div>
                    <div className="glass-panel p-6 rounded-lg bg-gradient-to-br from-purple-500/5 to-purple-600/5 border-purple-500/20">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground/70">Overall ROI</div>
                        <span className="text-lg opacity-70">📈</span>
                      </div>
                      <div className="h-6 bg-foreground/10 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-foreground/10 rounded w-1/2"></div>
                    </div>
                  </div>
                  
                  {/* Mock Chart */}
                  <div className="glass-panel p-6 rounded-lg mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-lg">📈</span>
                      <div className="h-4 bg-foreground/10 rounded w-1/4"></div>
                    </div>
                    <div className="h-64 bg-foreground/5 rounded flex items-end gap-2 p-4">
                      {[40, 65, 45, 80, 55, 75, 60, 90, 70, 85, 60, 95].map((height, i) => (
                        <div 
                          key={i} 
                          className="bg-gradient-to-t from-blue-500/20 to-purple-500/20 rounded-t flex-1" 
                          style={{ height: `${height}%` }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Mock Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="glass-panel p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">🎯</span>
                        <div className="h-4 bg-foreground/10 rounded w-1/3"></div>
                      </div>
                      <div className="space-y-3">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="h-3 bg-foreground/10 rounded flex-1 mr-4"></div>
                            <div className="h-3 bg-foreground/10 rounded w-16"></div>
                            <div className="h-3 bg-foreground/10 rounded w-16 ml-4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="glass-panel p-6 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">📢</span>
                        <div className="h-4 bg-foreground/10 rounded w-1/3"></div>
                      </div>
                      <div className="space-y-3">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="h-3 bg-foreground/10 rounded flex-1 mr-4"></div>
                            <div className="h-3 bg-foreground/10 rounded w-16"></div>
                            <div className="h-3 bg-foreground/10 rounded w-16 ml-4"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] space-y-8">
                  <div className="text-center space-y-6 bg-card/95 backdrop-blur-lg p-12 rounded-3xl border-2 border-border/50 shadow-2xl max-w-2xl">
                    <div className="text-8xl animate-pulse">🎯</div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      กรุณาอัปโหลดข้อมูลเพื่อเริ่มต้นวิเคราะห์
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                      อัปโหลดไฟล์ CSV/XLSX จาก Shopee, Lazada และ Facebook Ads 
                      เพื่อเริ่มต้นวิเคราะห์ผลการดำเนินงานและวางแผนการยิงแอดอย่างมีประสิทธิภาพ
                    </p>
                    <div className="space-y-4">
                      <Button 
                        onClick={() => setActiveView("import")} 
                        size="lg" 
                        className="px-8 py-4 text-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold shadow-lg shadow-orange-500/25 transition-all duration-300 border-0"
                      >
                        <Upload className="mr-3 h-6 w-6" />
                        เริ่มต้น Import Data
                      </Button>
                      <div className="flex flex-wrap justify-center gap-3 mt-4">
                        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                          🛒 Shopee
                        </Badge>
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                          🛍️ Lazada
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          📘 Facebook Ads
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {renderFilters()}

                {/* Data Source Indicator */}
                {(importedData?.dataSourceStats || importedData?.mergeResults) && (
                  <DataSourceIndicator 
                    dataSourceStats={importedData.dataSourceStats}
                    mergeResults={importedData.mergeResults}
                    conflictAnalysis={importedData.conflictAnalysis}
                    mergeReport={importedData.mergeReport}
                  />
                )}

                {/* Main KPI Cards with Platform Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    title="Ad Spend"
                    value={formatCurrency(getStatValue('totalAdsSpent', 0))}
                    change={0}
                    icon={<DollarSign className="h-4 w-4 text-blue-500" />}
                    colorClass="from-blue-500/10 to-blue-600/5"
                    animationDelay="0ms"
                  />
                  <StatsCard
                    title="Total Com"
                    value={formatCurrency(getStatValue('totalCom', 0))}
                    change={0}
                    icon={<TrendingUp className="h-4 w-4 text-green-500" />}
                    colorClass="from-green-500/10 to-green-600/5"
                    animationDelay="100ms"
                  />
                  <StatsCard
                    title="Total Profit"
                    value={formatCurrency(getStatValue('profit', 0))}
                    change={0}
                    icon={<Target className="h-4 w-4 text-blue-500" />}
                    colorClass="from-blue-500/10 to-blue-600/5"
                    animationDelay="200ms"
                  />
                  <StatsCard
                    title="Overall ROI"
                    value={`${getStatValue('roi', 0).toFixed(1)}%`}
                    change={0}
                    icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
                    colorClass="from-purple-500/10 to-purple-600/5"
                    animationDelay="300ms"
                  />
                </div>

                {/* Platform Specific Cards with Platform Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    title="Com SP"
                    value={formatCurrency(rawShopeeCommission)}
                    change={0}
                    icon={<ShoppingCart className="h-4 w-4 text-orange-500" />}
                    colorClass="from-orange-500/10 to-orange-600/5"
                    animationDelay="0ms"
                  />
                  <StatsCard
                    title="Com LZD"
                    value={formatCurrency(getStatValue('totalComLZD', 0))}
                    change={0}
                    icon={<ShoppingCart className="h-4 w-4 text-purple-500" />}
                    colorClass="from-purple-500/10 to-purple-600/5"
                    animationDelay="100ms"
                  />
                  <StatsCard
                    title="Order SP"
                    value={uniqueShopeeOrderCount.toLocaleString()}
                    change={0}
                    icon={<Target className="h-4 w-4 text-orange-500" />}
                    colorClass="from-orange-500/10 to-orange-600/5"
                    animationDelay="200ms"
                  />
                  <StatsCard
                    title="Order LZD"
                    value={getStatValue('totalOrdersLZD', 0).toLocaleString()}
                    change={0}
                    icon={<Target className="h-4 w-4 text-purple-500" />}
                    colorClass="from-purple-500/10 to-purple-600/5"
                    animationDelay="300ms"
                  />
                </div>

                {/* Performance Metrics with Platform Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    title="CPO SP"
                    value={formatCurrency(getStatValue('cpoSP', 0))}
                    change={0}
                    icon={<DollarSign className="h-4 w-4 text-orange-500" />}
                    colorClass="from-orange-500/10 to-orange-600/5"
                    animationDelay="0ms"
                  />
                  <StatsCard
                    title="Amount LZD"
                    value={formatCurrency(getStatValue('totalAmountLZD', 0))}
                    change={0}
                    icon={<DollarSign className="h-4 w-4 text-purple-500" />}
                    colorClass="from-purple-500/10 to-purple-600/5"
                    animationDelay="100ms"
                  />
                  <StatsCard
                    title="CPC Link"
                    value={formatCurrency(getStatValue('cpcLink', 0))}
                    change={0}
                    icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
                    colorClass="from-blue-500/10 to-blue-600/5"
                    animationDelay="200ms"
                  />
                  <StatsCard
                    title="APC LZD"
                    value={getStatValue('apcLZD', 0).toFixed(2)}
                    change={0}
                    icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
                    colorClass="from-purple-500/10 to-purple-600/5"
                    animationDelay="300ms"
                  />
                </div>

                {/* Multi-Stats Chart */}
                <StatsChart 
                  dailyMetrics={dailyMetrics || []}
                  calculatedMetrics={calculatedMetrics}
                />

                {/* Order Chart & Com Chart - Same Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <OrderChart 
                    dailyMetrics={dailyMetrics || []}
                    calculatedMetrics={calculatedMetrics}
                  />
                  <ComChart 
                    dailyMetrics={dailyMetrics || []}
                    calculatedMetrics={calculatedMetrics}
                  />
                </div>

                {/* Ads Chart */}
                <AdsChart 
                  dailyMetrics={dailyMetrics || []}
                  calculatedMetrics={calculatedMetrics}
                />

                {/* Affiliate Performance Chart */}
                <AffiliatePerformanceChart 
                  dailyMetrics={dailyMetrics || []}
                />

                {/* Campaign Performance Table */}
                <CampaignTable 
                  campaigns={generateTraditionalCampaigns(
                    importedData?.shopeeOrders || [],
                    importedData?.lazadaOrders || [],
                    importedData?.facebookAds || []
                  )}
                  facebookAds={importedData?.facebookAds || []}
                  showPlatform={selectedPlatform}
                />

                {/* Tables - New Layout */}
                <SubIdTable 
                  shopeeOrders={importedData?.shopeeOrders || []}
                  lazadaOrders={importedData?.lazadaOrders || []}
                  facebookAds={importedData?.facebookAds || []}
                  selectedSubIds={[]} // Don't double filter
                  selectedChannels={[]} // Don't double filter
                  selectedPlatform="all" // Don't double filter
                  dateRange={undefined} // Don't double filter
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TopProductsTable 
                    shopeeOrders={importedData?.shopeeOrders || []}
                    lazadaOrders={importedData?.lazadaOrders || []}
                    selectedSubIds={[]} // Don't double filter
                    selectedChannels={[]} // Don't double filter
                    selectedPlatform="all" // Don't double filter
                    dateRange={undefined} // Don't double filter
                  />

                  <div className="space-y-6">
                    <TopCategoryTable 
                      shopeeOrders={importedData?.shopeeOrders || []}
                      lazadaOrders={importedData?.lazadaOrders || []}
                      selectedSubIds={[]} // Don't double filter
                      selectedChannels={[]} // Don't double filter
                      selectedPlatform="all" // Don't double filter
                      dateRange={undefined} // Don't double filter
                    />
                    
                    <TopCategoryDonutChart 
                      shopeeOrders={importedData?.shopeeOrders || []}
                      lazadaOrders={importedData?.lazadaOrders || []}
                      selectedSubIds={[]} // Don't double filter
                      selectedChannels={[]} // Don't double filter
                      selectedPlatform="all" // Don't double filter
                      dateRange={undefined} // Don't double filter
                    />
                  </div>
                </div>

                <TopAdsTable 
                  facebookAds={importedData?.facebookAds || []}
                  selectedSubIds={[]} // Don't double filter
                  selectedChannels={[]} // Don't double filter
                  selectedPlatform="all" // Don't double filter
                  dateRange={undefined} // Don't double filter
                />

                <TotalComDailyTable 
                  dailyMetrics={dailyMetrics || []}
                />

                <BubblePlotChart 
                  subIdAnalysis={subIdAnalysis || []}
                />
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        onImportClick={handleImportClick}
        activeView={activeView}
        onNavigate={handleNavigate}
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="luxury-text">🚀 Affilitics.me</span>
            <span className="text-white/60 text-2xl ml-2">v2.5.1</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            "ยกระดับการทำ Affiliate Marketing ด้วย AI และ Data Analytics ที่ทรงพลัง"
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
