import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, LineChart } from "recharts";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

interface AdsChartProps {
  dailyMetrics: DailyData[];
  calculatedMetrics?: any;
}

interface DailyData {
  date: string;
  totalCom: number;
  adSpend: number;
  profit: number;
  roi: number;
}

interface StatOption {
  key: string;
  label: string;
  color: string;
  dataKey: string;
}

const ADS_STAT_OPTIONS: StatOption[] = [
  { key: 'adSpend', label: 'Ad Spend', color: '#ef4444', dataKey: 'adSpend' },
  { key: 'linkClick', label: 'Link Click', color: '#3b82f6', dataKey: 'linkClick' },
  { key: 'cpcLink', label: 'CPC Link', color: '#8b5cf6', dataKey: 'cpcLink' },
];

export default function AdsChart({
  dailyMetrics,
  calculatedMetrics
}: AdsChartProps) {
  const [selectedStats, setSelectedStats] = useState<string[]>(['adSpend', 'linkClick', 'cpcLink']);

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  const formatCPC = (value: number) => {
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const formatNumber = (value: number) => {
    return Math.round(value).toLocaleString('en-US');
  };

  const chartData = useMemo(() => {
    // Use daily breakdown with calculated metrics for accuracy
    if (calculatedMetrics && dailyMetrics.length > 0) {
      const totalAdSpend = calculatedMetrics.totalAdsSpent || 0;
      const totalLinkClick = calculatedMetrics.totalLinkClicks || 0;
      const avgCPC = calculatedMetrics.cpcLink || 0;
      

      
      return dailyMetrics.map(day => {
        // Calculate proportional values based on ad spend
        const dayRatio = totalAdSpend > 0 ? day.adSpend / totalAdSpend : 0;
        const linkClick = Math.round(totalLinkClick * dayRatio);
        const cpcLink = linkClick > 0 ? day.adSpend / linkClick : avgCPC;
        

        
        return {
          date: day.date,
          adSpend: day.adSpend,
          linkClick: linkClick,
          cpcLink: cpcLink
        };
      });
    }
    
    // Fallback to approximation method
    return dailyMetrics.map(day => {
      const estimatedClicks = Math.round(day.adSpend / 2); // Assume 2 THB per click
      return {
        date: day.date,
        adSpend: day.adSpend,
        linkClick: estimatedClicks,
        cpcLink: estimatedClicks > 0 ? day.adSpend / estimatedClicks : 2
      };
    });
  }, [dailyMetrics, calculatedMetrics]);

  const handleStatToggle = (statKey: string) => {
    setSelectedStats(prev => 
      prev.includes(statKey) 
        ? prev.filter(s => s !== statKey)
        : [...prev, statKey]
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white mb-2">{format(new Date(label), 'dd/MM/yyyy')}</p>
          {payload.map((entry: any, index: number) => {
            const isAdSpend = entry.dataKey === 'adSpend';
            const isCPC = entry.dataKey === 'cpcLink';
            const isLinkClick = entry.dataKey === 'linkClick';
            
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {
                  isCPC 
                    ? formatCPC(entry.value)
                    : isAdSpend 
                    ? formatCurrency(entry.value)
                    : formatNumber(entry.value)
                }
                {isCPC && ' THB'}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <TrendingUp className="h-5 w-5 text-red-400" />
          📊 Ads Chart
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          คลิกที่ StatCard เพื่อเพิ่ม/ลบจากกราฟ (แสดงข้อมูลโฆษณารายวัน):
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ADS_STAT_OPTIONS.map((stat) => (
            <div
              key={stat.key}
              onClick={() => handleStatToggle(stat.key)}
              className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                selectedStats.includes(stat.key)
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-border bg-card/30 hover:bg-card/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                  <span className="font-medium text-white">{stat.label}</span>
                </div>
                <Checkbox 
                  checked={selectedStats.includes(stat.key)}
                  onChange={() => handleStatToggle(stat.key)}
                />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">
                  {stat.key === 'linkClick' 
                    ? formatNumber(chartData.reduce((sum, day) => sum + (day[stat.dataKey as keyof typeof day] as number), 0))
                    : stat.key === 'cpcLink'
                    ? formatCPC(chartData.reduce((sum, day, index, arr) => sum + (day[stat.dataKey as keyof typeof day] as number), 0) / chartData.length)
                    : formatCurrency(chartData.reduce((sum, day) => sum + (day[stat.dataKey as keyof typeof day] as number), 0))
                  }
                  {stat.key === 'cpcLink' && <span className="text-sm text-muted-foreground ml-1">THB</span>}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {selectedStats.length > 0 && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                {/* Left Y-axis for Ad Spend and Link Click */}
                <YAxis 
                  yAxisId="left"
                  stroke="#9CA3AF" 
                  fontSize={12}
                  orientation="left"
                />
                {/* Right Y-axis for CPC Link */}
                <YAxis 
                  yAxisId="right"
                  stroke="#8b5cf6" 
                  fontSize={12}
                  orientation="right"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {/* Ad Spend Bar - Left axis */}
                {selectedStats.includes('adSpend') && (
                  <Bar
                    yAxisId="left"
                    dataKey="adSpend"
                    fill="#ef4444"
                    name="Ad Spend"
                    radius={[2, 2, 0, 0]}
                  />
                )}
                
                {/* Link Click Bar - Left axis */}
                {selectedStats.includes('linkClick') && (
                  <Bar
                    yAxisId="left"
                    dataKey="linkClick"
                    fill="#3b82f6"
                    name="Link Click"
                    radius={[2, 2, 0, 0]}
                  />
                )}
                
                {/* CPC Link Line - Right axis */}
                {selectedStats.includes('cpcLink') && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cpcLink"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                    name="CPC Link"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedStats.length === 0 && (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>เลือกอย่างน้อย 1 ตัวแปรเพื่อแสดงกราฟ</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}