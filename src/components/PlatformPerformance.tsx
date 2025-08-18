
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PlatformData {
  id: number;
  platform: string;
  icon: string;
  type: 'ads' | 'affiliate';
  // For Facebook Ads
  adSpend?: number;
  linkClicks?: number;
  cpcLink?: number;
  reach?: number;
  // For Shopee
  comSP?: number;
  orderSP?: number;
  amountSP?: number;
  // For Lazada
  comLZD?: number;
  orderLZD?: number;
  amountLZD?: number;
  // Legacy fields
  orders?: number;
  commission?: number;
  roi?: number;
  status?: string;
  change?: number;
}

interface PlatformPerformanceProps {
  data: PlatformData[];
}

export default function PlatformPerformance({ data }: PlatformPerformanceProps) {
  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'average': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp size={16} className="text-green-400" />;
    if (change < 0) return <TrendingDown size={16} className="text-red-400" />;
    return <Minus size={16} className="text-gray-400" />;
  };

  const renderMetrics = (platform: PlatformData) => {
    if (platform.type === 'ads' || platform.platform === "Facebook Ads") {
      // Facebook Ads metrics
      return (
        <>
          <div>
            <p className="text-muted-foreground">Ad Spend</p>
            <p className="font-medium text-chart-red">{formatCurrency(platform.adSpend || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Link Click</p>
            <p className="font-medium text-chart-blue">{formatNumber(platform.linkClicks || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CPC Link</p>
            <p className="font-medium text-chart-green">{formatCurrency(platform.cpcLink || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Reach</p>
            <p className="font-medium text-chart-purple">{formatNumber(platform.reach || 0)}</p>
          </div>
        </>
      );
    } else if (platform.platform === "Shopee") {
      // Shopee metrics
      return (
        <>
          <div>
            <p className="text-muted-foreground">Com SP</p>
            <p className="font-medium text-chart-green">{formatCurrency(platform.comSP || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Order SP</p>
            <p className="font-medium text-chart-blue">{formatNumber(platform.orderSP || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount SP</p>
            <p className="font-medium text-chart-purple">{formatCurrency(platform.amountSP || 0)}</p>
          </div>
          <div></div>
        </>
      );
    } else if (platform.platform === "Lazada") {
      // Lazada metrics
      return (
        <>
          <div>
            <p className="text-muted-foreground">Com LZD</p>
            <p className="font-medium text-chart-green">{formatCurrency(platform.comLZD || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Order LZD</p>
            <p className="font-medium text-chart-blue">{formatNumber(platform.orderLZD || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Amount LZD</p>
            <p className="font-medium text-chart-purple">{formatCurrency(platform.amountLZD || 0)}</p>
          </div>
          <div></div>
        </>
      );
    } else {
      // Legacy format for demo data
      return (
        <>
          <div>
            <p className="text-muted-foreground">Orders</p>
            <p className="font-medium text-foreground">{platform.orders}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Commission</p>
            <p className="font-medium text-chart-green">{formatCurrency(platform.commission || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ad Spend</p>
            <p className="font-medium text-chart-red">{formatCurrency(platform.adSpend || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ROI</p>
            <p className="font-medium text-chart-blue">{platform.roi?.toFixed(1)}%</p>
          </div>
        </>
      );
    }
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          📊 Platform Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((platform) => (
            <div 
              key={platform.id}
              className="p-4 rounded-lg bg-secondary/40 border border-border/50 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-medium text-foreground">{platform.platform}</h3>
                    {platform.status && (
                      <Badge className={`text-xs ${getStatusColor(platform.status)}`}>
                        {platform.status}
                      </Badge>
                    )}
                  </div>
                </div>
                {platform.change !== undefined && (
                  <div className="flex items-center gap-2">
                    {getTrendIcon(platform.change)}
                    <span className={`text-sm font-medium ${
                      platform.change > 0 ? 'text-green-400' : 
                      platform.change < 0 ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {platform.change > 0 ? '+' : ''}{platform.change.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {renderMetrics(platform)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
