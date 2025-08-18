import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import { useImportedData } from "@/hooks/useImportedData";

interface StatsChartProps {
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

const STAT_OPTIONS: StatOption[] = [
  { key: 'adSpend', label: 'Ad Spend', color: '#ef4444', dataKey: 'adSpend' },
  { key: 'totalCom', label: 'Total Com', color: '#10b981', dataKey: 'totalCom' },
  { key: 'profit', label: 'Profit', color: '#3b82f6', dataKey: 'profit' },
  { key: 'roi', label: 'ROI (%)', color: '#8b5cf6', dataKey: 'roi' },
  { key: 'comSP', label: 'Com SP', color: '#f97316', dataKey: 'comSP' },
  { key: 'comLZD', label: 'Com LZD', color: '#a855f7', dataKey: 'comLZD' },
  { key: 'orderSP', label: 'Order SP', color: '#f59e0b', dataKey: 'orderSP' },
  { key: 'orderLZD', label: 'Order LZD', color: '#06b6d4', dataKey: 'orderLZD' },
];

// Stats that use percentage (right Y-axis)
const PERCENTAGE_STATS = ['roi'];

export default function StatsChart({
  dailyMetrics,
  calculatedMetrics
}: StatsChartProps) {
  const [selectedStats, setSelectedStats] = useState<string[]>(['adSpend', 'totalCom', 'profit', 'roi']);
  const { rawShopeeCommission, rawShopeeOrderCount, uniqueShopeeOrderCount } = useImportedData();


  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  const chartData = useMemo(() => {
    if (dailyMetrics.length > 0) {
      const totalCom = dailyMetrics.reduce((sum, day) => sum + day.totalCom, 0) || 1;
      return dailyMetrics.map(day => ({
        ...day,
        comSP: rawShopeeCommission * (day.totalCom / totalCom),
        comLZD: day.totalCom - rawShopeeCommission * (day.totalCom / totalCom),
        orderSP: Math.round(uniqueShopeeOrderCount * (day.totalCom / totalCom)),
        orderLZD: 0 // หรือคำนวณตามเดิมถ้ามีข้อมูล
      }));
    }
    return [];
  }, [dailyMetrics, rawShopeeCommission, uniqueShopeeOrderCount]);

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
            // Find the stat option to determine if it's a percentage
            const stat = STAT_OPTIONS.find(s => s.label === entry.name);
            const isPercentage = stat ? PERCENTAGE_STATS.includes(stat.key) : entry.name.includes('%');
            
            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {isPercentage ? `${entry.value.toFixed(1)}%` : formatCurrency(entry.value)}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            📈 Multi-Stats Chart
          </CardTitle>
        </div>
        
        {/* StatCards - Clickable */}
        {calculatedMetrics && (
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              คลิกที่ StatCard เพื่อเพิ่ม/ลบจากกราฟ (แสดงค่ารวมทั้งหมด):
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STAT_OPTIONS.map(stat => {
                const isSelected = selectedStats.includes(stat.key);
                const getValue = () => {
                  // Calculate totals from dailyMetrics to match chart data
                  const totals = chartData.reduce((acc, day) => ({
                    adSpend: acc.adSpend + day.adSpend,
                    totalCom: acc.totalCom + day.totalCom,
                    profit: acc.profit + day.profit,
                    comSP: acc.comSP + day.comSP,
                    comLZD: acc.comLZD + day.comLZD,
                    orderSP: acc.orderSP + day.orderSP,
                    orderLZD: acc.orderLZD + day.orderLZD
                  }), {
                    adSpend: 0, totalCom: 0, profit: 0, comSP: 0, comLZD: 0, orderSP: 0, orderLZD: 0
                  });
                  
                  switch (stat.key) {
                    case 'adSpend': return totals.adSpend;
                    case 'totalCom': return totals.totalCom;
                    case 'profit': return totals.profit;
                    case 'roi': return totals.adSpend > 0 ? (totals.profit / totals.adSpend) * 100 : 0;
                    case 'comSP': return totals.comSP;
                    case 'comLZD': return totals.comLZD;
                    case 'orderSP': return totals.orderSP;
                    case 'orderLZD': return totals.orderLZD;
                    default: return 0;
                  }
                };
                
                const value = getValue();
                const displayValue = ['roi'].includes(stat.key) 
                  ? `${value.toFixed(1)}%` 
                  : formatCurrency(value);
                
                return (
                  <div 
                    key={stat.key} 
                    onClick={() => handleStatToggle(stat.key)}
                    className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg' 
                        : 'border-border hover:border-blue-300 hover:bg-blue-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: stat.color }}
                      />
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                    <div className="text-sm font-bold text-white">{displayValue}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Fallback Stat Selection */}
        {!calculatedMetrics && (
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground mb-3">เลือกข้อมูลที่ต้องการแสดงในกราฟ:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STAT_OPTIONS.map(stat => (
                <div key={stat.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={stat.key}
                    checked={selectedStats.includes(stat.key)}
                    onCheckedChange={() => handleStatToggle(stat.key)}
                  />
                  <label 
                    htmlFor={stat.key} 
                    className="text-sm cursor-pointer flex items-center gap-2"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: stat.color }}
                    />
                    {stat.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {chartData.length > 0 && selectedStats.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                  stroke="rgba(255,255,255,0.6)"
                />
                {/* Left Y-Axis for currency values */}
                <YAxis 
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.6)"
                  tickFormatter={formatCurrency}
                />
                {/* Right Y-Axis for percentage values */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.6)"
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                
                {selectedStats.map(statKey => {
                  const stat = STAT_OPTIONS.find(s => s.key === statKey);
                  if (!stat) return null;
                  
                  const isPercentage = PERCENTAGE_STATS.includes(statKey);
                  
                  return (
                    <Line
                      key={statKey}
                      type="monotone"
                      dataKey={stat.dataKey}
                      stroke={stat.color}
                      strokeWidth={2}
                      dot={{ fill: stat.color, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: stat.color, strokeWidth: 2 }}
                      name={stat.label}
                      yAxisId={isPercentage ? "right" : "left"}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📈</div>
              <div>
                {selectedStats.length === 0 
                  ? "กรุณาเลือกข้อมูลที่ต้องการแสดงในกราฟ" 
                  : "No data available"
                }
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}