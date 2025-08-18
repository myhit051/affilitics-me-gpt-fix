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

interface FacebookCampaignTableProps {
  facebookAds: FacebookAd[];
}

export default function FacebookCampaignTable({ facebookAds }: FacebookCampaignTableProps) {
  const formatCurrency = (value: number) => {
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

  const getPerformanceColor = (ctr: number) => {
    if (ctr >= 2.0) return 'text-green-400';
    if (ctr >= 1.0) return 'text-blue-400';
    if (ctr >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPerformanceLabel = (ctr: number) => {
    if (ctr >= 2.0) return 'excellent';
    if (ctr >= 1.0) return 'good';
    if (ctr >= 0.5) return 'average';
    return 'poor';
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Group ads by campaign for better display
  const campaignGroups = facebookAds.reduce((groups, ad) => {
    const campaignName = ad['Campaign name'] || 'Unknown Campaign';
    if (!groups[campaignName]) {
      groups[campaignName] = [];
    }
    groups[campaignName].push(ad);
    return groups;
  }, {} as Record<string, FacebookAd[]>);

  const campaignSummaries = Object.entries(campaignGroups).map(([campaignName, ads]) => {
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

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            📘 Facebook Campaign Performance
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
                <TableHead className="font-medium">Est. Orders</TableHead>
                <TableHead className="font-medium">Est. Commission</TableHead>
                <TableHead className="font-medium">Ad Spend</TableHead>
                <TableHead className="font-medium">ROI</TableHead>
                <TableHead className="font-medium">CTR</TableHead>
                <TableHead className="font-medium">CPC</TableHead>
                <TableHead className="font-medium">Performance</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaignSummaries.map((campaign, index) => (
                <TableRow key={index} className="hover:bg-secondary/20">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{campaign.campaignName}</span>
                      <span className="text-xs text-muted-foreground">
                        {campaign.adCount} ads • Last run {formatDate(campaign.latestDate.toISOString())}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📘</span>
                      <span className="text-sm">Facebook</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {campaign.estimatedOrders}
                  </TableCell>
                  <TableCell className="font-medium text-chart-green">
                    {formatCurrency(campaign.estimatedCommission)}
                  </TableCell>
                  <TableCell className="font-medium text-chart-red">
                    {formatCurrency(campaign.totalSpent)}
                  </TableCell>
                  <TableCell className="font-bold text-chart-blue">
                    {campaign.roi.toFixed(1)}%
                  </TableCell>
                  <TableCell className="font-medium">
                    {campaign.avgCTR.toFixed(2)}%
                  </TableCell>
                  <TableCell className="font-medium">
                    ฿{formatCurrency(campaign.avgCPC)}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${getPerformanceColor(campaign.avgCTR)}`}>
                      {getPerformanceLabel(campaign.avgCTR)}
                    </span>
                  </TableCell>
                  <TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
        
        {campaignSummaries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📘</div>
            <div className="text-lg font-medium mb-1">No Facebook campaigns found</div>
            <div className="text-sm">Import Facebook Ads data or adjust your filters</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}