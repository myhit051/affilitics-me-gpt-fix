
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Play, Pause, MoreHorizontal, Calendar } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  platform: string;
  subId: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  status: string;
  startDate: string;
  performance: string;
}

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

interface CampaignTableProps {
  campaigns?: Campaign[];
  facebookAds?: FacebookAd[];
  showPlatform?: string; // 'all', 'traditional', 'facebook'
}

export default function CampaignTable({ campaigns = [], facebookAds = [], showPlatform = 'all' }: CampaignTableProps) {
  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Transform Facebook ads into campaign format
  const transformFacebookToCampaigns = (ads: FacebookAd[]): Campaign[] => {
    // Group ads by campaign name
    const campaignGroups = ads.reduce((groups, ad) => {
      const campaignName = ad['Campaign name'] || 'Unknown Campaign';
      if (!groups[campaignName]) {
        groups[campaignName] = [];
      }
      groups[campaignName].push(ad);
      return groups;
    }, {} as Record<string, FacebookAd[]>);

    return Object.entries(campaignGroups).map(([campaignName, campaignAds], index) => {
      const totalSpent = campaignAds.reduce((sum, ad) => sum + parseNumber(ad['Amount spent (THB)']), 0);
      const totalClicks = campaignAds.reduce((sum, ad) => sum + parseNumber(ad['Link clicks']), 0);
      const avgCTR = campaignAds.length > 0 
        ? campaignAds.reduce((sum, ad) => sum + parseNumber(ad['CTR (link click-through rate)']), 0) / campaignAds.length 
        : 0;
      
      // Estimate orders and commission (since Facebook doesn't provide this directly)
      const estimatedOrders = Math.round(totalClicks * 0.02); // 2% conversion rate assumption
      const estimatedCommission = totalSpent * 0.05; // 5% commission rate assumption
      const roi = totalSpent > 0 ? ((estimatedCommission - totalSpent) / totalSpent) * 100 : 0;
      
      // Generate sub ID from campaign name
      const subId = `fb_${campaignName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 10)}`;
      
      // Get the latest date from the campaign ads
      const latestDate = campaignAds.reduce((latest, ad) => {
        const adDate = new Date(ad['Date'] || ad['Day'] || '');
        return adDate > latest ? adDate : latest;
      }, new Date(0));

      const getPerformanceLabel = (ctr: number) => {
        if (ctr >= 2.0) return 'excellent';
        if (ctr >= 1.0) return 'good';
        if (ctr >= 0.5) return 'average';
        return 'poor';
      };

      return {
        id: 2000 + index, // Ensure unique ID for Facebook campaigns
        name: campaignName,
        platform: 'Facebook',
        subId,
        orders: estimatedOrders,
        commission: Math.round(estimatedCommission * 100) / 100,
        adSpend: Math.round(totalSpent * 100) / 100,
        roi: Math.round(roi * 10) / 10,
        status: 'active', // Assume active since we have recent data
        startDate: latestDate.toISOString().split('T')[0],
        performance: getPerformanceLabel(avgCTR)
      };
    });
  };

  // Combine traditional campaigns with Facebook campaigns
  const facebookCampaigns = transformFacebookToCampaigns(facebookAds);
  let allCampaigns: Campaign[] = [];

  if (showPlatform === 'all') {
    allCampaigns = [...campaigns, ...facebookCampaigns];
  } else if (showPlatform === 'facebook') {
    allCampaigns = facebookCampaigns;
  } else if (showPlatform === 'traditional') {
    allCampaigns = campaigns;
  } else {
    // Filter by specific platform
    allCampaigns = [...campaigns.filter(c => c.platform === showPlatform), ...facebookCampaigns.filter(c => c.platform === showPlatform)];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'ended': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'average': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Shopee': return '🛒';
      case 'Lazada': return '🛍️';
      case 'Facebook': return '📘';
      default: return '📊';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            🚀 Campaign Performance
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Calendar size={14} className="mr-1" />
              Filter Date
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Export CSV
            </Button>
            <Button size="sm" className="text-xs">
              Create Campaign
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="font-medium">Campaign</TableHead>
                <TableHead className="font-medium">Platform</TableHead>
                <TableHead className="font-medium">Sub ID</TableHead>
                <TableHead className="font-medium">Orders</TableHead>
                <TableHead className="font-medium">Commission</TableHead>
                <TableHead className="font-medium">Ad Spend</TableHead>
                <TableHead className="font-medium">ROI</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="font-medium">Performance</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allCampaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-secondary/20">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Started {formatDate(campaign.startDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getPlatformIcon(campaign.platform)}</span>
                      <span className="text-sm">{campaign.platform}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                      {campaign.subId}
                    </code>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {campaign.orders}
                  </TableCell>
                  <TableCell className="font-medium text-chart-green">
                    {formatCurrency(campaign.commission)}
                  </TableCell>
                  <TableCell className="font-medium text-chart-red">
                    {formatCurrency(campaign.adSpend)}
                  </TableCell>
                  <TableCell className="font-bold text-chart-blue">
                    {campaign.roi.toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${getPerformanceColor(campaign.performance)}`}>
                      {campaign.performance}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {campaign.status === 'active' ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Pause size={12} className="mr-1" />
                          Pause
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                          <Play size={12} className="mr-1" />
                          Start
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <MoreHorizontal size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
