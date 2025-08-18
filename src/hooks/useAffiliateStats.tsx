
import { useState, useEffect } from "react";
import { 
  affiliateStats, 
  platformPerformanceData, 
  subIdData, 
  campaignData,
  roiTrendData
} from "@/lib/affiliateData";

export function useAffiliateStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(affiliateStats);
  const [platformData, setPlatformData] = useState(platformPerformanceData);
  const [subIdPerformance, setSubIdPerformance] = useState(subIdData);
  const [campaigns, setCampaigns] = useState(campaignData);
  const [roiTrend, setRoiTrend] = useState(roiTrendData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API loading for affiliate data
    const timer = setTimeout(() => {
      setStats(affiliateStats);
      setPlatformData(platformPerformanceData);
      setSubIdPerformance(subIdData);
      setCampaigns(campaignData);
      setRoiTrend(roiTrendData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const refreshData = () => {
    setLoading(true);
    // In a real app, we would refetch data from APIs here
    setTimeout(() => {
      // Simulate data refresh with slight changes
      setStats(prev => ({
        ...prev,
        totalRevenue: prev.totalRevenue + Math.random() * 1000 - 500,
        totalProfit: prev.totalProfit + Math.random() * 500 - 250,
      }));
      setLoading(false);
    }, 1000);
  };

  return {
    loading,
    error,
    stats,
    platformData,
    subIdPerformance,
    campaigns,
    roiTrend,
    refreshData
  };
}
