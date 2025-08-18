interface AdPlanInput {
  historicalData: {
    shopeeOrders: any[];
    lazadaOrders: any[];
    facebookAds: any[];
  };
  goals: string[];
  goalValues: {[key: string]: string};
  bonusAmount: number;
  maxBudgetPerSubId: number;
  selectedSubIds: string[];
  optimizationStrategy: 'goal-first' | 'roi-first' | 'balanced';
}

interface SubIdRecommendation {
  id: string;
  platform: string;
  recommendedBudget: number;
  expectedROI: number;
  historicalROI: number;
  confidence: number;
  expectedOrderSP: number;
  expectedOrderLZD: number;
  expectedAmountLZD: number;
  expectedTotalCom: number;
  expectedComSP: number;
  expectedComLZD: number;
  expectedProfit: number;
  expectedLinkClicks: number;
}

interface AdPlanResult {
  recommendedSubIds: SubIdRecommendation[];
  totalAdSpend: number;
  expectedCommission: number;
  expectedRevenue: number;
  netProfit: number;
  expectedROI: number;
  expectedOrders: number;
  goalResults: {[key: string]: {
    targetValue: number;
    expectedValue: number;
    budgetAllocated: number;
    achievable: boolean;
  }};
}

function parseNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value || value === '') return 0;
  
  const cleaned = value.toString().replace(/[,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function extractSubIdsFromAdsReport(facebookAds: any[], shopeeOrders: any[], lazadaOrders: any[]): Set<string> {
  const adsSubIds = new Set<string>();
  
  // First, get all Sub IDs from order data
  const allOrderSubIds = new Set<string>();
  
  // Extract from Shopee orders
  shopeeOrders.forEach(order => {
    [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
      .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '')
      .forEach(subId => allOrderSubIds.add(subId.trim()));
  });
  
  // Extract from Lazada orders
  lazadaOrders.forEach(order => {
    [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']]
      .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '')
      .forEach(subId => allOrderSubIds.add(subId.trim()));
  });
  
  console.log('All Sub IDs from orders:', Array.from(allOrderSubIds));
  
  // Now check which Sub IDs appear in Facebook Ads names
  facebookAds.forEach(ad => {
    const campaignName = (ad['Campaign name'] || '').toString();
    const adSetName = (ad['Ad set name'] || '').toString();
    const adName = (ad['Ad name'] || '').toString();
    
    const allNames = `${campaignName} ${adSetName} ${adName}`.toLowerCase();
    
    // Check each Sub ID from orders to see if it appears in ad names
    allOrderSubIds.forEach(subId => {
      if (allNames.includes(subId.toLowerCase())) {
        adsSubIds.add(subId);
      }
    });
  });
  
  console.log('Sub IDs found in Facebook Ads:', Array.from(adsSubIds));
  
  return adsSubIds;
}

function analyzeHistoricalSubIdPerformance(
  shopeeOrders: any[],
  lazadaOrders: any[],
  facebookAds: any[]
): Map<string, { roi: number; orders: number; commission: number; adSpend: number; platform: string; ordersSP: number; ordersLZD: number; comSP: number; comLZD: number; amountLZD: number; linkClicks: number }> {
  const subIdPerformance = new Map();
  
  // Get Sub IDs that exist in Facebook Ads reports
  const adsReportSubIds = extractSubIdsFromAdsReport(facebookAds, shopeeOrders, lazadaOrders);
  
  console.log('Sub IDs found in Facebook Ads report:', Array.from(adsReportSubIds));
  
  // Calculate ad spend per Sub ID by matching with Facebook Ads data
  const subIdAdSpend = new Map<string, number>();
  
  facebookAds.forEach(ad => {
    const campaignName = ad['Campaign name'] || '';
    const adSetName = ad['Ad set name'] || '';
    const adName = ad['Ad name'] || '';
    const adSpent = parseNumber(ad['Amount spent (THB)']);
    
    const allNames = `${campaignName} ${adSetName} ${adName}`.toLowerCase();
    
    // Match Sub IDs in ads with their spend
    adsReportSubIds.forEach(subId => {
      if (allNames.includes(subId.toLowerCase())) {
        const currentSpend = subIdAdSpend.get(subId) || 0;
        subIdAdSpend.set(subId, currentSpend + adSpent);
      }
    });
  });
  
  // Calculate link clicks per Sub ID
  const subIdLinkClicks = new Map<string, number>();
  
  facebookAds.forEach(ad => {
    const campaignName = ad['Campaign name'] || '';
    const adSetName = ad['Ad set name'] || '';
    const adName = ad['Ad name'] || '';
    const linkClicks = parseNumber(ad['Link clicks']);
    
    const allNames = `${campaignName} ${adSetName} ${adName}`.toLowerCase();
    
    // Match Sub IDs in ads with their link clicks
    adsReportSubIds.forEach(subId => {
      if (allNames.includes(subId.toLowerCase())) {
        const currentClicks = subIdLinkClicks.get(subId) || 0;
        subIdLinkClicks.set(subId, currentClicks + linkClicks);
      }
    });
  });

  // Initialize performance data for all Sub IDs found in ads
  adsReportSubIds.forEach(subId => {
    if (!subIdPerformance.has(subId)) {
      subIdPerformance.set(subId, {
        roi: 0,
        orders: 0,
        commission: 0,
        adSpend: subIdAdSpend.get(subId) || 0,
        platform: 'Mixed', // Will be updated based on actual data
        ordersSP: 0,
        ordersLZD: 0,
        comSP: 0,
        comLZD: 0,
        amountLZD: 0,
        linkClicks: subIdLinkClicks.get(subId) || 0
      });
    }
  });

  // Analyze Shopee Sub IDs - combine data for same Sub ID
  shopeeOrders.forEach(order => {
    const subIds = [
      order['Sub_id1'],
      order['Sub_id2'], 
      order['Sub_id3'],
      order['Sub_id4'],
      order['Sub_id5']
    ].filter(Boolean);
    
    subIds.forEach(subId => {
      if (subId && adsReportSubIds.has(subId)) {
        const commission = parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
        const existing = subIdPerformance.get(subId);
        
        if (existing) {
          existing.ordersSP += 1;
          existing.orders += 1;
          existing.comSP += commission;
          existing.commission += commission;
          
          // Update platform info
          if (existing.platform === 'Mixed') {
            existing.platform = existing.ordersLZD > 0 ? 'Mixed' : 'Shopee';
          } else if (existing.platform === 'Lazada') {
            existing.platform = 'Mixed';
          }
          
          // Recalculate ROI
          existing.roi = existing.adSpend > 0 ? ((existing.commission - existing.adSpend) / existing.adSpend) * 100 : 0;
        }
      }
    });
  });
  
  // Analyze Lazada Sub IDs - combine data for same Sub ID
  lazadaOrders.forEach(order => {
    const subIds = [
      order['Aff Sub ID'],
      order['Sub ID 1'],
      order['Sub ID 2'], 
      order['Sub ID 3'],
      order['Sub ID 4']
    ].filter(Boolean);
    
    subIds.forEach(subId => {
      if (subId && adsReportSubIds.has(subId)) {
        const commission = parseNumber(order['Payout']);
        const orderAmount = parseNumber(order['Order Amount']);
        const existing = subIdPerformance.get(subId);
        
        if (existing) {
          existing.ordersLZD += 1;
          existing.orders += 1;
          existing.comLZD += commission;
          existing.commission += commission;
          existing.amountLZD += orderAmount;
          
          // Update platform info
          if (existing.platform === 'Mixed') {
            existing.platform = 'Mixed';
          } else if (existing.platform === 'Shopee') {
            existing.platform = 'Mixed';
          } else {
            existing.platform = existing.ordersSP > 0 ? 'Mixed' : 'Lazada';
          }
          
          // Recalculate ROI
          existing.roi = existing.adSpend > 0 ? ((existing.commission - existing.adSpend) / existing.adSpend) * 100 : 0;
        }
      }
    });
  });
  
  console.log('Sub ID performance analysis:', Object.fromEntries(subIdPerformance));
  
  return subIdPerformance;
}

// Calculate optimal budget for NEW entry based on remaining goals
function calculateOptimalNewEntryBudget(
  subId: string,
  performance: any,
  remainingGoals: {[key: string]: number},
  maxBudget: number
): number {
  if (performance.adSpend <= 0) {
    // No historical data, use conservative approach
    return Math.min(1000, maxBudget);
  }

  // Calculate how much budget is needed to achieve remaining goals
  let requiredBudgets: number[] = [];

  Object.entries(remainingGoals).forEach(([goal, remaining]) => {
    if (remaining <= 0) return;

    let requiredBudget = 0;
    
    switch (goal) {
      case 'orderSP':
        const orderSPPerBudget = performance.ordersSP / performance.adSpend;
        if (orderSPPerBudget > 0) {
          requiredBudget = remaining / orderSPPerBudget;
        }
        break;
        
      case 'orderLZD':
        const orderLZDPerBudget = performance.ordersLZD / performance.adSpend;
        if (orderLZDPerBudget > 0) {
          requiredBudget = remaining / orderLZDPerBudget;
        }
        break;
        
      case 'amountLZD':
        const amountLZDPerBudget = performance.amountLZD / performance.adSpend;
        if (amountLZDPerBudget > 0) {
          requiredBudget = remaining / amountLZDPerBudget;
        }
        break;
        
      case 'totalCom':
        const totalComPerBudget = performance.commission / performance.adSpend;
        if (totalComPerBudget > 0) {
          requiredBudget = remaining / totalComPerBudget;
        }
        break;
        
      case 'profit':
        const profitPerBudget = (performance.commission - performance.adSpend) / performance.adSpend;
        if (profitPerBudget > 0) {
          requiredBudget = remaining / profitPerBudget;
        }
        break;
        
      case 'linkClicks':
        const linkClicksPerBudget = performance.linkClicks / performance.adSpend;
        if (linkClicksPerBudget > 0) {
          requiredBudget = remaining / linkClicksPerBudget;
        }
        break;
    }
    
    if (requiredBudget > 0) {
      requiredBudgets.push(requiredBudget);
    }
  });

  if (requiredBudgets.length === 0) {
    // No specific requirements, use conservative approach
    return Math.min(1000, maxBudget);
  }

  // Use the minimum required budget (most conservative approach)
  const minRequiredBudget = Math.min(...requiredBudgets);
  
  // For NEW entries, be more aggressive to ensure goals are met
  const minBudget = Math.max(500, maxBudget * 0.05); // At least 5% of maxBudget or 500 baht
  const optimalBudget = Math.max(minBudget, Math.min(minRequiredBudget, maxBudget));
  
  return Math.round(optimalBudget);
}

export function calculateAdPlan(input: AdPlanInput): AdPlanResult {
  const { historicalData, goals, goalValues, bonusAmount, maxBudgetPerSubId, selectedSubIds, optimizationStrategy } = input;
  
  // Analyze historical performance - only Sub IDs that exist in ads report
  const subIdPerformance = analyzeHistoricalSubIdPerformance(
    historicalData.shopeeOrders,
    historicalData.lazadaOrders,
    historicalData.facebookAds
  );
  
  // If no Sub IDs found in ads report, create basic performance data from selected Sub IDs
  if (subIdPerformance.size === 0 && selectedSubIds.length > 0) {
    console.log('No Sub IDs found in ads report, creating basic performance data');
    
    // Create basic performance data for selected Sub IDs
    selectedSubIds.forEach(subId => {
      // Find this Sub ID in order data to get basic metrics
      let orders = 0;
      let commission = 0;
      let platform = 'Mixed';
      
      // Check Shopee orders
      historicalData.shopeeOrders.forEach(order => {
        const orderSubIds = [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']];
        if (orderSubIds.includes(subId)) {
          orders += 1;
          commission += parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
          platform = 'Shopee';
        }
      });
      
      // Check Lazada orders
      historicalData.lazadaOrders.forEach(order => {
        const orderSubIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']];
        if (orderSubIds.includes(subId)) {
          orders += 1;
          commission += parseNumber(order['Payout']);
          platform = platform === 'Shopee' ? 'Mixed' : 'Lazada';
        }
      });
      
      if (orders > 0) {
        // Estimate ad spend based on average industry metrics (assume 20% ROI)
        const estimatedAdSpend = commission / 1.2;
        const roi = estimatedAdSpend > 0 ? ((commission - estimatedAdSpend) / estimatedAdSpend) * 100 : 20;
        
        subIdPerformance.set(subId, {
          roi,
          orders,
          commission,
          adSpend: estimatedAdSpend,
          platform,
          ordersSP: platform === 'Shopee' ? orders : 0,
          ordersLZD: platform === 'Lazada' ? orders : 0,
          comSP: platform === 'Shopee' ? commission : 0,
          comLZD: platform === 'Lazada' ? commission : 0,
          amountLZD: platform === 'Lazada' ? commission * 8 : 0, // Estimate amount
          linkClicks: Math.round(estimatedAdSpend / 5) // Estimate clicks
        });
      }
    });
  }
  
  // If still no performance data, return empty result
  if (subIdPerformance.size === 0) {
    return {
      recommendedSubIds: [],
      totalAdSpend: 0,
      expectedCommission: 0,
      expectedRevenue: 0,
      netProfit: 0,
      expectedROI: 0,
      expectedOrders: 0,
      goalResults: {}
    };
  }
  
  // Filter by selectedSubIds if provided
  console.log('Selected Sub IDs for calculation:', selectedSubIds);
  console.log('Available Sub IDs in performance data:', Array.from(subIdPerformance.keys()));
  
  const filteredSubIdPerformance = selectedSubIds.length > 0 
    ? new Map(Array.from(subIdPerformance.entries()).filter(([subId]) => selectedSubIds.includes(subId)))
    : subIdPerformance;
    
  console.log('Filtered Sub IDs for calculation:', Array.from(filteredSubIdPerformance.keys()));
  
  // Sort Sub IDs based on optimization strategy
  let sortedSubIds = Array.from(filteredSubIdPerformance.entries())
    .filter(([_, perf]) => perf.orders > 0); // Only Sub IDs with order data
  
  // Apply sorting based on optimization strategy
  switch (optimizationStrategy) {
    case 'roi-first':
      // Sort by ROI (highest first)
      sortedSubIds = sortedSubIds.sort((a, b) => b[1].roi - a[1].roi);
      break;
    
    case 'balanced':
      // Sort by balanced score (ROI + Goal Contribution)
      sortedSubIds = sortedSubIds.sort((a, b) => {
        const scoreA = calculateBalancedScore(a[1], goals, goalValues);
        const scoreB = calculateBalancedScore(b[1], goals, goalValues);
        return scoreB - scoreA;
      });
      break;
    
    case 'goal-first':
    default:
      // Sort by goal contribution efficiency (current behavior)
      sortedSubIds = sortedSubIds.sort((a, b) => {
        const efficiencyA = calculateGoalEfficiency(a[1], goals, goalValues);
        const efficiencyB = calculateGoalEfficiency(b[1], goals, goalValues);
        return efficiencyB - efficiencyA;
      });
      break;
  }
  
  sortedSubIds = sortedSubIds.slice(0, 10); // Top 10 performing Sub IDs
  
  if (sortedSubIds.length === 0) {
    return {
      recommendedSubIds: [],
      totalAdSpend: 0,
      expectedCommission: 0,
      expectedRevenue: 0,
      netProfit: 0,
      expectedROI: 0,
      expectedOrders: 0,
      goalResults: {}
    };
  }
  
  // Helper functions for different sorting strategies
  function calculateBalancedScore(performance: any, goals: string[], goalValues: {[key: string]: string}): number {
    const roiWeight = 0.6; // 60% weight for ROI
    const goalWeight = 0.4; // 40% weight for goal contribution
    
    const roiScore = performance.roi / 100; // Normalize ROI
    const goalScore = calculateGoalEfficiency(performance, goals, goalValues);
    
    return (roiWeight * roiScore) + (goalWeight * goalScore);
  }
  
  function calculateGoalEfficiency(performance: any, goals: string[], goalValues: {[key: string]: string}): number {
    if (performance.adSpend <= 0) return 0;
    
    let totalEfficiency = 0;
    let goalCount = 0;
    
    goals.forEach(goal => {
      const targetValue = parseFloat(goalValues[goal]) || 0;
      if (targetValue <= 0) return;
      
      let contributionPerBudget = 0;
      switch (goal) {
        case 'orderSP': 
          contributionPerBudget = performance.ordersSP / performance.adSpend; 
          break;
        case 'amountLZD': 
          contributionPerBudget = performance.amountLZD / performance.adSpend; 
          break;
        case 'totalCom': 
          contributionPerBudget = (performance.comSP + performance.comLZD) / performance.adSpend; 
          break;
        case 'profit': 
          contributionPerBudget = (performance.commission - performance.adSpend) / performance.adSpend; 
          break;
        case 'linkClicks': 
          contributionPerBudget = performance.linkClicks / performance.adSpend; 
          break;
      }
      
      totalEfficiency += contributionPerBudget;
      goalCount++;
    });
    
    return goalCount > 0 ? totalEfficiency / goalCount : 0;
  }

  // Calculate average metrics from historical data
  const historicalMetrics = {
    avgROI: sortedSubIds.reduce((sum, [_, perf]) => sum + perf.roi, 0) / sortedSubIds.length,
    avgOrderValue: (historicalData.shopeeOrders.reduce((sum, o) => sum + parseNumber(o['มูลค่าซื้อ(฿)']), 0) +
                   historicalData.lazadaOrders.reduce((sum, o) => sum + parseNumber(o['Order Amount']), 0)) / 
                   (historicalData.shopeeOrders.length + historicalData.lazadaOrders.length) || 1000,
    avgCommissionRate: 0.05 // 5% default commission rate
  };
  
  // Calculate required budget based on multiple goals
  let totalBudgetRequired = 0;
  let expectedCommission = 0;
  let expectedRevenue = 0;
  let expectedOrders = 0;
  let expectedLinkClicks = 0;
  const goalResults: {[key: string]: any} = {};
  
  // Calculate budget requirements for each goal
  goals.forEach(goal => {
    const targetValue = parseFloat(goalValues[goal]) || 0;
    if (targetValue <= 0) return;
    
    let goalBudget = 0;
    let goalExpectedCommission = 0;
    let goalExpectedRevenue = 0;
    let goalExpectedOrders = 0;
    let goalExpectedClicks = 0;
    
    if (goal === 'orderSP') {
      // Calculate budget needed for target Shopee orders
      const avgCPOSP = sortedSubIds
        .filter(([_, perf]) => perf.ordersSP > 0)
        .reduce((sum, [_, perf]) => sum + (perf.adSpend / perf.ordersSP), 0) / 
        sortedSubIds.filter(([_, perf]) => perf.ordersSP > 0).length || 100;
      
      goalBudget = targetValue * avgCPOSP;
      goalExpectedOrders = targetValue;
      goalExpectedRevenue = goalExpectedOrders * historicalMetrics.avgOrderValue;
      goalExpectedCommission = goalExpectedRevenue * historicalMetrics.avgCommissionRate;
      
    } else if (goal === 'amountLZD') {
      // Calculate budget needed for target Lazada amount
      goalExpectedRevenue = targetValue;
      goalExpectedOrders = targetValue / historicalMetrics.avgOrderValue;
      goalExpectedCommission = targetValue * historicalMetrics.avgCommissionRate;
      goalBudget = goalExpectedCommission / (historicalMetrics.avgROI / 100 + 1);
      
    } else if (goal === 'totalCom') {
      // Calculate budget needed for target commission
      goalExpectedCommission = targetValue;
      goalExpectedRevenue = targetValue / historicalMetrics.avgCommissionRate;
      goalExpectedOrders = goalExpectedRevenue / historicalMetrics.avgOrderValue;
      goalBudget = goalExpectedCommission / (historicalMetrics.avgROI / 100 + 1);
      
    } else if (goal === 'profit') {
      // Calculate budget needed for target profit
      goalBudget = targetValue / (historicalMetrics.avgROI / 100);
      goalExpectedCommission = goalBudget * (1 + historicalMetrics.avgROI / 100);
      goalExpectedRevenue = goalExpectedCommission / historicalMetrics.avgCommissionRate;
      goalExpectedOrders = goalExpectedRevenue / historicalMetrics.avgOrderValue;
      
    } else if (goal === 'linkClicks') {
      // Calculate budget needed for target link clicks
      const avgCPC = historicalData.facebookAds.reduce((sum, ad) => {
        const spent = parseFloat(ad['Amount spent (THB)']) || 0;
        const clicks = parseFloat(ad['Link clicks']) || 0;
        return sum + (clicks > 0 ? spent / clicks : 0);
      }, 0) / historicalData.facebookAds.filter(ad => parseFloat(ad['Link clicks']) > 0).length || 5;
      
      goalBudget = targetValue * avgCPC;
      goalExpectedClicks = targetValue;
      // Estimate commission based on click-to-conversion rate
      const avgConversionRate = 0.02; // 2% conversion rate assumption
      goalExpectedOrders = targetValue * avgConversionRate;
      goalExpectedRevenue = goalExpectedOrders * historicalMetrics.avgOrderValue;
      goalExpectedCommission = goalExpectedRevenue * historicalMetrics.avgCommissionRate;
    }
    
    // Store goal results
    goalResults[goal] = {
      targetValue,
      expectedValue: goal === 'linkClicks' ? goalExpectedClicks : 
                   goal === 'orderSP' ? goalExpectedOrders :
                   goal === 'amountLZD' ? goalExpectedRevenue :
                   goal === 'totalCom' ? goalExpectedCommission :
                   goal === 'profit' ? (goalExpectedCommission - goalBudget) : 0,
      budgetAllocated: goalBudget,
      achievable: goalBudget > 0
    };
    
    // Use the highest budget requirement among all goals
    totalBudgetRequired = Math.max(totalBudgetRequired, goalBudget);
    expectedCommission = Math.max(expectedCommission, goalExpectedCommission);
    expectedRevenue = Math.max(expectedRevenue, goalExpectedRevenue);
    expectedOrders = Math.max(expectedOrders, goalExpectedOrders);
    expectedLinkClicks = Math.max(expectedLinkClicks, goalExpectedClicks);
  });
  
  // OPTIMIZATION ALGORITHM: Minimize budget while maximizing ROI to achieve goals
  const recommendedSubIds: SubIdRecommendation[] = [];
  
  // Helper functions for optimization
  const getCurrentTotals = (recommendations: SubIdRecommendation[]) => {
    return recommendations.reduce((acc, subId) => ({
      orderSP: acc.orderSP + subId.expectedOrderSP,
      orderLZD: acc.orderLZD + subId.expectedOrderLZD,
      amountLZD: acc.amountLZD + subId.expectedAmountLZD,
      totalCom: acc.totalCom + subId.expectedTotalCom,
      profit: acc.profit + subId.expectedProfit,
      linkClicks: acc.linkClicks + subId.expectedLinkClicks,
      totalBudget: acc.totalBudget + subId.recommendedBudget
    }), {
      orderSP: 0, orderLZD: 0, amountLZD: 0, totalCom: 0, profit: 0, linkClicks: 0, totalBudget: 0
    });
  };
  
  const checkGoalsAchieved = (recommendations: SubIdRecommendation[]) => {
    const totals = getCurrentTotals(recommendations);
    return goals.every(goal => {
      const targetValue = parseFloat(goalValues[goal]) || 0;
      if (targetValue <= 0) return true;
      
      let currentValue = 0;
      switch (goal) {
        case 'orderSP': currentValue = totals.orderSP; break;
        case 'amountLZD': currentValue = totals.amountLZD; break;
        case 'totalCom': currentValue = totals.totalCom; break;
        case 'profit': currentValue = totals.profit; break;
        case 'linkClicks': currentValue = totals.linkClicks; break;
      }
      
      return currentValue >= targetValue;
    });
  };
  
  const getRemainingGoals = (recommendations: SubIdRecommendation[]) => {
    const totals = getCurrentTotals(recommendations);
    const remaining: {[key: string]: number} = {};
    
    goals.forEach(goal => {
      const targetValue = parseFloat(goalValues[goal]) || 0;
      if (targetValue <= 0) return;
      
      let currentValue = 0;
      switch (goal) {
        case 'orderSP': currentValue = totals.orderSP; break;
        case 'amountLZD': currentValue = totals.amountLZD; break;
        case 'totalCom': currentValue = totals.totalCom; break;
        case 'profit': currentValue = totals.profit; break;
        case 'linkClicks': currentValue = totals.linkClicks; break;
      }
      
      remaining[goal] = Math.max(0, targetValue - currentValue);
    });
    
    return remaining;
  };
  
  // Calculate efficiency score for each Sub ID based on optimization strategy
  const calculateEfficiencyScoreWithStrategy = (
    subId: string, 
    performance: any, 
    budget: number, 
    remainingGoals: {[key: string]: number}, 
    strategy: 'goal-first' | 'roi-first' | 'balanced'
  ) => {
    if (performance.adSpend <= 0) return 0;
    
    // Calculate what this budget would contribute
    const orderSPPerBudget = performance.ordersSP / performance.adSpend;
    const orderLZDPerBudget = performance.ordersLZD / performance.adSpend;
    const comSPPerBudget = performance.comSP / performance.adSpend;
    const comLZDPerBudget = performance.comLZD / performance.adSpend;
    const amountLZDPerBudget = performance.amountLZD / performance.adSpend;
    const linkClicksPerBudget = performance.linkClicks / performance.adSpend;
    const profitPerBudget = (performance.commission - performance.adSpend) / performance.adSpend;
    
    // Calculate goal contribution
    let goalContribution = 0;
    let totalWeight = 0;
    
    Object.entries(remainingGoals).forEach(([goal, remaining]) => {
      if (remaining <= 0) return;
      
      let contributionPerBudget = 0;
      switch (goal) {
        case 'orderSP': contributionPerBudget = orderSPPerBudget; break;
        case 'amountLZD': contributionPerBudget = amountLZDPerBudget; break;
        case 'totalCom': contributionPerBudget = comSPPerBudget + comLZDPerBudget; break;
        case 'profit': contributionPerBudget = profitPerBudget; break;
        case 'linkClicks': contributionPerBudget = linkClicksPerBudget; break;
      }
      
      const weight = remaining; // Weight by how much we still need
      goalContribution += contributionPerBudget * weight;
      totalWeight += weight;
    });
    
    const baseGoalEfficiency = totalWeight > 0 ? goalContribution / totalWeight : 0;
    const roiScore = performance.roi / 100; // Normalize ROI
    
    // Apply strategy-specific weighting
    switch (strategy) {
      case 'roi-first':
        // 80% ROI, 20% goal contribution
        return (0.8 * roiScore) + (0.2 * baseGoalEfficiency);
      
      case 'balanced':
        // 60% ROI, 40% goal contribution
        return (0.6 * roiScore) + (0.4 * baseGoalEfficiency);
      
      case 'goal-first':
      default:
        // 20% ROI, 80% goal contribution (current behavior)
        return (0.2 * roiScore) + (0.8 * baseGoalEfficiency);
    }
  };
  
  // OPTIMIZATION LOOP: Two-phase approach
  // Phase 1: Use selected Sub IDs to their maximum capacity
  // Phase 2: Create NEW entries if goals not achieved
  const subIdBudgets = new Map<string, number>(); // Track current budget per Sub ID
  const newEntryCounters = new Map<string, number>(); // Track NEW entries per Sub ID
  const maxIterations = 200;
  let iteration = 0;
  let phase = 1; // Start with phase 1 (original Sub IDs only)
  
  while (iteration < maxIterations && !checkGoalsAchieved(recommendedSubIds)) {
    console.log(`Optimization iteration ${iteration}, phase ${phase}`);
    const remainingGoals = getRemainingGoals(recommendedSubIds);
    
    // If no remaining goals, we're done
    if (Object.values(remainingGoals).every(val => val <= 0)) break;
    
    // Find the most efficient Sub ID to allocate budget to
    let bestSubId = '';
    let bestPerformance: any = null;
    let bestEfficiency = 0;
    let bestBudgetIncrement = 0;
    let isNewEntry = false;
    let foundOriginalSubId = false;
    
    // Check all available Sub IDs
    sortedSubIds.forEach(([subId, performance]) => {
      const currentBudget = subIdBudgets.get(subId) || 0;
      const maxBudget = maxBudgetPerSubId > 0 ? maxBudgetPerSubId : 50000; // Default max if not set
      
      // Calculate budget increment based on maxBudgetPerSubId or default increment
      const baseIncrement = maxBudgetPerSubId > 0 ? maxBudgetPerSubId : 1000;
      let budgetIncrement = Math.min(baseIncrement, maxBudget - currentBudget);
      
      // Phase 1: Only use original Sub IDs (no NEW entries)
      if (phase === 1) {
        if (budgetIncrement <= 0) {
          return; // Skip this Sub ID, don't create NEW entries yet
        }
        foundOriginalSubId = true;
      } else {
        // Phase 2: Allow NEW entries
        if (budgetIncrement <= 0) {
          // This Sub ID is at max, consider NEW entry
          const newCount = newEntryCounters.get(subId) || 0;
          if (newCount < 20) { // Increase max NEW entries to 20 per Sub ID
            // For NEW entries, use same budget limit as original Sub IDs
            const newEntryMaxBudget = maxBudgetPerSubId > 0 ? maxBudgetPerSubId : 50000; // Same limit for NEW entries
            budgetIncrement = calculateOptimalNewEntryBudget(
              subId, 
              performance, 
              remainingGoals, 
              newEntryMaxBudget
            );
            isNewEntry = true;
          } else {
            return; // Skip this Sub ID
          }
        }
      }
      
      if (budgetIncrement < 50) return; // Reduce minimum increment to allow smaller budgets
      
      // Calculate efficiency for this increment based on optimization strategy
      const efficiency = calculateEfficiencyScoreWithStrategy(subId, performance, budgetIncrement, remainingGoals, optimizationStrategy);
      
      if (efficiency > bestEfficiency) {
        bestSubId = subId;
        bestPerformance = performance;
        bestEfficiency = efficiency;
        bestBudgetIncrement = budgetIncrement;
      }
    });
    
    // If Phase 1 and no original Sub IDs can be expanded, move to Phase 2
    if (phase === 1 && !foundOriginalSubId) {
      console.log('Phase 1 complete - all selected Sub IDs at maximum. Starting Phase 2 (NEW entries)');
      phase = 2;
      continue; // Restart loop with Phase 2
    }
    
    // If no efficient Sub ID found, break
    if (!bestSubId || bestBudgetIncrement <= 0) {
      console.log(`No efficient Sub ID found in iteration ${iteration}, phase ${phase}. Breaking optimization loop.`);
      console.log('Current goals status:', getRemainingGoals(recommendedSubIds));
      break;
    }
    
    // Allocate budget to the best Sub ID
    if (isNewEntry) {
      // Create NEW entry
      const newCount = (newEntryCounters.get(bestSubId) || 0) + 1;
      const newEntry = createSubIdRecommendation(bestSubId, bestPerformance, bestBudgetIncrement, newCount);
      recommendedSubIds.push(newEntry);
      newEntryCounters.set(bestSubId, newCount);
    } else {
      // Add to existing Sub ID or create new entry
      const currentBudget = subIdBudgets.get(bestSubId) || 0;
      const newBudget = currentBudget + bestBudgetIncrement;
      
      // Remove existing entry if it exists
      const existingIndex = recommendedSubIds.findIndex(r => r.id === bestSubId);
      if (existingIndex >= 0) {
        recommendedSubIds.splice(existingIndex, 1);
      }
      
      // Add new entry with updated budget
      const newEntry = createSubIdRecommendation(bestSubId, bestPerformance, newBudget, 0);
      recommendedSubIds.push(newEntry);
      subIdBudgets.set(bestSubId, newBudget);
    }
    
    iteration++;
  }
  
  // Helper function to create Sub ID recommendation
  function createSubIdRecommendation(subId: string, performance: any, budget: number, newCount: number): SubIdRecommendation {
    const displayId = newCount > 0 ? 
      (newCount === 1 ? `NEW for ${subId}` : `NEW for ${subId} (${newCount})`) : 
      subId;
    
    if (performance.adSpend > 0) {
      // Calculate performance ratios from historical data
      const historicalOrderSPPerBudget = performance.ordersSP / performance.adSpend;
      const historicalOrderLZDPerBudget = performance.ordersLZD / performance.adSpend;
      const historicalComSPPerBudget = performance.comSP / performance.adSpend;
      const historicalComLZDPerBudget = performance.comLZD / performance.adSpend;
      const historicalAmountLZDPerBudget = performance.amountLZD / performance.adSpend;
      const historicalLinkClicksPerBudget = performance.linkClicks / performance.adSpend;
      
      // Apply these ratios to the allocated budget
      const expectedOrderSP = Math.round(budget * historicalOrderSPPerBudget);
      const expectedOrderLZD = Math.round(budget * historicalOrderLZDPerBudget);
      const expectedComSP = budget * historicalComSPPerBudget;
      const expectedComLZD = budget * historicalComLZDPerBudget;
      const expectedAmountLZD = budget * historicalAmountLZDPerBudget;
      const expectedLinkClicks = Math.round(budget * historicalLinkClicksPerBudget);
      const expectedTotalCom = expectedComSP + expectedComLZD;
      const expectedProfit = expectedTotalCom - budget;
      const expectedROI = budget > 0 ? (expectedProfit / budget) * 100 : 0;
      
      return {
        id: displayId,
        platform: performance.platform,
        recommendedBudget: budget,
        expectedROI: expectedROI,
        historicalROI: performance.roi,
        confidence: Math.min(95, 60 + (performance.orders * 5) - (newCount * 5)),
        expectedOrderSP: expectedOrderSP,
        expectedOrderLZD: expectedOrderLZD,
        expectedAmountLZD: expectedAmountLZD,
        expectedTotalCom: expectedTotalCom,
        expectedComSP: expectedComSP,
        expectedComLZD: expectedComLZD,
        expectedProfit: expectedProfit,
        expectedLinkClicks: expectedLinkClicks
      };
    } else {
      // Fallback for Sub IDs without historical ad spend data
      const avgPerformance = {
        orderSPPerBudget: 0.01, // 1 order per 100 baht
        orderLZDPerBudget: 0.008, // 0.8 order per 100 baht
        comSPPerBudget: 0.15, // 15% commission rate
        comLZDPerBudget: 0.12, // 12% commission rate
        linkClicksPerBudget: 0.2, // 20 clicks per 100 baht
      };
      
      const expectedOrderSP = Math.round(budget * avgPerformance.orderSPPerBudget);
      const expectedOrderLZD = Math.round(budget * avgPerformance.orderLZDPerBudget);
      const expectedComSP = budget * avgPerformance.comSPPerBudget;
      const expectedComLZD = budget * avgPerformance.comLZDPerBudget;
      const expectedLinkClicks = Math.round(budget * avgPerformance.linkClicksPerBudget);
      const expectedTotalCom = expectedComSP + expectedComLZD;
      const expectedProfit = expectedTotalCom - budget;
      const expectedROI = budget > 0 ? (expectedProfit / budget) * 100 : 0;
      
      return {
        id: displayId,
        platform: performance.platform,
        recommendedBudget: budget,
        expectedROI: expectedROI,
        historicalROI: performance.roi,
        confidence: 50 - (newCount * 5), // Lower confidence for estimated data and NEW entries
        expectedOrderSP: expectedOrderSP,
        expectedOrderLZD: expectedOrderLZD,
        expectedAmountLZD: expectedComLZD * 8, // Assume 8x multiplier for amount
        expectedTotalCom: expectedTotalCom,
        expectedComSP: expectedComSP,
        expectedComLZD: expectedComLZD,
        expectedProfit: expectedProfit,
        expectedLinkClicks: expectedLinkClicks
      };
    }
  }

  
  // Calculate final metrics from actual recommendedSubIds data
  const totalAdSpend = recommendedSubIds.reduce((sum, subId) => sum + subId.recommendedBudget, 0);
  const totalExpectedCommission = recommendedSubIds.reduce((sum, subId) => sum + subId.expectedTotalCom, 0);
  const totalExpectedOrderSP = recommendedSubIds.reduce((sum, subId) => sum + subId.expectedOrderSP, 0);
  const totalExpectedOrderLZD = recommendedSubIds.reduce((sum, subId) => sum + subId.expectedOrderLZD, 0);
  const totalExpectedAmountLZD = recommendedSubIds.reduce((sum, subId) => sum + subId.expectedAmountLZD, 0);
  const totalExpectedLinkClicks = recommendedSubIds.reduce((sum, subId) => sum + subId.expectedLinkClicks, 0);
  const totalExpectedProfit = recommendedSubIds.reduce((sum, subId) => sum + subId.expectedProfit, 0);
  const finalROI = totalAdSpend > 0 ? (totalExpectedProfit / totalAdSpend) * 100 : 0;
  
  // Update goalResults with actual optimized values
  goals.forEach(goal => {
    if (goalResults[goal]) {
      const targetValue = parseFloat(goalValues[goal]) || 0;
      let actualExpectedValue = 0;
      
      switch (goal) {
        case 'orderSP': 
          actualExpectedValue = totalExpectedOrderSP; 
          break;
        case 'amountLZD': 
          actualExpectedValue = totalExpectedAmountLZD; 
          break;
        case 'totalCom': 
          actualExpectedValue = totalExpectedCommission; 
          break;
        case 'profit': 
          actualExpectedValue = totalExpectedProfit; 
          break;
        case 'linkClicks': 
          actualExpectedValue = totalExpectedLinkClicks; 
          break;
      }
      
      // Update with actual optimized values
      goalResults[goal] = {
        targetValue,
        expectedValue: actualExpectedValue,
        budgetAllocated: totalAdSpend,
        achievable: actualExpectedValue >= targetValue * 0.95 // 95% threshold for achievable
      };
    }
  });
  
  return {
    recommendedSubIds,
    totalAdSpend: Math.round(totalAdSpend),
    expectedCommission: Math.round(totalExpectedCommission),
    expectedRevenue: Math.round(totalExpectedAmountLZD),
    netProfit: Math.round(totalExpectedProfit),
    expectedROI: Math.round(finalROI * 10) / 10,
    expectedOrders: totalExpectedOrderSP + totalExpectedOrderLZD,
    goalResults
  };
}
