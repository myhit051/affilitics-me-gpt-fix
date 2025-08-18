/**
 * Virtualized Facebook Campaign Table
 * Optimized for large datasets with virtual scrolling
 */

import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Play, MoreHorizontal, Calendar } from "lucide-react";
import { useVirtualScrolling } from '@/hooks/useVirtualScrolling';

interface FacebookAd {
  'Campaign name': string;
  'Ad set name': string;
  'Ad name': string;
  'Amount spent (THB)': string;
  'Impressions': string;
  'Link clicks': string;
  'Landing page views': string;
  'Reach': string;
  'Frequency': string;
  'CPM (cost per 1,000 impressions)': string;
  'CPC (cost per link click)': string;
  'CTR (link click-through rate)': string;
  'Date': string;
  'Sub ID': string;
}

interface CampaignSummary {
  campaignName: string;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalReach: number;
  avgCTR: number;
  avgCPC: number;
  avgCPM: number;
  estimatedOrders: number;
  estimatedCommission: number;
  roi: number;
  adCount: number;
  latestDate: Date;
}

interface VirtualizedFacebookCampaignTableProps {
  facebookAds: FacebookAd[];
  containerHeight?: number;
  itemHeight?: number;
  onCampaignClick?: (campaign: CampaignSummary) => void;
  onExportClick?: () => void;
  onCreateCampaignClick?: () => void;
}

