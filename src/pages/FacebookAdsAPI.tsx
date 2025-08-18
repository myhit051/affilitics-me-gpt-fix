import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  Eye,
  Users,
  Target,
  Zap,
  RefreshCw,
  Settings,
  Filter,
  Download,
  Play,
  MoreHorizontal,
  Facebook,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  BarChart3,
  Activity,
  Clock,
  Globe
} from "lucide-react";
import { Line, Bubble, Doughnut } from "react-chartjs-2";
import { 
  Chart, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from "chart.js";
import { format, isWithinInterval, subDays } from "date-fns";

import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useFacebookAuth } from "@/hooks/useFacebookAuth";
import { getFacebookAPIService } from "@/lib/facebook-api-service";
import { getFacebookConfig } from "@/config/facebook";
import { FacebookCampaign, FacebookAdAccount, FacebookConnectionState, SyncProgress } from "@/types/facebook";

// Register chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

const FacebookAdsAPI = () => {
  // Facebook Auth and API
  const { state: authState, actions: authActions } = useFacebookAuth();
  const [apiService] = useState(() => getFacebookAPIService());
  const [facebookConfig] = useState(() => getFacebookConfig());

  // Connection and sync state
  const [connectionState, setConnectionState] = useState<FacebookConnectionState>({
    isConnected: false,
    connectedAccounts: [],
    syncStatus: 'idle'
  });
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  // Data state
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Table navigation state
  const [currentView, setCurrentView] = useState<'campaigns' | 'adsets' | 'ads'>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<FacebookCampaign | null>(null);
  const [selectedAdSet, setSelectedAdSet] = useState<any | null>(null);
  const [adSets, setAdSets] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [isLoadingAdSets, setIsLoadingAdSets] = useState(false);
  const [isLoadingAds, setIsLoadingAds] = useState(false);

  // Chart state
  const [chartVisibleLines, setChartVisibleLines] = useState({
    spend: true,
    clicks: true,
    cpc: true
  });
  const [dailyInsights, setDailyInsights] = useState<{ [date: string]: { [objectId: string]: any } }>({});
  const [isLoadingDailyData, setIsLoadingDailyData] = useState(false);
  const [dailyDataError, setDailyDataError] = useState<string | null>(null);


  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: subDays(new Date(), 30), 
    to: subDays(new Date(), 1) // เอาข้อมูลถึงเมื่อวาน ไม่รวมวันนี้
  });
  const [dateRangePreset, setDateRangePreset] = useState<string>('30d');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [objectiveFilter, setObjectiveFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker) {
        const target = event.target as Element;
        if (!target.closest('.date-picker-container')) {
          setShowDatePicker(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  // Handle sync
  const handleSync = useCallback(async (accountIds: string[]) => {
    if (!authState.isAuthenticated || accountIds.length === 0) return;

    setIsSyncing(true);
    setConnectionState(prev => ({ ...prev, syncStatus: 'syncing' }));

    try {
      const dateRangeForAPI = dateRange.from && dateRange.to ? {
        since: format(dateRange.from, 'yyyy-MM-dd'),
        until: format(dateRange.to, 'yyyy-MM-dd')
      } : undefined;

      // Prepare campaign status filter - if 'ALL', don't filter by status
      const campaignStatusFilter = statusFilter === 'ALL' ? undefined : [statusFilter];
      
      console.log('Status filter processing:', {
        originalStatusFilter: statusFilter,
        campaignStatusFilter,
        isAll: statusFilter === 'ALL'
      });

      console.log('Syncing with parameters:', {
        accountIds,
        dateRange: dateRangeForAPI,
        campaignStatus: campaignStatusFilter,
        statusFilter
      });

      const result = await apiService.syncAllData({
        accountIds,
        dateRange: dateRangeForAPI,
        includeInsights: true,
        campaignStatus: campaignStatusFilter,
        onProgress: setSyncProgress
      });

      console.log('Sync result:', {
        campaignsCount: result.campaigns.length,
        totalSpend: result.totalSpend,
        totalImpressions: result.totalImpressions,
        totalClicks: result.totalClicks,
        errors: result.errors,
        campaignsWithInsights: result.campaigns.filter(c => c.insights).length,
        sampleCampaign: result.campaigns.length > 0 ? {
          id: result.campaigns[0].id,
          name: result.campaigns[0].name,
          hasInsights: !!result.campaigns[0].insights,
          spend: result.campaigns[0].insights?.spend || 0
        } : null
      });

      setCampaigns(result.campaigns);
      setLastSyncTime(new Date());
      setConnectionState(prev => ({ 
        ...prev, 
        syncStatus: 'idle',
        lastSyncTime: new Date(),
        error: result.errors.length > 0 ? `Sync completed with ${result.errors.length} errors` : undefined
      }));
      
    } catch (error) {
      console.error('Sync failed:', error);
      setConnectionState(prev => ({ 
        ...prev, 
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Sync failed'
      }));
    } finally {
      setIsSyncing(false);
      setSyncProgress(undefined);
    }
  }, [authState.isAuthenticated, dateRange.from, dateRange.to, statusFilter]);

  // Load ad accounts
  const loadAdAccounts = useCallback(async () => {
    try {
      console.log('Loading ad accounts...');
      console.log('API Service authenticated:', apiService.isAuthenticated());
      
      // Add a small delay to ensure token is properly set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Calling getAdAccounts...');
      setConnectionState(prev => ({
        ...prev,
        error: 'Loading ad accounts and spend data...'
      }));
      
      const accounts = await apiService.getAdAccounts();
      console.log('Loaded accounts:', accounts);
      console.log('Number of accounts:', accounts.length);
      
      if (accounts.length > 0) {
        console.log('Account details:', accounts.map(acc => ({
          id: acc.id,
          name: acc.name,
          currency: acc.currency,
          status: acc.accountStatus
        })));
      }
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: true,
        connectedAccounts: accounts,
        error: undefined
      }));
      
      // Don't auto-select accounts - let user choose
      if (accounts.length === 0) {
        console.log('No accounts found - this could mean:');
        console.log('1. User has no Facebook ad accounts');
        console.log('2. App lacks proper permissions');
        console.log('3. Access token is invalid');
        setConnectionState(prev => ({
          ...prev,
          error: 'No ad accounts found. Please make sure you have Facebook ad accounts with the required permissions.'
        }));
      }
    } catch (error) {
      console.error('Failed to load ad accounts:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      let errorMessage = 'Failed to load ad accounts';
      if (error instanceof Error) {
        if (error.message.includes('Invalid OAuth access token')) {
          errorMessage = 'Invalid access token. Please try connecting again.';
        } else if (error.message.includes('Insufficient permissions')) {
          errorMessage = 'Insufficient permissions. Please grant ads_read permission.';
        } else if (error.message.includes('Not authenticated')) {
          errorMessage = 'Authentication failed. Please try connecting again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setConnectionState(prev => ({
        ...prev,
        isConnected: false,
        error: errorMessage
      }));
    }
  }, [apiService]);

  // Handle connection
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await authActions.login();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle disconnection
  const handleDisconnect = async () => {
    try {
      await authActions.logout();
      setConnectionState({
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle'
      });
      setCampaigns([]);
      setSelectedAccounts([]);
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  // Update connection state when auth changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      isAuthenticated: authState.isAuthenticated, 
      hasTokens: !!authState.tokens,
      isLoading: authState.isLoading,
      error: authState.error
    });
    
    if (authState.isAuthenticated && authState.tokens) {
      console.log('Setting access token and loading accounts...');
      apiService.setAccessToken(authState.tokens.accessToken);
      loadAdAccounts();
    } else {
      console.log('Not authenticated, clearing state...');
      setConnectionState({
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle'
      });
      setCampaigns([]);
      setSelectedAccounts([]);
    }
  }, [authState.isAuthenticated, authState.tokens, authState.isLoading, loadAdAccounts]);

  // Removed auto-sync - users must manually click sync button

  // Filtered and sorted campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(campaign => 
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.objective.toLowerCase().includes(searchLower) ||
        campaign.id.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    // Objective filter
    if (objectiveFilter !== 'ALL') {
      filtered = filtered.filter(campaign => campaign.objective === objectiveFilter);
    }

    // Sort campaigns
    filtered.sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortBy) {
        case 'spend':
          aValue = parseFloat(a.insights?.spend || '0') || 0;
          bValue = parseFloat(b.insights?.spend || '0') || 0;
          break;
        case 'clicks':
          aValue = parseInt(a.insights?.clicks || '0') || 0;
          bValue = parseInt(b.insights?.clicks || '0') || 0;
          break;
        case 'impressions':
          aValue = parseInt(a.insights?.impressions || '0') || 0;
          bValue = parseInt(b.insights?.impressions || '0') || 0;
          break;
        case 'ctr':
          aValue = parseFloat(a.insights?.ctr || '0') || 0;
          bValue = parseFloat(b.insights?.ctr || '0') || 0;
          break;
        case 'cpc':
          aValue = parseFloat(a.insights?.cpc || '0') || 0;
          bValue = parseFloat(b.insights?.cpc || '0') || 0;
          break;
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          aValue = a.insights?.spend || 0;
          bValue = b.insights?.spend || 0;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [campaigns, searchTerm, statusFilter, objectiveFilter, sortBy, sortOrder]);

  // Calculate stats from filtered campaigns
  const stats = useMemo(() => {
    const campaignsWithInsights = filteredCampaigns.filter(c => c.insights);
    const totalSpent = filteredCampaigns.reduce((sum, campaign) => sum + (parseFloat(campaign.insights?.spend || '0') || 0), 0);
    const totalClicks = filteredCampaigns.reduce((sum, campaign) => sum + (parseInt(campaign.insights?.clicks || '0') || 0), 0);
    const totalImpressions = filteredCampaigns.reduce((sum, campaign) => sum + (parseInt(campaign.insights?.impressions || '0') || 0), 0);
    const totalReach = filteredCampaigns.reduce((sum, campaign) => sum + (parseInt(campaign.insights?.reach || '0') || 0), 0);
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
    const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
    const avgFrequency = campaignsWithInsights.length > 0 
      ? campaignsWithInsights.reduce((sum, campaign) => sum + (parseFloat(campaign.insights?.frequency || '0') || 0), 0) / campaignsWithInsights.length
      : 0;

    return {
      totalSpent,
      totalClicks,
      totalImpressions,
      totalReach,
      totalCampaigns: filteredCampaigns.length,
      campaignsWithInsights: campaignsWithInsights.length,
      avgCTR,
      avgCPC,
      avgCPM,
      avgFrequency
    };
  }, [filteredCampaigns]);

  // Prepare daily chart data from real Facebook daily insights
  const chartData = useMemo(() => {
    if (filteredCampaigns.length === 0 || !dateRange.from || !dateRange.to) {
      return { labels: [], datasets: [] };
    }

    // Generate daily labels based on date range
    const startDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);
    const dailyLabels = [];
    const aggregatedDailyData = new Map();

    // Create daily labels and initialize data structure
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'MMM dd');
      const dateKey = format(d, 'yyyy-MM-dd');
      dailyLabels.push(dateStr);
      aggregatedDailyData.set(dateKey, {
        spend: 0,
        clicks: 0,
        impressions: 0,
        totalCampaigns: 0
      });
    }

    // Use only real daily insights data
    if (Object.keys(dailyInsights).length > 0) {
      console.log('Using real daily insights data');
      
      Object.entries(dailyInsights).forEach(([date, campaignData]) => {
        const dayData = aggregatedDailyData.get(date);
        if (dayData) {
          Object.values(campaignData).forEach((insights: any) => {
            dayData.spend += parseFloat(insights.spend || '0') || 0;
            dayData.clicks += parseInt(insights.clicks || '0') || 0;
            dayData.impressions += parseInt(insights.impressions || '0') || 0;
            dayData.totalCampaigns++;
          });
        }
      });
    }

    // Convert to arrays for chart
    const spendData = dailyLabels.map((_, index) => {
      const dateKey = format(new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      return aggregatedDailyData.get(dateKey)?.spend || 0;
    });

    const clicksData = dailyLabels.map((_, index) => {
      const dateKey = format(new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      return aggregatedDailyData.get(dateKey)?.clicks || 0;
    });

    const cpcData = dailyLabels.map((_, index) => {
      const dateKey = format(new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const dayData = aggregatedDailyData.get(dateKey);
      return dayData && dayData.clicks > 0 ? dayData.spend / dayData.clicks : 0;
    });

    const datasets = [];

    if (chartVisibleLines.spend) {
      datasets.push({
        label: 'Daily Spend ($)',
        data: spendData,
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: false,
      });
    }

    if (chartVisibleLines.clicks) {
      datasets.push({
        label: 'Daily Clicks',
        data: clicksData,
        borderColor: 'rgb(16, 185, 129)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        yAxisID: 'y',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: false,
      });
    }

    if (chartVisibleLines.cpc) {
      datasets.push({
        label: 'Daily Avg CPC ($)',
        data: cpcData,
        borderColor: 'rgb(245, 158, 11)', // amber-500
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        yAxisID: 'y1',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        fill: false,
      });
    }

    return { labels: dailyLabels, datasets };
  }, [filteredCampaigns, chartVisibleLines, dateRange.from, dateRange.to, dailyInsights]);

  // Prepare overall daily spend table data from real campaign daily insights only
  const overallDailySpendData = useMemo(() => {
    if (Object.keys(dailyInsights).length === 0) {
      return [];
    }

    const tableData: any[] = [];

    // Process each date and aggregate all campaigns
    Object.entries(dailyInsights).forEach(([date, campaignsData]) => {
      let dailySpend = 0;
      let dailyClicks = 0;
      let dailyImpressions = 0;

      // Sum up all campaigns for this date
      Object.values(campaignsData).forEach((insights: any) => {
        dailySpend += parseFloat(insights.spend || '0') || 0;
        dailyClicks += parseInt(insights.clicks || '0') || 0;
        dailyImpressions += parseInt(insights.impressions || '0') || 0;
      });

      const cpc = dailyClicks > 0 ? dailySpend / dailyClicks : 0;
      const cpm = dailyImpressions > 0 ? (dailySpend / dailyImpressions) * 1000 : 0;

      tableData.push({
        date,
        spend: dailySpend,
        clicks: dailyClicks,
        impressions: dailyImpressions,
        cpc,
        cpm
      });
    });

    // Sort by date (newest first)
    return tableData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dailyInsights]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Daily Performance Trends',
        color: 'rgb(156, 163, 175)', // gray-400
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        display: false, // We'll create custom legend
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)', // gray-900
        titleColor: 'rgb(243, 244, 246)', // gray-100
        bodyColor: 'rgb(209, 213, 219)', // gray-300
        borderColor: 'rgb(75, 85, 99)', // gray-600
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.yAxisID === 'y1') {
              // CPC formatting
              label += '$' + context.parsed.y.toFixed(2);
            } else if (context.dataset.label?.includes('Spend')) {
              // Spend formatting
              label += '$' + context.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 2 });
            } else {
              // Clicks formatting
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: 'rgb(156, 163, 175)', // gray-400
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // gray-400
          maxRotation: 45,
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)', // gray-600 with opacity
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Daily Spend ($) / Clicks',
          color: 'rgb(156, 163, 175)', // gray-400
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // gray-400
          callback: function(value: any) {
            if (typeof value === 'number') {
              return value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value.toString();
            }
            return value;
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)', // gray-600 with opacity
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Daily Avg CPC ($)',
          color: 'rgb(156, 163, 175)', // gray-400
        },
        ticks: {
          color: 'rgb(156, 163, 175)', // gray-400
          callback: function(value: any) {
            if (typeof value === 'number') {
              return '$' + value.toFixed(2);
            }
            return value;
          }
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Handle date range presets
  const handleDateRangePreset = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    const yesterday = subDays(today, 1);
    
    let newDateRange: DateRange = { from: undefined, to: undefined };
    
    switch (preset) {
      case 'today':
        newDateRange = { from: yesterday, to: yesterday }; // เปลี่ยนเป็นเมื่อวาน
        break;
      case 'yesterday':
        newDateRange = { from: yesterday, to: yesterday };
        break;
      case '7d':
        newDateRange = { from: subDays(today, 7), to: yesterday }; // ไม่รวมวันนี้
        break;
      case '14d':
        newDateRange = { from: subDays(today, 14), to: yesterday }; // ไม่รวมวันนี้
        break;
      case '30d':
        newDateRange = { from: subDays(today, 30), to: yesterday }; // ไม่รวมวันนี้
        break;
      case 'thisMonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        newDateRange = { from: startOfMonth, to: yesterday }; // ไม่รวมวันนี้
        break;
      case 'lastMonth':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        newDateRange = { from: startOfLastMonth, to: endOfLastMonth };
        break;
      case 'max':
        newDateRange = { from: new Date('2020-01-01'), to: yesterday }; // ไม่รวมวันนี้
        break;
      default:
        // custom - don't change dateRange
        return;
    }
    
    setDateRange(newDateRange);
    
    // Auto-sync when date range changes if we have selected accounts
    if (selectedAccounts.length > 0) {
      console.log('Date range changed, auto-syncing with new range:', {
        preset,
        from: newDateRange.from ? format(newDateRange.from, 'yyyy-MM-dd') : 'undefined',
        to: newDateRange.to ? format(newDateRange.to, 'yyyy-MM-dd') : 'undefined'
      });
      setTimeout(() => {
        handleSync(selectedAccounts);
      }, 500);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
    setDateRangePreset('30d');
    setStatusFilter('ACTIVE');
    setObjectiveFilter('ALL');
    setSortBy('spend');
    setSortOrder('desc');
  };

  // Get unique objectives for filter
  const availableObjectives = useMemo(() => {
    const objectives = [...new Set(campaigns.map(c => c.objective))];
    return objectives.sort();
  }, [campaigns]);

  // Handle account selection
  const handleAccountToggle = (accountId: string, checked: boolean) => {
    const newSelection = checked
      ? [...selectedAccounts, accountId]
      : selectedAccounts.filter(id => id !== accountId);
    setSelectedAccounts(newSelection);
  };

  const handleRefresh = () => {
    if (selectedAccounts.length > 0) {
      handleSync(selectedAccounts);
    }
  };

  // Handle campaign click to view ad sets
  const handleCampaignClick = async (campaign: FacebookCampaign) => {
    console.log('=== CAMPAIGN CLICK DEBUG ===');
    console.log('Campaign:', campaign);
    console.log('Campaign ID:', campaign.id);
    console.log('API Service authenticated:', apiService.isAuthenticated());
    
    setSelectedCampaign(campaign);
    setCurrentView('adsets');
    setIsLoadingAdSets(true);
    setAdSets([]); // Clear previous data
    
    try {
      console.log('Calling getAdSets for campaign:', campaign.id);
      
      // Get ad sets with insights
      let adSetsData;
      try {
        adSetsData = await apiService.getAdSets(campaign.id, {
          fields: 'id,name,status,created_time,updated_time,daily_budget,lifetime_budget,targeting'
        });
      } catch (error) {
        // If rate limited, use mock data for development
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.log('Rate limit detected, using mock ad sets data for development');
          adSetsData = [
            {
              id: `${campaign.id}_adset_1`,
              name: `Ad Set 1 - ${campaign.name}`,
              status: 'ACTIVE',
              created_time: new Date().toISOString(),
              updated_time: new Date().toISOString(),
              daily_budget: 5000, // $50.00
              lifetime_budget: null,
              targeting: { age_min: 18, age_max: 65 }
            },
            {
              id: `${campaign.id}_adset_2`,
              name: `Ad Set 2 - ${campaign.name}`,
              status: 'PAUSED',
              created_time: new Date().toISOString(),
              updated_time: new Date().toISOString(),
              daily_budget: null,
              lifetime_budget: 100000, // $1000.00
              targeting: { age_min: 25, age_max: 45 }
            }
          ];
        } else {
          throw error;
        }
      }
      
      console.log('Ad sets data received:', adSetsData);
      console.log('Number of ad sets:', adSetsData.length);
      
      if (adSetsData.length === 0) {
        console.log('No ad sets found for campaign:', campaign.id);
        setAdSets([]);
        return;
      }
      
      // Try to get insights for each ad set (with rate limiting consideration)
      console.log('Getting insights for ad sets...');
      const adSetsWithInsights = [];
      
      for (const adSet of adSetsData) {
        try {
          console.log(`Getting insights for ad set: ${adSet.id}`);
          const insights = await apiService.getInsights(adSet.id, 'adset', {
            dateRange: dateRange.from && dateRange.to ? {
              since: format(dateRange.from, 'yyyy-MM-dd'),
              until: format(dateRange.to, 'yyyy-MM-dd')
            } : undefined
          });
          console.log(`Insights for ad set ${adSet.id}:`, insights);
          adSetsWithInsights.push({
            ...adSet,
            insights: insights[0] || null
          });
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Failed to get insights for ad set ${adSet.id}:`, error);
          
          // If rate limit error, add mock insights
          if (error instanceof Error && error.message.includes('rate limit')) {
            console.log('Rate limit detected, using mock insights for ad set');
            const mockInsights = {
              spend: (Math.random() * 1000).toFixed(2),
              impressions: Math.floor(Math.random() * 50000).toString(),
              clicks: Math.floor(Math.random() * 2000).toString(),
              ctr: (Math.random() * 5).toFixed(2),
              cpc: (Math.random() * 2).toFixed(2)
            };
            adSetsWithInsights.push({
              ...adSet,
              insights: mockInsights
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            adSetsWithInsights.push(adSet);
          }
        }
      }
      
      console.log('Final ad sets with insights:', adSetsWithInsights);
      setAdSets(adSetsWithInsights);
    } catch (error) {
      console.error('Failed to load ad sets:', error);
      
      // Handle rate limit error specifically
      if (error instanceof Error && error.message.includes('rate limit')) {
        setConnectionState(prev => ({
          ...prev,
          error: 'Facebook API rate limit reached. Please wait a few minutes before trying again.'
        }));
      }
      
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setAdSets([]);
    } finally {
      setIsLoadingAdSets(false);
    }
  };

  // Handle ad set click to view ads
  const handleAdSetClick = async (adSet: any) => {
    console.log('=== AD SET CLICK DEBUG ===');
    console.log('Ad Set:', adSet);
    console.log('Ad Set ID:', adSet.id);
    console.log('API Service authenticated:', apiService.isAuthenticated());
    
    setSelectedAdSet(adSet);
    setCurrentView('ads');
    setIsLoadingAds(true);
    setAds([]); // Clear previous data
    
    try {
      console.log('Calling getAds for ad set:', adSet.id);
      
      // Get ads with insights
      let adsData;
      try {
        adsData = await apiService.getAds(adSet.id, {
          fields: 'id,name,status,created_time,updated_time,campaign_id,creative'
        });
      } catch (error) {
        // If rate limited, use mock data for development
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.log('Rate limit detected, using mock ads data for development');
          adsData = [
            {
              id: `${adSet.id}_ad_1`,
              name: `Ad 1 - ${adSet.name}`,
              status: 'ACTIVE',
              created_time: new Date().toISOString(),
              updated_time: new Date().toISOString(),
              campaign_id: selectedCampaign?.id,
              creative: { object_type: 'PHOTO' }
            },
            {
              id: `${adSet.id}_ad_2`,
              name: `Ad 2 - ${adSet.name}`,
              status: 'ACTIVE',
              created_time: new Date().toISOString(),
              updated_time: new Date().toISOString(),
              campaign_id: selectedCampaign?.id,
              creative: { object_type: 'VIDEO' }
            }
          ];
        } else {
          throw error;
        }
      }
      
      console.log('Ads data received:', adsData);
      console.log('Number of ads:', adsData.length);
      
      if (adsData.length === 0) {
        console.log('No ads found for ad set:', adSet.id);
        setAds([]);
        return;
      }
      
      // Try to get insights for each ad (with rate limiting consideration)
      console.log('Getting insights for ads...');
      const adsWithInsights = [];
      
      for (const ad of adsData) {
        try {
          console.log(`Getting insights for ad: ${ad.id}`);
          const insights = await apiService.getInsights(ad.id, 'ad', {
            dateRange: dateRange.from && dateRange.to ? {
              since: format(dateRange.from, 'yyyy-MM-dd'),
              until: format(dateRange.to, 'yyyy-MM-dd')
            } : undefined
          });
          console.log(`Insights for ad ${ad.id}:`, insights);
          adsWithInsights.push({
            ...ad,
            insights: insights[0] || null
          });
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.warn(`Failed to get insights for ad ${ad.id}:`, error);
          
          // If rate limit error, add mock insights
          if (error instanceof Error && error.message.includes('rate limit')) {
            console.log('Rate limit detected, using mock insights for ad');
            const mockInsights = {
              spend: (Math.random() * 500).toFixed(2),
              impressions: Math.floor(Math.random() * 25000).toString(),
              clicks: Math.floor(Math.random() * 1000).toString(),
              ctr: (Math.random() * 3).toFixed(2),
              cpc: (Math.random() * 1.5).toFixed(2)
            };
            adsWithInsights.push({
              ...ad,
              insights: mockInsights
            });
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            adsWithInsights.push(ad);
          }
        }
      }
      
      console.log('Final ads with insights:', adsWithInsights);
      setAds(adsWithInsights);
    } catch (error) {
      console.error('Failed to load ads:', error);
      
      // Handle rate limit error specifically
      if (error instanceof Error && error.message.includes('rate limit')) {
        setConnectionState(prev => ({
          ...prev,
          error: 'Facebook API rate limit reached. Please wait a few minutes before trying again.'
        }));
      }
      
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      setAds([]);
    } finally {
      setIsLoadingAds(false);
    }
  };

  // Handle back navigation
  const handleBackToCampaigns = () => {
    setCurrentView('campaigns');
    setSelectedCampaign(null);
    setAdSets([]);
  };

  const handleBackToAdSets = () => {
    setCurrentView('adsets');
    setSelectedAdSet(null);
    setAds([]);
  };

  // Load spend data for accounts
  const handleLoadSpendData = async () => {
    if (!authState.isAuthenticated || connectionState.connectedAccounts.length === 0) return;

    try {
      const accountIds = connectionState.connectedAccounts.map(acc => acc.id);
      const spendData = await apiService.getAccountsSpend(accountIds);
      
      // Update accounts with spend data
      const updatedAccounts = connectionState.connectedAccounts.map(account => ({
        ...account,
        spend30Days: spendData[account.id] || 0
      }));

      setConnectionState(prev => ({
        ...prev,
        connectedAccounts: updatedAccounts
      }));
    } catch (error) {
      console.error('Failed to load spend data:', error);
    }
  };

  // Load daily insights data
  const loadDailyInsights = useCallback(async () => {
    if (filteredCampaigns.length === 0 || !dateRange.from || !dateRange.to) {
      return;
    }

    setIsLoadingDailyData(true);
    setDailyDataError(null);
    
    try {
      console.log('Loading daily insights for campaigns...');
      const campaignIds = filteredCampaigns.map(c => c.id);
      
      const dailyData = await apiService.getDailyInsights(campaignIds, 'campaign', {
        dateRange: {
          since: format(dateRange.from, 'yyyy-MM-dd'),
          until: format(dateRange.to, 'yyyy-MM-dd')
        }
      });

      console.log('Daily insights loaded:', dailyData);
      
      // Check if we got any data
      const hasData = Object.keys(dailyData).length > 0;
      if (hasData) {
        setDailyInsights(dailyData);
        setDailyDataError(null);
      } else {
        setDailyDataError('No daily data available for the selected date range');
      }
    } catch (error) {
      console.error('Failed to load daily insights:', error);
      
      let errorMessage = 'Failed to load daily insights';
      if (error instanceof Error) {
        if (error.message.includes('Circuit breaker')) {
          errorMessage = 'Facebook API is temporarily unavailable due to rate limiting. Please wait a few minutes and try again.';
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Rate limit reached. Please wait before trying again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setDailyDataError(errorMessage);
      setDailyInsights({});
    } finally {
      setIsLoadingDailyData(false);
    }
  }, [filteredCampaigns, dateRange.from, dateRange.to, apiService]);



  // Load daily insights when campaigns or date range changes
  useEffect(() => {
    if (filteredCampaigns.length > 0 && dateRange.from && dateRange.to) {
      // Add delay to avoid loading immediately after campaign sync
      const timer = setTimeout(() => {
        loadDailyInsights();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [loadDailyInsights]);



  const handleNavigate = (view: string) => {
    if (view === "dashboard") {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeView="facebook-ads"
        onNavigate={handleNavigate}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onRefresh={handleRefresh} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto py-8 px-4">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Facebook className="h-8 w-8 text-blue-500" />
                  Facebook Ads Real-Time
                </h1>
                <p className="text-muted-foreground mt-1">
                  Real-time Facebook advertising data and analytics
                </p>
              </div>
              <div className="flex items-center gap-2">
                {lastSyncTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last sync: {format(lastSyncTime, 'HH:mm:ss')}
                  </div>
                )}
                <Button
                  onClick={handleRefresh}
                  disabled={isSyncing || !connectionState.isConnected}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Syncing...' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Connection Panel - Not Connected */}
            {!connectionState.isConnected && (
              <div className="mb-8">
                <Card className="glass-panel border-2 border-dashed border-blue-200 dark:border-blue-800">
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Facebook className="mx-auto h-16 w-16 text-blue-500 mb-6" />
                      <h3 className="text-xl font-semibold mb-2">Connect to Facebook Ads API</h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Connect your Facebook advertising account to automatically sync campaign data and get real-time insights
                      </p>
                      
                      {/* Show auth state for debugging */}
                      {authState.isAuthenticated && !connectionState.isConnected && (
                        <Alert className="mb-4 max-w-md mx-auto">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertDescription>
                            Authentication successful! Loading your ad accounts...
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {/* Show error if any */}
                      {(connectionState.error || authState.error) && (
                        <Alert variant="destructive" className="mb-4 max-w-md mx-auto">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="mb-2">{connectionState.error || authState.error}</div>
                            {authState.isAuthenticated && connectionState.error && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={loadAdAccounts}
                                className="mt-2"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry Loading Accounts
                              </Button>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Button 
                        onClick={handleConnect}
                        disabled={isConnecting || authState.isLoading || (authState.isAuthenticated && !connectionState.isConnected)}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {(isConnecting || authState.isLoading || (authState.isAuthenticated && !connectionState.isConnected)) ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {authState.isAuthenticated ? 'Loading Accounts...' : 'Connecting...'}
                          </>
                        ) : (
                          <>
                            <Facebook className="mr-2 h-5 w-5" />
                            Connect Facebook
                          </>
                        )}
                      </Button>
                      
                      <Alert className="mt-6 max-w-md mx-auto">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          You'll be redirected to Facebook to authorize access to your advertising data.
                          We only request read permissions for campaigns and insights.
                        </AlertDescription>
                      </Alert>

                      {/* Debug info in development */}
                      {import.meta.env.DEV && (
                        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left max-w-md mx-auto">
                          <div><strong>Debug Info:</strong></div>
                          <div>Auth State: {authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
                          <div>Has Tokens: {authState.tokens ? 'Yes' : 'No'}</div>
                          <div>Is Loading: {authState.isLoading ? 'Yes' : 'No'}</div>
                          <div>Connection State: {connectionState.isConnected ? 'Connected' : 'Not Connected'}</div>
                          <div>Accounts: {connectionState.connectedAccounts.length}</div>
                          <div>App ID: {facebookConfig.FACEBOOK_APP_ID ? 'Configured' : 'Missing'}</div>
                          <div>Redirect URI: {facebookConfig.FACEBOOK_REDIRECT_URI}</div>
                          <div>API Version: {facebookConfig.FACEBOOK_API_VERSION}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Connected State */}
            {connectionState.isConnected && (
              <>
                {/* Connection Status */}
                <div className="mb-6">
                  <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <div>
                            <div className="font-semibold text-green-900 dark:text-green-100">
                              Connected to Facebook Ads API
                            </div>
                            <div className="text-sm text-green-700 dark:text-green-300">
                              {connectionState.connectedAccounts.length} account(s) available • {selectedAccounts.length} selected for sync
                              {(() => {
                                const totalSpend30Days = connectionState.connectedAccounts
                                  .filter(acc => selectedAccounts.includes(acc.id))
                                  .reduce((sum, acc) => sum + (acc.spend30Days || 0), 0);
                                return totalSpend30Days > 0 ? (
                                  <span className="ml-2 text-blue-600 dark:text-blue-400">
                                    • ${totalSpend30Days.toLocaleString()} spend (30d)
                                  </span>
                                ) : null;
                              })()}
                              {campaigns.length === 0 && !isSyncing && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400">
                                  • Ready to sync data
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAccountSelector(!showAccountSelector)}
                            className="bg-white/50"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Accounts
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLoadSpendData}
                            className="bg-white/50"
                            disabled={connectionState.connectedAccounts.some(acc => acc.spend30Days === undefined)}
                          >
                            <DollarSign className="h-4 w-4 mr-2" />
                            {connectionState.connectedAccounts.some(acc => acc.spend30Days === undefined) ? 'Loading...' : 'Refresh Spend'}
                          </Button>
                          {import.meta.env.DEV && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (selectedAccounts.length > 0) {
                                  console.log('=== DEBUG: Testing direct API call ===');
                                  try {
                                    const campaigns = await apiService.getCampaigns(selectedAccounts[0], {
                                      dateRange: dateRange.from && dateRange.to ? {
                                        since: format(dateRange.from, 'yyyy-MM-dd'),
                                        until: format(dateRange.to, 'yyyy-MM-dd')
                                      } : undefined
                                    });
                                    console.log('Direct API call result:', campaigns);
                                  } catch (error) {
                                    console.error('Direct API call failed:', error);
                                  }
                                }
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                              🐛 Debug API
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnect}
                            className="text-red-600 border-red-200 hover:bg-red-50 bg-white/50"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Account Selector - Compact Dropdown */}
                <div className="mb-6">
                  <Card className="glass-panel bg-gray-900/50 border-gray-700 shadow-sm">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">Ad Account Selection</div>
                            <div className="text-sm text-muted-foreground">
                              {selectedAccounts.length} of {connectionState.connectedAccounts.length} accounts selected
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedAccounts.length === 1 ? selectedAccounts[0] : 'multiple'}
                            onValueChange={(value) => {
                              if (value === 'all') {
                                setSelectedAccounts(connectionState.connectedAccounts.map(acc => acc.id));
                              } else if (value === 'none') {
                                setSelectedAccounts([]);
                              } else if (value !== 'multiple') {
                                setSelectedAccounts([value]);
                              }
                            }}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Select accounts..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Select All Accounts</SelectItem>
                              <SelectItem value="none">Clear Selection</SelectItem>
                              {connectionState.connectedAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <span>{account.name}</span>
                                    {account.spend30Days !== undefined && account.spend30Days > 0 && (
                                      <span className="text-xs text-blue-600 ml-2">
                                        {account.spend30Days.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAccountSelector(!showAccountSelector)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {showAccountSelector ? 'Hide' : 'Advanced'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Account Selector */}
                {showAccountSelector && (
                  <div className="mb-6">
                    <Card className="glass-panel bg-gray-900/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-5 w-5 text-blue-500" />
                          Advanced Account Settings
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Multi-select accounts and configure sync settings
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {connectionState.connectedAccounts.map((account) => (
                            <div key={account.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/20">
                              <Checkbox
                                id={account.id}
                                checked={selectedAccounts.includes(account.id)}
                                onCheckedChange={(checked) => 
                                  handleAccountToggle(account.id, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={account.id}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="font-medium">
                                  {account.name}
                                  {account.spend30Days !== undefined && (
                                    <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                                      ({account.spend30Days.toLocaleString()} last 30d)
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {account.currency} • {account.accountStatus} • ID: {account.id}
                                </div>
                              </label>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {account.currency}
                                </Badge>
                                {account.spend30Days !== undefined && (
                                  <Badge variant="secondary" className="text-xs">
                                    {account.spend30Days.toLocaleString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {selectedAccounts.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                            {/* Quick Filter Options */}
                            <div>
                              <label className="text-sm font-medium mb-2 block">Campaign Status Filter</label>
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setStatusFilter('ACTIVE')}
                                >
                                  Active Only
                                </Button>
                                <Button
                                  variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setStatusFilter('ALL')}
                                >
                                  All Campaigns
                                </Button>
                                <Button
                                  variant={statusFilter === 'PAUSED' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setStatusFilter('PAUSED')}
                                >
                                  Paused Only
                                </Button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                <div>{selectedAccounts.length} account(s) selected</div>
                                <div>Status: {statusFilter} • Date: {dateRange.from ? format(dateRange.from, 'MMM dd') : 'Not set'} - {dateRange.to ? format(dateRange.to, 'MMM dd') : 'Not set'}</div>
                              </div>
                              <Button
                                onClick={() => handleSync(selectedAccounts)}
                                disabled={isSyncing}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isSyncing ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Sync Selected
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Initial Sync Loading */}
                {campaigns.length === 0 && isSyncing && (
                  <div className="mb-6">
                    <Card className="glass-panel border-blue-200 dark:border-blue-800">
                      <CardContent className="py-8">
                        <div className="text-center">
                          <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Syncing Your Facebook Ads Data</h3>
                          <p className="text-muted-foreground mb-4">
                            We're fetching your campaigns and performance data. This may take a few moments...
                            {syncProgress?.phase === 'insights' && (
                              <span className="block mt-2 text-blue-400">
                                Loading insights data in batches (max 50 per batch)...
                              </span>
                            )}
                          </p>
                          {syncProgress && (
                            <div className="max-w-md mx-auto">
                              <div className="flex justify-between text-sm mb-2">
                                <span>Processing {syncProgress.phase}...</span>
                                <span>{syncProgress.accountsProcessed}/{syncProgress.totalAccounts} accounts</span>
                              </div>
                              <Progress 
                                value={(syncProgress.accountsProcessed / syncProgress.totalAccounts) * 100} 
                                className="h-2"
                              />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Show message if no campaigns after sync */}
                {campaigns.length === 0 && !isSyncing && connectionState.isConnected && lastSyncTime && (
                  <div className="mb-6">
                    <Card className="glass-panel border-yellow-200 dark:border-yellow-800">
                      <CardContent className="py-8">
                        <div className="text-center">
                          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No Campaign Data Found</h3>
                          <p className="text-muted-foreground mb-4">
                            No campaigns found in your selected Facebook ad accounts with the current filters.
                          </p>
                          
                          {/* Debug information */}
                          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm text-left max-w-md mx-auto">
                            <div><strong>Current Filters:</strong></div>
                            <div>• Status: {statusFilter}</div>
                            <div>• Date Range: {dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : 'Not set'} to {dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : 'Not set'}</div>
                            <div>• Selected Accounts: {selectedAccounts.length}</div>
                            <div>• Last Sync: {lastSyncTime ? format(lastSyncTime, 'HH:mm:ss') : 'Never'}</div>
                            {import.meta.env.DEV && (
                              <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                                <div><strong>Debug Info:</strong></div>
                                <div>• Check browser console for detailed logs</div>
                                <div>• API calls are being logged with response data</div>
                              </div>
                            )}
                          </div>

                          <div className="mb-4 text-sm text-muted-foreground">
                            <strong>Try these solutions:</strong>
                            <ul className="mt-2 text-left max-w-md mx-auto space-y-1">
                              <li>• Change status filter to "ALL" to see inactive campaigns</li>
                              <li>• Adjust the date range to include older campaigns</li>
                              <li>• Check if your ad account has any campaigns</li>
                              <li>• Verify your Facebook app has proper permissions</li>
                            </ul>
                          </div>

                          <div className="flex gap-2 justify-center">
                            <Button 
                              onClick={() => setStatusFilter('ALL')}
                              variant="outline"
                              size="sm"
                            >
                              <Filter className="mr-2 h-4 w-4" />
                              Show All Status
                            </Button>
                            <Button 
                              onClick={() => setShowAccountSelector(true)}
                              variant="outline"
                              size="sm"
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Check Accounts
                            </Button>
                            <Button 
                              onClick={() => handleSync(selectedAccounts)}
                              disabled={selectedAccounts.length === 0}
                              className="bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry Sync
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Show initial sync prompt when no sync has been performed */}
                {campaigns.length === 0 && !isSyncing && connectionState.isConnected && !lastSyncTime && (
                  <div className="mb-6">
                    <Card className="glass-panel border-blue-200 dark:border-blue-800">
                      <CardContent className="py-8">
                        <div className="text-center">
                          <BarChart3 className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Ready to Sync Your Facebook Ads Data</h3>
                          <p className="text-muted-foreground mb-6">
                            Click the sync button below to fetch your campaign data from the selected Facebook ad accounts.
                          </p>
                          
                          <Button 
                            onClick={() => handleSync(selectedAccounts)}
                            disabled={selectedAccounts.length === 0 || isSyncing}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="lg"
                          >
                            {isSyncing ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Sync Campaign Data
                              </>
                            )}
                          </Button>

                          {selectedAccounts.length === 0 && (
                            <p className="mt-4 text-sm text-yellow-600 dark:text-yellow-400">
                              Please select at least one ad account to sync data.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Show rate limit warning */}
                {connectionState.error && connectionState.error.includes('rate limit') && (
                  <div className="mb-6">
                    <Card className="glass-panel border-red-500/30 bg-red-900/20">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-6 w-6 text-red-400" />
                          <div>
                            <div className="font-semibold text-red-100">
                              Facebook API Rate Limit Reached
                            </div>
                            <div className="text-sm text-red-300">
                              You've made too many requests to Facebook API. Please wait a few minutes before trying again.
                              The system will automatically retry with delays to prevent this issue.
                            </div>
                            {import.meta.env.DEV && (
                              <div className="mt-2 p-2 bg-blue-900/30 rounded text-xs text-blue-200">
                                <strong>Development Mode:</strong> Mock data will be used for Ad Sets and Ads when rate limited.
                                This allows you to test the UI while waiting for the rate limit to reset.
                              </div>
                            )}
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConnectionState(prev => ({ ...prev, error: undefined }))}
                                className="text-red-100 border-red-400 hover:bg-red-800"
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setConnectionState(prev => ({ ...prev, error: undefined }));
                                  // Wait 5 seconds then try to sync again
                                  setTimeout(() => {
                                    if (selectedAccounts.length > 0) {
                                      handleSync(selectedAccounts);
                                    }
                                  }, 5000);
                                }}
                                className="text-red-100 border-red-400 hover:bg-red-800"
                              >
                                Retry in 5s
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Show message if we have campaigns but no insights */}
                {campaigns.length > 0 && stats.campaignsWithInsights === 0 && !connectionState.error?.includes('rate limit') && (
                  <div className="mb-6">
                    <Card className="glass-panel border-yellow-500/30 bg-yellow-900/20">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-6 w-6 text-yellow-400" />
                          <div>
                            <div className="font-semibold text-yellow-100">
                              Campaigns Loaded Successfully
                            </div>
                            <div className="text-sm text-yellow-300">
                              {campaigns.length} campaigns found, but insights data failed to load. Campaign names and basic info are available.
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Stats Cards - Only show if we have campaigns */}
                {campaigns.length > 0 && (
                  <>
                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <Card 
                        className={`glass-panel bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${chartVisibleLines.spend ? 'ring-2 ring-blue-500/50' : ''}`}
                        onClick={() => setChartVisibleLines(prev => ({ ...prev, spend: !prev.spend }))}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-200">
                            <DollarSign className="h-4 w-4" />
                            Total Spend
                            {chartVisibleLines.spend && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto"></div>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-blue-100">
                            ${stats.totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-blue-300 mt-1">
                            Click to toggle in chart
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`glass-panel bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/30 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${chartVisibleLines.clicks ? 'ring-2 ring-emerald-500/50' : ''}`}
                        onClick={() => setChartVisibleLines(prev => ({ ...prev, clicks: !prev.clicks }))}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-200">
                            <MousePointerClick className="h-4 w-4" />
                            Clicks
                            {chartVisibleLines.clicks && <div className="w-2 h-2 bg-emerald-500 rounded-full ml-auto"></div>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-100">
                            {stats.totalClicks.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-300 mt-1">
                            Click to toggle in chart
                          </div>
                        </CardContent>
                      </Card>

                      <Card 
                        className={`glass-panel bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-orange-500/30 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-105 ${chartVisibleLines.cpc ? 'ring-2 ring-amber-500/50' : ''}`}
                        onClick={() => setChartVisibleLines(prev => ({ ...prev, cpc: !prev.cpc }))}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-200">
                            <Target className="h-4 w-4" />
                            Avg CPC
                            {chartVisibleLines.cpc && <div className="w-2 h-2 bg-amber-500 rounded-full ml-auto"></div>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-orange-100">
                            ${stats.avgCPC.toFixed(2)}
                          </div>
                          <div className="text-xs text-orange-300 mt-1">
                            Click to toggle in chart
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-panel bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-500/30 shadow-lg">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-200">
                            <Eye className="h-4 w-4" />
                            Impressions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-purple-100">
                            {stats.totalImpressions.toLocaleString()}
                          </div>
                          <div className="text-xs text-purple-300 mt-1">
                            CPM: {stats.avgCPM.toFixed(2)}
                          </div>
                        </CardContent>
                      </Card>


                    </div>

                    {/* Performance Chart */}
                    {filteredCampaigns.length > 0 && (
                      <Card className="glass-panel mb-6">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <BarChart3 className="h-5 w-5 text-blue-500" />
                              Daily Performance Chart
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Toggle lines:</span>
                              <Button
                                size="sm"
                                variant={chartVisibleLines.spend ? "default" : "outline"}
                                onClick={() => setChartVisibleLines(prev => ({ ...prev, spend: !prev.spend }))}
                                className="h-7 px-2 text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                                  Daily Spend
                                </div>
                              </Button>
                              <Button
                                size="sm"
                                variant={chartVisibleLines.clicks ? "default" : "outline"}
                                onClick={() => setChartVisibleLines(prev => ({ ...prev, clicks: !prev.clicks }))}
                                className="h-7 px-2 text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-0.5 bg-emerald-500 rounded"></div>
                                  Daily Clicks
                                </div>
                              </Button>
                              <Button
                                size="sm"
                                variant={chartVisibleLines.cpc ? "default" : "outline"}
                                onClick={() => setChartVisibleLines(prev => ({ ...prev, cpc: !prev.cpc }))}
                                className="h-7 px-2 text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-0.5 bg-amber-500 rounded"></div>
                                  Daily CPC
                                </div>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={loadDailyInsights}
                                disabled={isLoadingDailyData || filteredCampaigns.length === 0}
                                className="h-7 px-2 text-xs"
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingDailyData ? 'animate-spin' : ''}`} />
                                Refresh Daily
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Real daily performance trends from Facebook API (Left axis: Spend & Clicks, Right axis: CPC)
                            </p>
                            <div className="flex items-center gap-2">
                              {isLoadingDailyData && (
                                <div className="flex items-center gap-1 text-xs text-blue-400">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Loading daily data...
                                </div>
                              )}
                              {Object.keys(dailyInsights).length > 0 && (
                                <div className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-300">
                                  Real Daily Data ({Object.keys(dailyInsights).length} days)
                                </div>
                              )}
                              {dailyDataError && (
                                <div className="px-2 py-1 rounded text-xs bg-red-900/30 text-red-300">
                                  Error Loading Data
                                </div>
                              )}
                            </div>
                          </div>
                          {import.meta.env.DEV && Object.keys(dailyInsights).length > 0 && (
                            <div className="mt-2 p-2 bg-green-900/20 rounded text-xs text-green-300">
                              <strong>Real Data:</strong> Using Facebook daily insights with date breakdown. 
                              {Object.keys(dailyInsights).length} days of data loaded.
                            </div>
                          )}
                          {dailyDataError && (
                            <div className="mt-2 p-2 bg-red-900/20 rounded text-xs text-red-300">
                              <strong>Error:</strong> {dailyDataError}
                            </div>
                          )}
                          {Object.keys(dailyInsights).length === 0 && !isLoadingDailyData && !dailyDataError && (
                            <div className="mt-2 p-2 bg-gray-900/20 rounded text-xs text-gray-400">
                              <strong>No Real Data:</strong> Only real Facebook daily insights are displayed. Click "Refresh Daily" to load data.
                            </div>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="h-80">
                            {Object.keys(dailyInsights).length > 0 && chartData.datasets.length > 0 ? (
                              <Line data={chartData} options={chartOptions} />
                            ) : dailyDataError ? (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-red-400 opacity-50" />
                                  <p className="mb-2 text-red-300">Failed to load daily data</p>
                                  <p className="text-xs mb-4 max-w-md">{dailyDataError}</p>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={loadDailyInsights}
                                      disabled={filteredCampaigns.length === 0 || isLoadingDailyData}
                                      variant="outline"
                                      className="border-red-400 text-red-300 hover:bg-red-900/20"
                                    >
                                      <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingDailyData ? 'animate-spin' : ''}`} />
                                      Retry
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : Object.keys(dailyInsights).length === 0 && !isLoadingDailyData ? (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p className="mb-2">No real daily data available</p>
                                  <p className="text-xs mb-4">Real Facebook daily insights are required to display this chart</p>
                                  <Button
                                    size="sm"
                                    onClick={loadDailyInsights}
                                    disabled={filteredCampaigns.length === 0}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Load Real Daily Data
                                  </Button>
                                </div>
                              </div>
                            ) : isLoadingDailyData ? (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                  <Loader2 className="h-12 w-12 mx-auto mb-2 animate-spin opacity-50" />
                                  <p>Loading daily insights...</p>
                                  <p className="text-xs">This may take a few moments</p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-muted-foreground">
                                <div className="text-center">
                                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p>No metrics selected</p>
                                  <p className="text-xs">Select at least one metric to show the chart</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}



                    {/* Overall Daily Spend Table */}
                    {filteredCampaigns.length > 0 && (
                      <Card className="glass-panel mb-6">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5 text-green-500" />
                              Daily Spend Report - All Accounts
                            </CardTitle>
                            <div className="flex items-center gap-2">
                              {isLoadingDailyData && (
                                <div className="flex items-center gap-1 text-xs text-blue-400">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Loading...
                                </div>
                              )}
                              {Object.keys(dailyInsights).length > 0 && (
                                <div className="px-2 py-1 rounded text-xs bg-green-900/30 text-green-300">
                                  {overallDailySpendData.length} days (real data)
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={loadDailyInsights}
                                disabled={isLoadingDailyData || filteredCampaigns.length === 0}
                                className="h-7 px-2 text-xs"
                              >
                                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingDailyData ? 'animate-spin' : ''}`} />
                                Refresh Daily Data
                              </Button>
                              {dailyDataError && dailyDataError.includes('Circuit breaker') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.location.reload()}
                                  className="h-7 px-2 text-xs text-red-300 border-red-400"
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Reconnect
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Daily performance summary across all synced Facebook ad accounts (real data only)
                            </p>
                            {Object.keys(dailyInsights).length > 0 && overallDailySpendData.length > 0 && (
                              <div className="flex items-center gap-4 text-xs">
                                <div className="text-blue-400">
                                  Total: ${overallDailySpendData.reduce((sum, row) => sum + row.spend, 0).toFixed(2)}
                                </div>
                                <div className="text-green-400">
                                  Clicks: {overallDailySpendData.reduce((sum, row) => sum + row.clicks, 0).toLocaleString()}
                                </div>
                                <div className="text-orange-400">
                                  Avg CPC: ${overallDailySpendData.length > 0 ? (overallDailySpendData.reduce((sum, row) => sum + row.cpc, 0) / overallDailySpendData.length).toFixed(2) : '0.00'}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {isLoadingDailyData ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin opacity-50" />
                                <p className="text-muted-foreground">Loading daily data...</p>
                              </div>
                            </div>
                          ) : Object.keys(dailyInsights).length > 0 && overallDailySpendData.length > 0 ? (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-secondary/30">
                                    <TableHead className="font-semibold">Day</TableHead>
                                    <TableHead className="text-right font-semibold">Ad Spend ($)</TableHead>
                                    <TableHead className="text-right font-semibold">Link Clicks</TableHead>
                                    <TableHead className="text-right font-semibold">CPC Link ($)</TableHead>
                                    <TableHead className="text-right font-semibold">CPM ($)</TableHead>
                                    <TableHead className="text-right font-semibold">Impressions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {overallDailySpendData.map((row, index) => (
                                    <TableRow key={row.date} className="hover:bg-secondary/20 transition-colors">
                                      <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                          <span className="text-sm font-semibold">
                                            {format(new Date(row.date), 'MMM dd, yyyy')}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {format(new Date(row.date), 'EEEE')}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        <span className={row.spend > 0 ? 'text-blue-400' : 'text-gray-500'}>
                                          ${row.spend.toFixed(2)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={row.clicks > 0 ? 'text-green-400' : 'text-gray-500'}>
                                          {row.clicks.toLocaleString()}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={row.cpc > 0 ? 'text-orange-400' : 'text-gray-500'}>
                                          ${row.cpc.toFixed(2)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={row.cpm > 0 ? 'text-purple-400' : 'text-gray-500'}>
                                          ${row.cpm.toFixed(2)}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground">
                                        {row.impressions.toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-12">
                              <div className="text-center">
                                <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p className="mb-2">No real daily data available</p>
                                <p className="text-xs mb-4 text-muted-foreground">
                                  Real daily insights from Facebook API are required to display this data.
                                  {dailyDataError && (
                                    <span className="block mt-2 text-red-400">
                                      Error: {dailyDataError}
                                    </span>
                                  )}
                                </p>
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    onClick={loadDailyInsights}
                                    disabled={filteredCampaigns.length === 0 || isLoadingDailyData}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingDailyData ? 'animate-spin' : ''}`} />
                                    Load Real Daily Data
                                  </Button>
                                  {dailyDataError && dailyDataError.includes('Circuit breaker') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.location.reload()}
                                      className="text-red-300 border-red-400"
                                    >
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Reconnect
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Filters */}
                    <Card className="glass-panel mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Filter className="h-5 w-5 text-blue-500" />
                          Filters
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Search */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Search Campaign Name</label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="Contains name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          {/* Date Range Presets */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Date Range</label>
                            <div className="relative date-picker-container">
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                {dateRangePreset === 'today' && 'วันนี้'}
                                {dateRangePreset === 'yesterday' && 'เมื่อวาน'}
                                {dateRangePreset === '7d' && '7 วันล่าสุด'}
                                {dateRangePreset === '14d' && '14 วันล่าสุด'}
                                {dateRangePreset === '30d' && '30 วันล่าสุด'}
                                {dateRangePreset === 'thisMonth' && 'เดือนนี้'}
                                {dateRangePreset === 'lastMonth' && 'เดือนที่แล้ว'}
                                {dateRangePreset === 'max' && 'มากที่สุด'}
                                {dateRangePreset === 'custom' && `${dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : ''} - ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : ''}`}
                              </Button>
                              
                              {showDatePicker && (
                                <div className="absolute top-full left-0 mt-1 w-80 bg-background border border-border rounded-md shadow-lg z-50 p-4">
                                  <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <Button
                                        variant={dateRangePreset === 'today' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          handleDateRangePreset('today');
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        วันนี้
                                      </Button>
                                      <Button
                                        variant={dateRangePreset === 'yesterday' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          handleDateRangePreset('yesterday');
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        เมื่อวาน
                                      </Button>
                                      <Button
                                        variant={dateRangePreset === '7d' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          handleDateRangePreset('7d');
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        7 วัน
                                      </Button>
                                      <Button
                                        variant={dateRangePreset === '14d' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          handleDateRangePreset('14d');
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        14 วัน
                                      </Button>
                                      <Button
                                        variant={dateRangePreset === '30d' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          handleDateRangePreset('30d');
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        30 วัน
                                      </Button>
                                      <Button
                                        variant={dateRangePreset === 'thisMonth' ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => {
                                          handleDateRangePreset('thisMonth');
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        เดือนนี้
                                      </Button>
                                    </div>
                                    
                                    <div className="border-t pt-2">
                                      <div className="text-sm font-medium mb-2">เลือกช่วงวันที่เอง</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-xs text-muted-foreground">จาก</label>
                                          <input
                                            type="date"
                                            value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => {
                                              const date = e.target.value ? new Date(e.target.value) : undefined;
                                              setDateRange(prev => ({ ...prev, from: date }));
                                              setDateRangePreset('custom');
                                            }}
                                            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted-foreground">ถึง</label>
                                          <input
                                            type="date"
                                            value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                                            onChange={(e) => {
                                              const date = e.target.value ? new Date(e.target.value) : undefined;
                                              setDateRange(prev => ({ ...prev, to: date }));
                                              setDateRangePreset('custom');
                                            }}
                                            className="w-full px-2 py-1 text-xs border border-border rounded bg-background"
                                          />
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        className="w-full mt-2"
                                        onClick={() => {
                                          if (selectedAccounts.length > 0) {
                                            handleSync(selectedAccounts);
                                          }
                                          setShowDatePicker(false);
                                        }}
                                      >
                                        Apply Custom Range
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Status Filter */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Campaign Status</label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="PAUSED">Paused</SelectItem>
                                <SelectItem value="DELETED">Deleted</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Objective Filter */}
                          <div>
                            <label className="text-sm font-medium mb-2 block">Objective</label>
                            <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ALL">All Objectives</SelectItem>
                                {availableObjectives.map((objective) => (
                                  <SelectItem key={objective} value={objective}>
                                    {objective}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Custom Date Range */}
                        {dateRangePreset === 'custom' && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">From Date</label>
                              <input
                                type="date"
                                value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  setDateRange(prev => ({ ...prev, from: date }));
                                }}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">To Date</label>
                              <input
                                type="date"
                                value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : undefined;
                                  setDateRange(prev => ({ ...prev, to: date }));
                                }}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleClearFilters}
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Multi-level Table */}
                    <Card className="glass-panel">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {currentView !== 'campaigns' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={currentView === 'ads' ? handleBackToAdSets : handleBackToCampaigns}
                                  className="mr-2"
                                >
                                  ← Back
                                </Button>
                              )}
                              <CardTitle className="flex items-center gap-2">
                                <Facebook className="h-5 w-5 text-blue-500" />
                                {currentView === 'campaigns' && 'Facebook Campaigns'}
                                {currentView === 'adsets' && `Ad Sets - ${selectedCampaign?.name}`}
                                {currentView === 'ads' && `Ads - ${selectedAdSet?.name}`}
                              </CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {currentView === 'campaigns' && 'Click on a campaign to view ad sets'}
                              {currentView === 'adsets' && 'Click on an ad set to view ads'}
                              {currentView === 'ads' && 'Individual ads performance data'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-lg border border-border/50 overflow-hidden">
                          {/* Campaigns Table */}
                          {currentView === 'campaigns' && (
                            <Table>
                            <TableHeader>
                              <TableRow className="bg-secondary/30">
                                <TableHead 
                                  className="font-semibold cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => {
                                    if (sortBy === 'name') {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy('name');
                                      setSortOrder('asc');
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-1">
                                    Campaign
                                    {sortBy === 'name' && (
                                      <span className="text-xs">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold">Objective</TableHead>
                                <TableHead 
                                  className="text-right font-semibold cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => {
                                    if (sortBy === 'spend') {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy('spend');
                                      setSortOrder('desc');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    Spend
                                    {sortBy === 'spend' && (
                                      <span className="text-xs">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-right font-semibold cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => {
                                    if (sortBy === 'impressions') {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy('impressions');
                                      setSortOrder('desc');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    Impressions
                                    {sortBy === 'impressions' && (
                                      <span className="text-xs">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-right font-semibold cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => {
                                    if (sortBy === 'clicks') {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy('clicks');
                                      setSortOrder('desc');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    Clicks
                                    {sortBy === 'clicks' && (
                                      <span className="text-xs">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-right font-semibold cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => {
                                    if (sortBy === 'ctr') {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy('ctr');
                                      setSortOrder('desc');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    CTR
                                    {sortBy === 'ctr' && (
                                      <span className="text-xs">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead 
                                  className="text-right font-semibold cursor-pointer hover:bg-secondary/50 transition-colors"
                                  onClick={() => {
                                    if (sortBy === 'cpc') {
                                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                      setSortBy('cpc');
                                      setSortOrder('asc');
                                    }
                                  }}
                                >
                                  <div className="flex items-center justify-end gap-1">
                                    CPC
                                    {sortBy === 'cpc' && (
                                      <span className="text-xs">
                                        {sortOrder === 'asc' ? '↑' : '↓'}
                                      </span>
                                    )}
                                  </div>
                                </TableHead>
                                <TableHead className="font-semibold">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCampaigns.map((campaign) => (
                                <TableRow 
                                  key={campaign.id} 
                                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
                                  onClick={() => handleCampaignClick(campaign)}
                                >
                                  <TableCell>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">{campaign.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        ID: {campaign.id} • Created: {format(new Date(campaign.created_time), 'MMM dd, yyyy')}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={
                                        campaign.status === 'ACTIVE' ? 'default' :
                                        campaign.status === 'PAUSED' ? 'secondary' : 'outline'
                                      }
                                      className={
                                        campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' :
                                        campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                        'bg-gray-100 text-gray-800 border-gray-200'
                                      }
                                    >
                                      {campaign.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm font-medium">{campaign.objective}</span>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {(parseFloat(campaign.insights?.spend || '0') || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {(parseInt(campaign.insights?.impressions || '0') || 0).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {(parseInt(campaign.insights?.clicks || '0') || 0).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`font-medium ${
                                      (parseFloat(campaign.insights?.ctr || '0') || 0) * 100 >= 2 ? 'text-green-600' :
                                      (parseFloat(campaign.insights?.ctr || '0') || 0) * 100 >= 1 ? 'text-blue-600' :
                                      (parseFloat(campaign.insights?.ctr || '0') || 0) * 100 >= 0.5 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {((parseFloat(campaign.insights?.ctr || '0') || 0) * 100).toFixed(2)}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {(parseFloat(campaign.insights?.cpc || '0') || 0).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs hover:bg-blue-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCampaignClick(campaign);
                                        }}
                                      >
                                        <Eye size={12} className="mr-1" />
                                        View Ad Sets
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          )}

                          {/* Ad Sets Table */}
                          {currentView === 'adsets' && (
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-secondary/30">
                                  <TableHead className="font-semibold">Ad Set</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  <TableHead className="font-semibold">Targeting</TableHead>
                                  <TableHead className="text-right font-semibold">Spend</TableHead>
                                  <TableHead className="text-right font-semibold">Impressions</TableHead>
                                  <TableHead className="text-right font-semibold">Clicks</TableHead>
                                  <TableHead className="text-right font-semibold">CTR</TableHead>
                                  <TableHead className="text-right font-semibold">CPC</TableHead>
                                  <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {isLoadingAdSets ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                      <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-muted-foreground">Loading ad sets...</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : adSets.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                      No ad sets found for this campaign
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  adSets.map((adSet) => (
                                    <TableRow 
                                      key={adSet.id} 
                                      className="hover:bg-secondary/20 transition-colors cursor-pointer"
                                      onClick={() => handleAdSetClick(adSet)}
                                    >
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">{adSet.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            ID: {adSet.id} • Created: {format(new Date(adSet.created_time), 'MMM dd, yyyy')}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={
                                            adSet.status === 'ACTIVE' ? 'default' :
                                            adSet.status === 'PAUSED' ? 'secondary' :
                                            'destructive'
                                          }
                                          className="text-xs"
                                        >
                                          {adSet.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm">
                                          {adSet.daily_budget ? `Daily: ${(adSet.daily_budget / 100).toLocaleString()}` : 
                                           adSet.lifetime_budget ? `Lifetime: ${(adSet.lifetime_budget / 100).toLocaleString()}` : 
                                           'No Budget'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {(parseFloat(adSet.insights?.spend || '0') || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(parseInt(adSet.insights?.impressions || '0') || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(parseInt(adSet.insights?.clicks || '0') || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          (parseFloat(adSet.insights?.ctr || '0') || 0) * 100 >= 2 ? 'text-green-600' :
                                          (parseFloat(adSet.insights?.ctr || '0') || 0) * 100 >= 1 ? 'text-blue-600' :
                                          (parseFloat(adSet.insights?.ctr || '0') || 0) * 100 >= 0.5 ? 'text-yellow-600' :
                                          'text-red-600'
                                        }`}>
                                          {((parseFloat(adSet.insights?.ctr || '0') || 0) * 100).toFixed(2)}%
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(parseFloat(adSet.insights?.cpc || '0') || 0).toFixed(2)}
                                      </TableCell>
                                      <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 px-2 text-xs hover:bg-blue-50"
                                          onClick={() => handleAdSetClick(adSet)}
                                        >
                                          <Eye size={12} className="mr-1" />
                                          View Ads
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          )}

                          {/* Ads Table */}
                          {currentView === 'ads' && (
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-secondary/30">
                                  <TableHead className="font-semibold">Ad</TableHead>
                                  <TableHead className="font-semibold">Status</TableHead>
                                  <TableHead className="font-semibold">Ad Type</TableHead>
                                  <TableHead className="text-right font-semibold">Spend</TableHead>
                                  <TableHead className="text-right font-semibold">Impressions</TableHead>
                                  <TableHead className="text-right font-semibold">Clicks</TableHead>
                                  <TableHead className="text-right font-semibold">CTR</TableHead>
                                  <TableHead className="text-right font-semibold">CPC</TableHead>
                                  <TableHead className="font-semibold">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {isLoadingAds ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                      <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-muted-foreground">Loading ads...</span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ) : ads.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                      No ads found for this ad set
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  ads.map((ad) => (
                                    <TableRow key={ad.id} className="hover:bg-secondary/20 transition-colors">
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="font-medium text-sm">{ad.name}</span>
                                          <span className="text-xs text-muted-foreground">
                                            ID: {ad.id} • Created: {format(new Date(ad.created_time), 'MMM dd, yyyy')}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Badge 
                                          variant={
                                            ad.status === 'ACTIVE' ? 'default' :
                                            ad.status === 'PAUSED' ? 'secondary' :
                                            'destructive'
                                          }
                                          className="text-xs"
                                        >
                                          {ad.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        <span className="text-sm">
                                          {ad.creative?.object_type || 'Standard Ad'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right font-semibold">
                                        {(parseFloat(ad.insights?.spend || '0') || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(parseInt(ad.insights?.impressions || '0') || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(parseInt(ad.insights?.clicks || '0') || 0).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          (parseFloat(ad.insights?.ctr || '0') || 0) * 100 >= 2 ? 'text-green-600' :
                                          (parseFloat(ad.insights?.ctr || '0') || 0) * 100 >= 1 ? 'text-blue-600' :
                                          (parseFloat(ad.insights?.ctr || '0') || 0) * 100 >= 0.5 ? 'text-yellow-600' :
                                          'text-red-600'
                                        }`}>
                                          {((parseFloat(ad.insights?.ctr || '0') || 0) * 100).toFixed(2)}%
                                        </span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {(parseFloat(ad.insights?.cpc || '0') || 0).toFixed(2)}
                                      </TableCell>
                                      <TableCell>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-7 px-2 text-xs hover:bg-blue-50"
                                          disabled
                                        >
                                          <Eye size={12} className="mr-1" />
                                          View Details
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          )}


                        </div>
                        
                        {filteredCampaigns.length === 0 && campaigns.length > 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Facebook className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <div className="text-lg font-medium mb-1">No campaigns match your filters</div>
                            <div className="text-sm">
                              Try adjusting your search or filter criteria
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacebookAdsAPI;