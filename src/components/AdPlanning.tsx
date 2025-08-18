
import { useState, useMemo, useEffect, useRef } from "react";
import { startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, DollarSign } from "lucide-react";
import { calculateAdPlan } from "@/utils/adPlanningCalculations";
import StatsCard from "./StatsCard";
import { DateRange } from "react-day-picker";

interface AdPlanningProps {
  shopeeOrders: any[];
  lazadaOrders: any[];
  facebookAds: any[];
  dateRange?: DateRange;
}

export default function AdPlanning({ shopeeOrders, lazadaOrders, facebookAds, dateRange }: AdPlanningProps) {
  // Load initial state from localStorage
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('adPlanningState');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading ad planning state:', error);
    }
    return {
      selectedGoals: [] as string[],
      goalValues: {
        orderSP: "",
        amountLZD: "",
        totalCom: "",
        profit: "",
        linkClicks: ""
      },
      bonusAmount: "",
      maxBudgetPerSubId: "",
      selectedSubIds: [] as string[],
      optimizationStrategy: 'goal-first' as 'goal-first' | 'roi-first' | 'balanced',
      showResults: false
    };
  };

  // Use refs to persist form values across re-renders
  const formStateRef = useRef(getInitialState());

  const [selectedGoals, setSelectedGoals] = useState<string[]>(formStateRef.current.selectedGoals);
  const [goalValues, setGoalValues] = useState<{[key: string]: string}>(formStateRef.current.goalValues);
  const [bonusAmount, setBonusAmount] = useState<string>(formStateRef.current.bonusAmount);
  const [maxBudgetPerSubId, setMaxBudgetPerSubId] = useState<string>(formStateRef.current.maxBudgetPerSubId);
  const [selectedSubIds, setSelectedSubIds] = useState<string[]>(formStateRef.current.selectedSubIds);
  const [optimizationStrategy, setOptimizationStrategy] = useState<'goal-first' | 'roi-first' | 'balanced'>(formStateRef.current.optimizationStrategy || 'goal-first');
  const [showResults, setShowResults] = useState(false);

  // Store calculation parameters when user clicks Calculate
  const [calculationParams, setCalculationParams] = useState<any>(null);

  // Track if data has changed since last calculation
  const [dataChanged, setDataChanged] = useState(false);
  const lastCalculationDataRef = useRef<string>("");

  // Update ref and localStorage whenever state changes
  useEffect(() => {
    const newState = {
      selectedGoals,
      goalValues,
      bonusAmount,
      maxBudgetPerSubId,
      selectedSubIds,
      optimizationStrategy,
      showResults
    };
    formStateRef.current = newState;
    
    // Save to localStorage
    try {
      localStorage.setItem('adPlanningState', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving ad planning state:', error);
    }
  }, [selectedGoals, goalValues, bonusAmount, maxBudgetPerSubId, selectedSubIds, optimizationStrategy, showResults]);

  // Check if data has changed since last calculation
  useEffect(() => {
    const currentDataSignature = JSON.stringify({
      dateRange,
      shopeeCount: shopeeOrders.length,
      lazadaCount: lazadaOrders.length,
      facebookCount: facebookAds.length,
      selectedSubIds: selectedSubIds.sort(), // Include Sub ID selection in signature
      optimizationStrategy
    });
    
    if (showResults && lastCalculationDataRef.current && lastCalculationDataRef.current !== currentDataSignature) {
      setDataChanged(true);
    }
  }, [dateRange, shopeeOrders.length, lazadaOrders.length, facebookAds.length, selectedSubIds, optimizationStrategy, showResults]);
  
  const filteredData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return { shopeeOrders, lazadaOrders, facebookAds };
    
    const startDate = startOfDay(new Date(dateRange.from));
    const endDate = endOfDay(new Date(dateRange.to));
    
    // Filter Shopee orders by "เวลาที่สั่งซื้อ"
    const filteredShopeeOrders = shopeeOrders.filter(order => {
      const dateStr = order['เวลาที่สั่งซื้อ'];
      if (!dateStr) return false;
      
      try {
        const orderDate = new Date(dateStr);
        return orderDate >= startDate && orderDate <= endDate;
      } catch (error) {
        return false;
      }
    });
    
    // Filter Lazada orders by "Conversion Time" or "Order Time"
    const filteredLazadaOrders = lazadaOrders.filter(order => {
      const dateStr = order['Conversion Time'] || order['Order Time'];
      if (!dateStr) return false;
      
      try {
        const orderDate = new Date(dateStr);
        return orderDate >= startDate && orderDate <= endDate;
      } catch (error) {
        return false;
      }
    });
    
    // Filter Facebook Ads by "Day" or "Date"
    const filteredFacebookAds = facebookAds.filter(ad => {
      const dateStr = ad['Day'] || ad['Date'];
      if (!dateStr) return false;
      
      try {
        const adDate = new Date(dateStr);
        return adDate >= startDate && adDate <= endDate;
      } catch (error) {
        return false;
      }
    });
    
    return { 
      shopeeOrders: filteredShopeeOrders, 
      lazadaOrders: filteredLazadaOrders, 
      facebookAds: filteredFacebookAds 
    };
  }, [dateRange, shopeeOrders, lazadaOrders, facebookAds]);

  // Get available SubIDs that have Ad Spent data, sorted by Ad Spend (highest first)
  const availableSubIds = useMemo(() => {
    const subIdAdSpentMap = new Map<string, number>();
    
    // First, get all Sub IDs from orders
    const allOrderSubIds = new Set<string>();
    
    shopeeOrders.forEach(order => {
      [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
        .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '')
        .forEach(subId => allOrderSubIds.add(subId.trim()));
    });
    
    lazadaOrders.forEach(order => {
      [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']]
        .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '')
        .forEach(subId => allOrderSubIds.add(subId.trim()));
    });
    
    // Then, calculate total Ad Spent for each Sub ID
    facebookAds.forEach(ad => {
      const campaignName = (ad['Campaign name'] || '').toString().toLowerCase();
      const adSetName = (ad['Ad set name'] || '').toString().toLowerCase();
      const adName = (ad['Ad name'] || '').toString().toLowerCase();
      const adSpent = parseFloat(ad['Amount spent (THB)']) || 0;
      
      const allNames = `${campaignName} ${adSetName} ${adName}`;
      
      // Only include Sub IDs that appear in ad names AND have ad spend > 0
      if (adSpent > 0) {
        allOrderSubIds.forEach(subId => {
          if (allNames.includes(subId.toLowerCase())) {
            const currentSpent = subIdAdSpentMap.get(subId) || 0;
            subIdAdSpentMap.set(subId, currentSpent + adSpent);
          }
        });
      }
    });
    
    // Sort Sub IDs by Ad Spend (highest first)
    const sortedSubIds = Array.from(subIdAdSpentMap.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by Ad Spend descending
      .map(([subId]) => subId);
    
    console.log('Sub IDs sorted by Ad Spent:', sortedSubIds.map(subId => ({
      subId,
      adSpent: subIdAdSpentMap.get(subId)
    })));
    
    return sortedSubIds;
  }, [shopeeOrders, lazadaOrders, facebookAds]);

  // Calculate summary data for the selected date range
  const dateSummary = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return null;
    
    const totalAdSpend = filteredData.facebookAds.reduce((sum, ad) => {
      return sum + (parseFloat(ad['Amount spent (THB)']) || 0);
    }, 0);
    
    const totalComSP = filteredData.shopeeOrders.reduce((sum, order) => {
      return sum + (parseFloat(order['คอมมิชชั่นสินค้าโดยรวม(฿)']) || 0);
    }, 0);
    
    const totalComLZD = filteredData.lazadaOrders.reduce((sum, order) => {
      return sum + (parseFloat(order['Payout']) || 0);
    }, 0);
    
    const totalCom = totalComSP + totalComLZD;
    const totalProfit = totalCom - totalAdSpend;
    const overallROI = totalAdSpend > 0 ? (totalProfit / totalAdSpend) * 100 : 0;
    
    const orderSP = filteredData.shopeeOrders.length;
    const orderLZD = filteredData.lazadaOrders.length;
    
    const cpoSP = orderSP > 0 ? totalAdSpend / orderSP : 0;
    const amountLZD = filteredData.lazadaOrders.reduce((sum, order) => {
      return sum + (parseFloat(order['Order Amount']) || 0);
    }, 0);
    
    const linkClicks = filteredData.facebookAds.reduce((sum, ad) => {
      return sum + (parseFloat(ad['Link clicks']) || 0);
    }, 0);
    
    const cpcLink = linkClicks > 0 ? totalAdSpend / linkClicks : 0;
    const apcLZD = totalAdSpend > 0 ? amountLZD / totalAdSpend : 0;
    
    return {
      adSpend: totalAdSpend,
      totalCom,
      totalProfit,
      overallROI,
      comSP: totalComSP,
      comLZD: totalComLZD,
      orderSP,
      orderLZD,
      cpoSP,
      amountLZD,
      cpcLink,
      apcLZD
    };
  }, [filteredData, dateRange]);

  const adPlan = useMemo(() => {
    // Only show results if user has clicked calculate button AND has calculation parameters
    if (!showResults || !calculationParams) return null;
    
    console.log('AdPlanning - Using stored calculation params:', calculationParams);
    
    return calculateAdPlan(calculationParams);
  }, [showResults, calculationParams]);

  // Mark data as changed when form inputs change (if results are already shown)
  useEffect(() => {
    if (showResults && calculationParams) {
      // Check if current form values differ from stored calculation params
      const currentSubIdsToUse = selectedSubIds.length > 0 ? selectedSubIds : availableSubIds;
      const hasChanges = 
        JSON.stringify(calculationParams.goals) !== JSON.stringify(selectedGoals) ||
        JSON.stringify(calculationParams.goalValues) !== JSON.stringify(goalValues) ||
        calculationParams.bonusAmount !== (parseFloat(bonusAmount) || 0) ||
        calculationParams.maxBudgetPerSubId !== (parseFloat(maxBudgetPerSubId) || 0) ||
        JSON.stringify(calculationParams.selectedSubIds.sort()) !== JSON.stringify(currentSubIdsToUse.sort()) ||
        calculationParams.optimizationStrategy !== optimizationStrategy;
      
      if (hasChanges) {
        setDataChanged(true);
      }
    }
  }, [selectedGoals, goalValues, bonusAmount, maxBudgetPerSubId, selectedSubIds, optimizationStrategy, availableSubIds, showResults, calculationParams]);

  const handleReset = () => {
    const initialState = {
      selectedGoals: [] as string[],
      goalValues: {
        orderSP: "",
        amountLZD: "",
        totalCom: "",
        profit: "",
        linkClicks: ""
      },
      bonusAmount: "",
      maxBudgetPerSubId: "",
      selectedSubIds: [] as string[],
      optimizationStrategy: 'goal-first' as 'goal-first' | 'roi-first' | 'balanced',
      showResults: false
    };
    
    // Reset all state
    setSelectedGoals(initialState.selectedGoals);
    setGoalValues(initialState.goalValues);
    setBonusAmount(initialState.bonusAmount);
    setMaxBudgetPerSubId(initialState.maxBudgetPerSubId);
    setSelectedSubIds(initialState.selectedSubIds);
    setOptimizationStrategy(initialState.optimizationStrategy);
    setShowResults(initialState.showResults);
    setCalculationParams(null);
    setDataChanged(false);
    
    // Clear localStorage
    try {
      localStorage.removeItem('adPlanningState');
    } catch (error) {
      console.error('Error clearing ad planning state:', error);
    }
  };

  const handleCalculate = () => {
    if (selectedGoals.length === 0) {
      alert("กรุณาเลือก Campaign Goals อย่างน้อย 1 รายการ");
      return;
    }
    
    // Check if selected goals have values
    const hasEmptyValues = selectedGoals.some(goal => !goalValues[goal] || parseFloat(goalValues[goal]) <= 0);
    if (hasEmptyValues) {
      alert("กรุณากรอกค่าเป้าหมายให้ครบทุกรายการที่เลือก");
      return;
    }
    
    // If no Sub IDs selected, use all available Sub IDs
    const subIdsToUse = selectedSubIds.length > 0 ? selectedSubIds : availableSubIds;
    
    // Store calculation parameters at the time of calculation
    const params = {
      historicalData: filteredData,
      goals: selectedGoals,
      goalValues: goalValues,
      bonusAmount: parseFloat(bonusAmount) || 0,
      maxBudgetPerSubId: parseFloat(maxBudgetPerSubId) || 0,
      selectedSubIds: subIdsToUse,
      optimizationStrategy: optimizationStrategy
    };
    
    console.log('Storing calculation params:', params);
    setCalculationParams(params);
    
    // Update last calculation data signature
    lastCalculationDataRef.current = JSON.stringify({
      dateRange,
      shopeeCount: shopeeOrders.length,
      lazadaCount: lazadaOrders.length,
      facebookCount: facebookAds.length,
      selectedSubIds: selectedSubIds.sort(),
      optimizationStrategy
    });
    
    setDataChanged(false);
    setShowResults(true);
  };

  const handleGoalToggle = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const handleGoalValueChange = (goal: string, value: string) => {
    setGoalValues(prev => ({
      ...prev,
      [goal]: value
    }));
  };

  const handleSubIdToggle = (subId: string) => {
    console.log('Toggling Sub ID:', subId);
    console.log('Current selectedSubIds:', selectedSubIds);
    
    if (selectedSubIds.includes(subId)) {
      const newSelection = selectedSubIds.filter(id => id !== subId);
      console.log('Removing Sub ID, new selection:', newSelection);
      setSelectedSubIds(newSelection);
    } else {
      const newSelection = [...selectedSubIds, subId];
      console.log('Adding Sub ID, new selection:', newSelection);
      setSelectedSubIds(newSelection);
    }
  };

  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case 'orderSP': return 'Order SP (จำนวนออเดอร์ Shopee)';
      case 'amountLZD': return 'Amount LZD (ยอดขาย Lazada)';
      case 'totalCom': return 'Total Com (ค่าคอมรวมทั้งหมด)';
      case 'profit': return 'Profit (จำนวนกำไร)';
      default: return '';
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30">
              <Target className="h-8 w-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold luxury-text">วางแผนการยิงแอดอัจฉริยะ</h1>
          </div>
          <p className="text-white/70 max-w-2xl mx-auto">
            กำหนดเป้าหมายและงบประมาณเพื่อสร้างแผนการยิงแอดที่เหมาะสมจากข้อมูลประสิทธิภาพในอดีต พร้อมคาดการณ์ผลลัพท์ที่แม่นยำ
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range Summary using Dashboard-style cards */}
        {dateSummary && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-400" />
              สรุปข้อมูลช่วงวันที่ที่เลือก
            </h3>
            
            {/* Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <StatsCard 
                title="Ad Spend" 
                value={formatCurrency(dateSummary.adSpend)} 
                change={0}
                icon={<DollarSign size={20} className="text-blue-400" />}
                colorClass="from-blue-500/20 to-blue-600/5"
                animationDelay="0ms"
              />
              
              <StatsCard 
                title="Total Com" 
                value={formatCurrency(dateSummary.totalCom)} 
                change={0} 
                icon={<TrendingUp size={20} className="text-green-400" />}
                colorClass="from-green-500/20 to-green-600/5"
                animationDelay="50ms"
              />
              
              <StatsCard 
                title="Total Profit" 
                value={formatCurrency(dateSummary.totalProfit)} 
                change={0} 
                icon={<Target size={20} className="text-blue-400" />}
                colorClass="from-blue-500/20 to-blue-600/5"
                animationDelay="100ms"
              />
              
              <StatsCard 
                title="Overall ROI" 
                value={formatPercentage(dateSummary.overallROI)} 
                change={0} 
                icon={<span className="text-lg">📈</span>}
                colorClass="from-purple-500/20 to-purple-600/5"
                animationDelay="150ms"
              />
            </div>
          </div>
        )}

        {/* Planning Form - Updated Layout */}
        <div className="space-y-4">
          {/* Campaign Goals - Multiple Selection */}
          <div className="space-y-4">
            <div className="border-b border-orange-500/30 pb-2 mb-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-orange-400" />
                Campaign Goals
              </h3>
              <p className="text-sm text-muted-foreground mt-1">เลือกเป้าหมายที่ต้องการบรรลุ (เลือกได้หลายรายการ)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order SP */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="orderSP"
                    checked={selectedGoals.includes('orderSP')}
                    onCheckedChange={() => handleGoalToggle('orderSP')}
                  />
                  <Label htmlFor="orderSP" className="font-medium cursor-pointer">
                    Order SP (จำนวนออเดอร์ Shopee)
                  </Label>
                </div>
                {selectedGoals.includes('orderSP') && (
                  <Input
                    type="number"
                    placeholder="จำนวนออเดอร์ที่ต้องการ"
                    value={goalValues.orderSP}
                    onChange={(e) => handleGoalValueChange('orderSP', e.target.value)}
                  />
                )}
              </div>

              {/* Amount LZD */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="amountLZD"
                    checked={selectedGoals.includes('amountLZD')}
                    onCheckedChange={() => handleGoalToggle('amountLZD')}
                  />
                  <Label htmlFor="amountLZD" className="font-medium cursor-pointer">
                    Amount LZD (ยอดขาย Lazada)
                  </Label>
                </div>
                {selectedGoals.includes('amountLZD') && (
                  <Input
                    type="number"
                    placeholder="ยอดขายที่ต้องการ (฿)"
                    value={goalValues.amountLZD}
                    onChange={(e) => handleGoalValueChange('amountLZD', e.target.value)}
                  />
                )}
              </div>

              {/* Total Com */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="totalCom"
                    checked={selectedGoals.includes('totalCom')}
                    onCheckedChange={() => handleGoalToggle('totalCom')}
                  />
                  <Label htmlFor="totalCom" className="font-medium cursor-pointer">
                    Total Com (ค่าคอมรวมทั้งหมด)
                  </Label>
                </div>
                {selectedGoals.includes('totalCom') && (
                  <Input
                    type="number"
                    placeholder="ค่าคอมที่ต้องการ (฿)"
                    value={goalValues.totalCom}
                    onChange={(e) => handleGoalValueChange('totalCom', e.target.value)}
                  />
                )}
              </div>

              {/* Profit */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="profit"
                    checked={selectedGoals.includes('profit')}
                    onCheckedChange={() => handleGoalToggle('profit')}
                  />
                  <Label htmlFor="profit" className="font-medium cursor-pointer">
                    Profit (จำนวนกำไร)
                  </Label>
                </div>
                {selectedGoals.includes('profit') && (
                  <Input
                    type="number"
                    placeholder="กำไรที่ต้องการ (฿)"
                    value={goalValues.profit}
                    onChange={(e) => handleGoalValueChange('profit', e.target.value)}
                  />
                )}
              </div>

              {/* Link Clicks */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="linkClicks"
                    checked={selectedGoals.includes('linkClicks')}
                    onCheckedChange={() => handleGoalToggle('linkClicks')}
                  />
                  <Label htmlFor="linkClicks" className="font-medium cursor-pointer">
                    Link Clicks (จำนวนคลิก)
                  </Label>
                </div>
                {selectedGoals.includes('linkClicks') && (
                  <Input
                    type="number"
                    placeholder="จำนวนคลิกที่ต้องการ"
                    value={goalValues.linkClicks}
                    onChange={(e) => handleGoalValueChange('linkClicks', e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Optimization Strategy */}
          <div className="space-y-4">
            <div className="border-b border-orange-500/30 pb-2">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                Optimization Strategy
              </h3>
              <p className="text-sm text-muted-foreground mt-1">เลือกกลยุทธ์การจัดสรรงบประมาณ</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${optimizationStrategy === 'goal-first' ? 'border-blue-500 bg-blue-500/10' : 'border-border hover:border-blue-300'}`}
                   onClick={() => setOptimizationStrategy('goal-first')}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${optimizationStrategy === 'goal-first' ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}></div>
                  <h4 className="font-medium">Goal-First</h4>
                </div>
                <p className="text-sm text-muted-foreground">เน้นให้ถึงเป้าหมายเป็นหลัก จัดสรรงบตาม Sub IDs ที่เลือกก่อน</p>
              </div>
              
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${optimizationStrategy === 'roi-first' ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-green-300'}`}
                   onClick={() => setOptimizationStrategy('roi-first')}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${optimizationStrategy === 'roi-first' ? 'border-green-500 bg-green-500' : 'border-gray-400'}`}></div>
                  <h4 className="font-medium">ROI-First</h4>
                </div>
                <p className="text-sm text-muted-foreground">เน้น Sub IDs ที่มี ROI สูงก่อน เพื่อประสิทธิภาพสูงสุด</p>
              </div>
              
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${optimizationStrategy === 'balanced' ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-300'}`}
                   onClick={() => setOptimizationStrategy('balanced')}>
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 ${optimizationStrategy === 'balanced' ? 'border-purple-500 bg-purple-500' : 'border-gray-400'}`}></div>
                  <h4 className="font-medium">Balanced</h4>
                </div>
                <p className="text-sm text-muted-foreground">สมดุลระหว่าง ROI และเป้าหมาย (60% ROI + 40% Goal)</p>
              </div>
            </div>
          </div>

          {/* Budget & Bonus Configuration */}
          <div className="space-y-4">
            <div className="border-b border-orange-500/30 pb-2">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                Budget & Bonus Settings
              </h3>
              <p className="text-sm text-muted-foreground mt-1">กำหนดงบประมาณและโบนัสสำหรับแคมเปญ</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>โบนัสเมื่อเป้าหมายสำเร็จ (฿)</Label>
              <Input
                type="number"
                placeholder="0"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>งบยิงแอดสูงสุด (ต่อ Sub ID)</Label>
              <Input
                type="number"
                placeholder="0 = ไม่จำกัด"
                value={maxBudgetPerSubId}
                onChange={(e) => setMaxBudgetPerSubId(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                เป็นการกำหนดเพดานสูงสุดต่อ Sub ID เท่านั้น งบจริงจะคำนวณจากเป้าหมาย
              </div>
            </div>
          </div>
          </div>

          {/* Sub ID Selection */}
          <div className="space-y-4">
            <div className="border-b border-orange-500/30 pb-2">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-400" />
                Sub ID Selection
              </h3>
              <p className="text-sm text-muted-foreground mt-1">เลือก Sub ID ที่ต้องการใช้ในการคำนวณ (ไม่เลือก = ใช้ทั้งหมด)</p>
              
              {/* Warning about NEW entries */}
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-400 mt-0.5">💡</div>
                  <div className="text-sm">
                    <div className="font-medium text-blue-300 mb-1">เกี่ยวกับ NEW Entries:</div>
                    <div className="text-blue-200/80">
                      • <strong>NEW entries</strong> จะถูกสร้างขึ้นเมื่อเป้าหมายยังไม่ถึงหลังจากใช้ Sub IDs ที่เลือกแล้ว<br/>
                      • หากไม่เลือก Sub ID ใดๆ ระบบจะใช้ทุก Sub ID และสร้าง NEW entries ได้<br/>
                      • <strong className="text-yellow-300">หากต้องการ NEW entries ให้เลือก Sub IDs ที่ต้องการก่อน</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {/* Selection Summary */}
              <div className="mb-4 p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {selectedSubIds.length > 0 ? (
                      <span className="text-green-400">เลือกแล้ว {selectedSubIds.length} Sub IDs</span>
                    ) : (
                      <span className="text-yellow-400">ไม่ได้เลือก Sub ID (จะใช้ทั้งหมด {availableSubIds.length} Sub IDs)</span>
                    )}
                  </div>
                  {selectedSubIds.length > 0 && (
                    <div className="text-xs text-blue-300">
                      ✨ สามารถสร้าง NEW entries ได้
                    </div>
                  )}
                </div>
                {selectedSubIds.length === 0 && (
                  <div className="text-xs text-yellow-300 mt-1">
                    ⚠️ NEW entries จะไม่ถูกสร้างเมื่อใช้ทุก Sub ID
                  </div>
                )}
              </div>
              
              {/* Table Header */}
              <div className="grid grid-cols-6 gap-2 p-2 bg-secondary/30 rounded-lg text-xs font-medium text-muted-foreground mb-2">
                <div>Select</div>
                <div>Sub ID</div>
                <div className="text-center">Ad Spend</div>
                <div className="text-center">Total Com</div>
                <div className="text-center">ROI</div>
                <div className="text-center">Status</div>
              </div>
              
              {/* Table Rows */}
              <div className="space-y-1">
                {availableSubIds.map((subId, index) => {
                  // Calculate metrics for this Sub ID
                  const adSpent = facebookAds.reduce((sum, ad) => {
                    const campaignName = (ad['Campaign name'] || '').toString().toLowerCase();
                    const adSetName = (ad['Ad set name'] || '').toString().toLowerCase();
                    const adName = (ad['Ad name'] || '').toString().toLowerCase();
                    const allNames = `${campaignName} ${adSetName} ${adName}`;
                    const spent = parseFloat(ad['Amount spent (THB)']) || 0;
                    
                    if (spent > 0 && allNames.includes(subId.toLowerCase())) {
                      return sum + spent;
                    }
                    return sum;
                  }, 0);

                  // Calculate Total Com from Shopee and Lazada (unique orders only)
                  const uniqueShopeeOrders = new Map();
                  shopeeOrders.forEach(order => {
                    const orderId = order['เลขที่คำสั่งซื้อ'];
                    if (!uniqueShopeeOrders.has(orderId)) {
                      uniqueShopeeOrders.set(orderId, order);
                    }
                  });

                  const totalComSP = Array.from(uniqueShopeeOrders.values()).reduce((sum, order) => {
                    const orderSubIds = [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
                      .filter(id => id && typeof id === 'string' && id.trim() !== '');
                    if (orderSubIds.includes(subId)) {
                      const commission = parseFloat(order['คอมมิชชั่นสินค้าโดยรวม(฿)']) || 0;
                      return sum + (commission / orderSubIds.length);
                    }
                    return sum;
                  }, 0);

                  const uniqueLazadaOrders = new Map();
                  lazadaOrders.forEach(order => {
                    const checkoutId = order['Check Out ID'];
                    if (!uniqueLazadaOrders.has(checkoutId)) {
                      uniqueLazadaOrders.set(checkoutId, order);
                    }
                  });

                  const totalComLZD = Array.from(uniqueLazadaOrders.values()).reduce((sum, order) => {
                    const orderSubIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']]
                      .filter(id => id && typeof id === 'string' && id.trim() !== '');
                    if (orderSubIds.includes(subId)) {
                      const commission = parseFloat(order['Payout']) || 0;
                      return sum + (commission / orderSubIds.length);
                    }
                    return sum;
                  }, 0);

                  const totalCom = totalComSP + totalComLZD;
                  const profit = totalCom - adSpent;
                  const roi = adSpent > 0 ? (profit / adSpent) * 100 : 0;
                  
                  return (
                    <div key={subId} className="grid grid-cols-6 gap-2 p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors items-center">
                      <div>
                        <Checkbox
                          id={subId}
                          checked={selectedSubIds.includes(subId)}
                          onCheckedChange={() => handleSubIdToggle(subId)}
                        />
                      </div>
                      <div>
                        <label htmlFor={subId} className="text-sm font-medium cursor-pointer">
                          {subId}
                        </label>
                      </div>
                      <div className="text-center text-sm">
                        {formatCurrency(adSpent)}
                      </div>
                      <div className="text-center text-sm">
                        {formatCurrency(totalCom)}
                      </div>
                      <div className={`text-center text-sm font-medium ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {roi.toFixed(1)}%
                      </div>
                      <div className="text-center">
                        {selectedSubIds.includes(subId) ? (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Selected</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">Available</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-muted-foreground mb-2">
                  {selectedSubIds.length > 0 
                    ? `เลือกแล้ว: ${selectedSubIds.length} รายการ` 
                    : `จะใช้ทั้งหมด: ${availableSubIds.length} รายการ`
                  }
                </div>
                {selectedSubIds.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedSubIds.map(subId => (
                      <Badge key={subId} variant="secondary" className="text-xs">
                        {subId}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Calculate and Reset Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={handleCalculate} 
            className={`w-full transition-all duration-300 ${
              dataChanged 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-orange-500/25' 
                : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg shadow-orange-500/20'
            } text-white font-semibold`}
          >
            <Target className="mr-2 h-4 w-4" />
            {showResults ? "Recalculate Campaign" : "Calculate Campaign"}
          </Button>
          
          <Button 
            onClick={handleReset}
            variant="outline"
            className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
          >
            Reset All Data
          </Button>
          
          {showResults && dataChanged && (
            <div className="text-sm text-center">
              <div className="text-red-400 font-medium flex items-center justify-center gap-1">
                <span className="animate-pulse">⚡</span>
                Data has changed - Click to update results
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {showResults && adPlan && (
          <div className="space-y-6 pt-4 border-t">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-6 w-6 text-orange-400" />
              Campaign Summary
            </h3>
            
            {/* Sub ID Recommendations Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-400" />
                  Recommended Sub IDs
                </CardTitle>
                {adPlan.recommendedSubIds && (() => {
                  const originalCount = adPlan.recommendedSubIds.filter(s => !s.id.startsWith('NEW for')).length;
                  const newCount = adPlan.recommendedSubIds.filter(s => s.id.startsWith('NEW for')).length;
                  return newCount > 0 ? (
                    <div className="text-sm text-muted-foreground">
                      📊 รวม {adPlan.recommendedSubIds.length} รายการ | 
                      🔵 Sub ID เดิม: {originalCount} รายการ | 
                      🆕 NEW entries: <span className="text-yellow-400 font-semibold">{newCount} รายการ</span>
                      {newCount > 0 && (
                        <div className="text-xs mt-1 text-yellow-400">
                          ⚡ ระบบสร้าง NEW entries เพิ่มเติมเพื่อให้บรรลุเป้าหมาย
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      📊 รวม {adPlan.recommendedSubIds.length} รายการ
                    </div>
                  );
                })()}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-medium text-sm">Sub ID</th>
                        <th className="text-center p-3 font-medium text-sm">Platform</th>
                        <th className="text-center p-3 font-medium text-sm">งบยิงแอด</th>
                        <th className="text-center p-3 font-medium text-sm">Order SP</th>
                        <th className="text-center p-3 font-medium text-sm">Com SP</th>
                        <th className="text-center p-3 font-medium text-sm">Com LZD</th>
                        <th className="text-center p-3 font-medium text-sm">Total Com</th>
                        <th className="text-center p-3 font-medium text-sm">Link Clicks</th>
                        <th className="text-center p-3 font-medium text-sm">Profit</th>
                        <th className="text-center p-3 font-medium text-sm">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adPlan.recommendedSubIds && adPlan.recommendedSubIds.map((subId, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-secondary/20">
                          <td className="p-3">
                            <div className="font-medium">
                              {subId.id.startsWith('NEW for') ? (
                                <span className="text-yellow-400 font-bold">🆕 {subId.id}</span>
                              ) : (
                                <span>{subId.id}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={`text-xs ${
                              subId.platform === 'Shopee' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                              subId.platform === 'Lazada' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                              subId.platform === 'Mixed' ? 'bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-blue-400 border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                              {subId.platform}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-medium text-white">{formatCurrency(subId.recommendedBudget)}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-orange-400 font-medium">{subId.expectedOrderSP || 0}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-orange-400 font-medium">{formatCurrency(subId.expectedComSP || 0)}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-purple-400 font-medium">{formatCurrency(subId.expectedComLZD || 0)}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-white font-medium">{formatCurrency((subId.expectedComSP || 0) + (subId.expectedComLZD || 0))}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-white font-medium">{subId.expectedLinkClicks || 0}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-white font-medium">{formatCurrency(subId.expectedProfit || 0)}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`font-medium ${(subId.expectedROI || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {subId.expectedROI ? subId.expectedROI.toFixed(1) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* คาดการณ์ผลลัพท์ */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-lg text-center bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  คาดการณ์ผลลัพท์
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-muted-foreground">งบยิงแอด</div>
                    <div className="text-xl font-bold text-white">{formatCurrency(adPlan.totalAdSpend || 0)}</div>
                  </div>
                  
                  {/* Campaign Goals - Show predicted values for selected goals */}
                  {selectedGoals.map(goal => {
                    const goalResult = adPlan.goalResults?.[goal];
                    if (!goalResult) return null;
                    
                    const getGoalInfo = (goalKey: string) => {
                      switch (goalKey) {
                        case 'orderSP': return { label: 'Order SP คาดการณ์', color: 'text-orange-400', unit: 'ออเดอร์' };
                        case 'amountLZD': return { label: 'Amount LZD คาดการณ์', color: 'text-purple-400', unit: '' };
                        case 'totalCom': return { label: 'Total Com คาดการณ์', color: 'text-white', unit: '' };
                        case 'profit': return { label: 'Profit คาดการณ์', color: 'text-white', unit: '' };
                        case 'linkClicks': return { label: 'Link Clicks คาดการณ์', color: 'text-white', unit: 'คลิก' };
                        default: return { label: `${goalKey} คาดการณ์`, color: 'text-white', unit: '' };
                      }
                    };
                    
                    const goalInfo = getGoalInfo(goal);
                    const expectedValue = goalResult.expectedValue || 0;
                    const displayValue = ['totalCom', 'profit', 'amountLZD'].includes(goal) 
                      ? formatCurrency(expectedValue) 
                      : Math.round(expectedValue).toLocaleString();
                    
                    return (
                      <div key={goal}>
                        <div className="text-sm text-muted-foreground">{goalInfo.label}</div>
                        <div className={`text-xl font-bold ${goalInfo.color}`}>
                          {displayValue} {goalInfo.unit}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </CardContent>
            </Card>

            {/* Goal Results Summary - Enhanced Design */}
            {adPlan.goalResults && Object.keys(adPlan.goalResults).length > 0 && (
              <Card className="bg-gradient-to-br from-emerald-500/10 via-blue-500/10 to-purple-500/10 border-2 border-emerald-500/30 shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-center bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <div className="relative">
                      <Target className="h-6 w-6 text-emerald-400 animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                    </div>
                    🎯 ผลลัพธ์ตามเป้าหมายที่เลือก
                  </CardTitle>
                  <div className="text-center text-sm text-muted-foreground mt-2">
                    ✨ วิเคราะห์ความเป็นไปได้ในการบรรลุเป้าหมายของคุณ
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(adPlan.goalResults).map(([goal, result], index) => {
                      const getGoalInfo = (goalKey: string) => {
                        switch (goalKey) {
                          case 'orderSP': return { 
                            label: 'Order SP', 
                            color: 'text-orange-400', 
                            bgColor: 'from-orange-500/20 to-orange-600/10',
                            borderColor: 'border-orange-500/30',
                            icon: '🛒',
                            unit: 'ออเดอร์' 
                          };
                          case 'amountLZD': return { 
                            label: 'Amount LZD', 
                            color: 'text-purple-400', 
                            bgColor: 'from-purple-500/20 to-purple-600/10',
                            borderColor: 'border-purple-500/30',
                            icon: '💰',
                            unit: '' 
                          };
                          case 'totalCom': return { 
                            label: 'Total Com', 
                            color: 'text-green-400', 
                            bgColor: 'from-green-500/20 to-green-600/10',
                            borderColor: 'border-green-500/30',
                            icon: '💎',
                            unit: '' 
                          };
                          case 'profit': return { 
                            label: 'Profit', 
                            color: 'text-blue-400', 
                            bgColor: 'from-blue-500/20 to-blue-600/10',
                            borderColor: 'border-blue-500/30',
                            icon: '🚀',
                            unit: '' 
                          };
                          case 'linkClicks': return { 
                            label: 'Link Clicks', 
                            color: 'text-yellow-400', 
                            bgColor: 'from-yellow-500/20 to-yellow-600/10',
                            borderColor: 'border-yellow-500/30',
                            icon: '👆',
                            unit: 'คลิก' 
                          };
                          default: return { 
                            label: goalKey, 
                            color: 'text-gray-400', 
                            bgColor: 'from-gray-500/20 to-gray-600/10',
                            borderColor: 'border-gray-500/30',
                            icon: '📊',
                            unit: '' 
                          };
                        }
                      };
                      
                      const goalInfo = getGoalInfo(goal);
                      const isAchievable = result.achievable && result.expectedValue >= result.targetValue * 0.8;
                      const achievementPercentage = Math.min((result.expectedValue / result.targetValue) * 100, 100);
                      
                      return (
                        <div 
                          key={goal} 
                          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${goalInfo.bgColor} border-2 ${goalInfo.borderColor} p-6 space-y-4 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Background Pattern */}
                          <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                            <div className="text-6xl">{goalInfo.icon}</div>
                          </div>
                          
                          {/* Header */}
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3">
                              <div className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-2xl">{goalInfo.icon}</span>
                                {goalInfo.label}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isAchievable ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {achievementPercentage.toFixed(0)}%
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-700/50 rounded-full h-2 mb-4">
                              <div 
                                className={`h-2 rounded-full transition-all duration-1000 ${
                                  isAchievable ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-orange-500'
                                }`}
                                style={{ width: `${Math.min(achievementPercentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="relative z-10 space-y-3">
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground mb-1">🎯 เป้าหมาย</div>
                              <div className={`text-2xl font-bold ${goalInfo.color}`}>
                                {result.targetValue.toLocaleString()} {goalInfo.unit}
                              </div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground mb-1">📈 คาดการณ์</div>
                              <div className={`text-xl font-bold ${isAchievable ? 'text-green-400' : 'text-orange-400'}`}>
                                {Math.round(result.expectedValue).toLocaleString()} {goalInfo.unit}
                              </div>
                            </div>
                            
                            <div className="text-center pt-2 border-t border-white/10">
                              <div className="text-xs text-muted-foreground mb-1">💸 งบประมาณ</div>
                              <div className="text-sm font-medium text-blue-300">
                                {formatCurrency(result.budgetAllocated)}
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="text-center pt-3">
                              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                                isAchievable 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {isAchievable ? (
                                  <>
                                    <span className="animate-bounce">🎉</span>
                                    บรรลุเป้าหมาย
                                  </>
                                ) : (
                                  <>
                                    <span className="animate-pulse">⚡</span>
                                    ต้องปรับแผน
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* สรุปผลลัพท์สุดท้าย - Premium Summary */}
            <div className="mt-8 p-8 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 border-2 border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-sm">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  💎 สรุปผลลัพท์สุดท้าย
                </h2>
                <p className="text-white/70">ภาพรวมการลงทุนและผลตอบแทนที่คาดหวัง</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Com */}
                <div className="text-center p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-xl">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-sm text-green-300 mb-2">Total Commission</div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(adPlan.expectedCommission || 0)}
                  </div>
                </div>

                {/* ROI */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-xl">
                  <div className="text-4xl mb-3">📈</div>
                  <div className="text-sm text-blue-300 mb-2">Return on Investment</div>
                  <div className={`text-2xl font-bold ${(adPlan.expectedROI || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {adPlan.expectedROI ? adPlan.expectedROI.toFixed(1) : 0}%
                  </div>
                </div>

                {/* โบนัส */}
                <div className="text-center p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                  <div className="text-4xl mb-3">🎁</div>
                  <div className="text-sm text-yellow-300 mb-2">โบนัสเมื่อเป้าหมายสำเร็จ</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {formatCurrency(parseFloat(bonusAmount) || 0)}
                  </div>
                </div>

                {/* รวมกำไรสุทธิ */}
                <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-xl">
                  <div className="text-4xl mb-3">🏆</div>
                  <div className="text-sm text-purple-300 mb-2">รวมกำไรสุทธิ</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {formatCurrency((adPlan.netProfit || 0) + (parseFloat(bonusAmount) || 0))}
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500/30 to-blue-500/30 border border-emerald-500/50 rounded-full">
                  <span className="text-2xl animate-bounce">🚀</span>
                  <span className="text-lg font-semibold text-white">พร้อมเริ่มแคมเปญแล้ว!</span>
                  <span className="text-2xl animate-bounce">✨</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