const VirtualizedFacebookCampaignTable: React.FC<VirtualizedFacebookCampaignTableProps> = ({
  facebookAds,
  containerHeight = 600,
  itemHeight = 80,
  onCampaignClick,
  onExportClick,
  onCreateCampaignClick,
}) => {
  // Utility functions
  const formatCurrency = useCallback((value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  }, []);

  const parseNumber = useCallback((value: string | number | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  const getPerformanceColor = useCallback((ctr: number) => {
    if (ctr >= 2.0) return 'text-green-400';
    if (ctr >= 1.0) return 'text-blue-400';
    if (ctr >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  }, []);

  const getPerformanceLabel = useCallback((ctr: number) => {
    if (ctr >= 2.0) return 'excellent';
    if (ctr >= 1.0) return 'good';
    if (ctr >= 0.5) return 'average';
    return 'poor';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }, []);

  // Process campaign data
  const campaignSummaries = useMemo(() => {
    // Group ads by campaign for better display
    const campaignGroups = facebookAds.reduce((groups, ad) => {
      const campaignName = ad['Campaign name'] || 'Unknown Campaign';
      if (!groups[campaignName]) {
        groups[campaignName] = [];
      }
      groups[campaignName].push(ad);
      return groups;
    }, {} as Record<string, FacebookAd[]>);

    return Object.entries(campaignGroups).map(([campaignName, ads]) => {
      const totalSpent = ads.reduce((sum, ad) => sum + parseNumber(ad['Amount spent (THB)']), 0);
      const totalImpressions = ads.reduce((sum, ad) => sum + parseNumber(ad['Impressions']), 0);
      const totalClicks = ads.reduce((sum, ad) => sum + parseNumber(ad['Link clicks']), 0);
      const totalReach = ads.reduce((sum, ad) => sum + parseNumber(ad['Reach']), 0);
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
      const avgCPC = totalClicks > 0 ? totalSpent / totalClicks : 0;
      const avgCPM = totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0;
      
      // Estimate orders and commission (since Facebook doesn't provide this directly)
      const estimatedOrders = Math.round(totalClicks * 0.02); // 2% conversion rate assumption
      const estimatedCommission = totalSpent * 0.05; // 5% commission rate assumption
      const roi = totalSpent > 0 ? ((estimatedCommission - totalSpent) / totalSpent) * 100 : 0;

      return {
        campaignName,
        totalSpent,
        totalImpressions,
        totalClicks,
        totalReach,
        avgCTR,
        avgCPC,
        avgCPM,
        estimatedOrders,
        estimatedCommission,
        roi,
        adCount: ads.length,
        latestDate: ads.reduce((latest, ad) => {
          const adDate = new Date(ad['Date'] || ad['Day'] || '');
          return adDate > latest ? adDate : latest;
        }, new Date(0))
      };
    });
  }, [facebookAds, parseNumber]);

  // Virtual scrolling setup
  const {
    visibleItems,
    startIndex,
    totalHeight,
    offsetY,
    containerProps,
    viewportProps,
    scrollToTop,
  } = useVirtualScrolling(campaignSummaries, {
    itemHeight,
    containerHeight: containerHeight - 120, // Account for header height
    overscan: 5,
  });

  // Handle campaign click
  const handleCampaignClick = useCallback((campaign: CampaignSummary) => {
    onCampaignClick?.(campaign);
  }, [onCampaignClick]);

  // Render campaign row
  const renderCampaignRow = useCallback((campaign: CampaignSummary, index: number) => (
    <TableRow 
      key={`${campaign.campaignName}-${index}`}
      className="hover:bg-secondary/20 cursor-pointer"
      onClick={() => handleCampaignClick(campaign)}
      style={{
        position: 'absolute',
        top: index * itemHeight,
        left: 0,
        right: 0,
        height: itemHeight,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <TableCell style={{ width: '200px', flexShrink: 0 }}>
        <div className="flex flex-col">
          <span className="font-medium text-sm truncate">{campaign.campaignName}</span>
          <span className="text-xs text-muted-foreground">
            {campaign.adCount} ads • Last run {formatDate(campaign.latestDate.toISOString())}
          </span>
        </div>
      </TableCell>
      <TableCell style={{ width: '100px', flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📘</span>
          <span className="text-sm">Facebook</span>
        </div>
      </TableCell>
      <TableCell className="text-center font-medium" style={{ width: '100px', flexShrink: 0 }}>
        {campaign.estimatedOrders}
      </TableCell>
      <TableCell className="font-medium text-chart-green" style={{ width: '120px', flexShrink: 0 }}>
        {formatCurrency(campaign.estimatedCommission)}
      </TableCell>
      <TableCell className="font-medium text-chart-red" style={{ width: '120px', flexShrink: 0 }}>
        {formatCurrency(campaign.totalSpent)}
      </TableCell>
      <TableCell className="font-bold text-chart-blue" style={{ width: '100px', flexShrink: 0 }}>
        {campaign.roi.toFixed(1)}%
      </TableCell>
      <TableCell className="font-medium" style={{ width: '100px', flexShrink: 0 }}>
        {campaign.avgCTR.toFixed(2)}%
      </TableCell>
      <TableCell className="font-medium" style={{ width: '120px', flexShrink: 0 }}>
        ฿{formatCurrency(campaign.avgCPC)}
      </TableCell>
      <TableCell style={{ width: '100px', flexShrink: 0 }}>
        <span className={`text-xs font-medium ${getPerformanceColor(campaign.avgCTR)}`}>
          {getPerformanceLabel(campaign.avgCTR)}
        </span>
      </TableCell>
      <TableCell style={{ width: '120px', flexShrink: 0 }}>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Play size={12} className="mr-1" />
            View
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <MoreHorizontal size={12} />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  ), [
    itemHeight,
    formatCurrency,
    formatDate,
    getPerformanceColor,
    getPerformanceLabel,
    handleCampaignClick,
  ]);

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            📘 Facebook Campaign Performance ({campaignSummaries.length} campaigns)
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Calendar size={14} className="mr-1" />
              Filter Date
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onExportClick}
            >
              Export CSV
            </Button>
            <Button 
              size="sm" 
              className="text-xs"
              onClick={onCreateCampaignClick}
            >
              Create Campaign
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={scrollToTop}
            >
              ↑ Top
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {/* Table Header */}
          <div className="bg-secondary/30 border-b">
            <div className="flex items-center" style={{ height: '40px' }}>
              <div className="font-medium px-4" style={{ width: '200px', flexShrink: 0 }}>Campaign</div>
              <div className="font-medium px-4" style={{ width: '100px', flexShrink: 0 }}>Platform</div>
              <div className="font-medium px-4" style={{ width: '100px', flexShrink: 0 }}>Est. Orders</div>
              <div className="font-medium px-4" style={{ width: '120px', flexShrink: 0 }}>Est. Commission</div>
              <div className="font-medium px-4" style={{ width: '120px', flexShrink: 0 }}>Ad Spend</div>
              <div className="font-medium px-4" style={{ width: '100px', flexShrink: 0 }}>ROI</div>
              <div className="font-medium px-4" style={{ width: '100px', flexShrink: 0 }}>CTR</div>
              <div className="font-medium px-4" style={{ width: '120px', flexShrink: 0 }}>CPC</div>
              <div className="font-medium px-4" style={{ width: '100px', flexShrink: 0 }}>Performance</div>
              <div className="font-medium px-4" style={{ width: '120px', flexShrink: 0 }}>Actions</div>
            </div>
          </div>

          {/* Virtual Scrolling Container */}
          <div 
            {...containerProps}
            data-virtual-scroll-container
            className="relative"
          >
            <div {...viewportProps}>
              <div
                style={{
                  transform: `translateY(${offsetY}px)`,
                  position: 'relative',
                }}
              >
                {visibleItems.map((campaign, index) => 
                  renderCampaignRow(campaign, startIndex + index)
                )}
              </div>
            </div>
          </div>
        </div>
        
        {campaignSummaries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📘</div>
            <div className="text-lg font-medium mb-1">No Facebook campaigns found</div>
            <div className="text-sm">Import Facebook Ads data or adjust your filters</div>
          </div>
        )}

        {/* Performance Stats */}
        {campaignSummaries.length > 0 && (
          <div className="mt-4 p-4 bg-secondary/20 rounded-lg">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Campaigns</div>
                <div className="font-medium">{campaignSummaries.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Spend</div>
                <div className="font-medium text-chart-red">
                  ฿{formatCurrency(campaignSummaries.reduce((sum, c) => sum + c.totalSpent, 0))}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Impressions</div>
                <div className="font-medium">
                  {campaignSummaries.reduce((sum, c) => sum + c.totalImpressions, 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg CTR</div>
                <div className="font-medium">
                  {(campaignSummaries.reduce((sum, c) => sum + c.avgCTR, 0) / campaignSummaries.length).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VirtualizedFacebookCampaignTable;