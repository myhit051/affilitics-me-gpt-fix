
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
import { TrendingUp, TrendingDown, Minus, Play, Pause, BarChart3 } from "lucide-react";

interface SubIdData {
  id: number;
  subId: string;
  platform: string;
  orders: number;
  commission: number;
  adSpend: number;
  roi: number;
  trend: string;
  level: number;
}

interface SubIdAnalysisProps {
  data: SubIdData[];
}

export default function SubIdAnalysis({ data }: SubIdAnalysisProps) {
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0";
    }
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} className="text-green-400" />;
      case 'down': return <TrendingDown size={16} className="text-red-400" />;
      default: return <Minus size={16} className="text-gray-400" />;
    }
  };

  const getRoiColor = (roi: number) => {
    if (roi >= 70) return 'text-green-400';
    if (roi >= 40) return 'text-blue-400';
    if (roi >= 20) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPlatformBadge = (platform: string) => {
    const colors = {
      'Shopee': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Lazada': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'Facebook': 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            🎯 Sub ID Performance Matrix
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Pause size={14} className="mr-1" />
              Pause Low ROI
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Play size={14} className="mr-1" />
              Scale High ROI
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <BarChart3 size={14} className="mr-1" />
              Create Report
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="font-medium">Sub ID</TableHead>
                <TableHead className="font-medium">Platform</TableHead>
                <TableHead className="font-medium">Orders</TableHead>
                <TableHead className="font-medium">Commission</TableHead>
                <TableHead className="font-medium">Ad Spend</TableHead>
                <TableHead className="font-medium">ROI</TableHead>
                <TableHead className="font-medium">Trend</TableHead>
                <TableHead className="font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id} className="hover:bg-secondary/20">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm">{item.subId}</span>
                      <span className="text-xs text-muted-foreground">Level {item.level}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPlatformBadge(item.platform)}`}>
                      {item.platform}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.orders || 0}
                  </TableCell>
                  <TableCell className="font-medium text-chart-green">
                    {formatCurrency(item.commission)}
                  </TableCell>
                  <TableCell className="font-medium text-chart-red">
                    {formatCurrency(item.adSpend)}
                  </TableCell>
                  <TableCell className={`font-bold ${getRoiColor(item.roi || 0)}`}>
                    {(item.roi || 0).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(item.trend)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(item.roi || 0) < 30 && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-red-400 hover:text-red-300">
                          Pause
                        </Button>
                      )}
                      {(item.roi || 0) > 60 && (
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-400 hover:text-green-300">
                          Scale
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300">
                        View
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
