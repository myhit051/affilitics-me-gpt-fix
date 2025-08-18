
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useMemo } from 'react';
import { format } from 'date-fns';

interface MetricsData {
  date: string;
  adsSpent: number;
  totalCom: number;
  profit: number;
  roi: number;
}

interface ROIChartProps {
  shopeeOrders: any[];
  lazadaOrders: any[];
  facebookAds: any[];
  dateRange: {from?: Date; to?: Date};
}

export default function ROIChart({ shopeeOrders, lazadaOrders, facebookAds, dateRange }: ROIChartProps) {
  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    
    // Group data by date
    const dateMap = new Map<string, MetricsData>();
    
    // Process Facebook Ads data
    facebookAds.forEach(ad => {
      const dateStr = ad['Date'] || ad['Day'] || '';
      if (!dateStr) return;
      
      const adsSpent = parseFloat(ad['Amount spent (THB)']) || 0;
      const linkClicks = parseFloat(ad['Link clicks']) || 0;
      
      // Estimate commission from Facebook ads (5% of spend as assumption)
      const estimatedCommission = adsSpent * 0.05;
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          adsSpent: 0,
          totalCom: 0,
          profit: 0,
          roi: 0
        });
      }
      
      const data = dateMap.get(dateStr)!;
      data.adsSpent += adsSpent;
      data.totalCom += estimatedCommission; // Add estimated commission from Facebook
    });
    
    // Process Shopee orders
    shopeeOrders.forEach(order => {
      const dateStr = order['วันที่สั่งซื้อ'] || '';
      if (!dateStr) return;
      
      const commission = parseFloat(order['คอมมิชชั่นสินค้าโดยรวม(฿)']) || 0;
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          adsSpent: 0,
          totalCom: 0,
          profit: 0,
          roi: 0
        });
      }
      
      const data = dateMap.get(dateStr)!;
      data.totalCom += commission;
    });
    
    // Process Lazada orders
    lazadaOrders.forEach(order => {
      const dateStr = order['Order Time'] ? order['Order Time'].split(' ')[0] : '';
      if (!dateStr) return;
      
      const payout = parseFloat(order['Payout']) || 0;
      
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, {
          date: dateStr,
          adsSpent: 0,
          totalCom: 0,
          profit: 0,
          roi: 0
        });
      }
      
      const data = dateMap.get(dateStr)!;
      data.totalCom += payout;
    });
    
    // Calculate profit and ROI for each date
    Array.from(dateMap.values()).forEach(data => {
      data.profit = data.totalCom - data.adsSpent;
      data.roi = data.adsSpent > 0 ? (data.profit / data.adsSpent) * 100 : 0;
    });
    
    // Sort by date and return
    return Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Show last 30 days
  }, [shopeeOrders, lazadaOrders, facebookAds, dateRange]);

  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          📈 Performance Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => {
                  try {
                    return format(new Date(value), 'MM/dd');
                  } catch {
                    return value;
                  }
                }}
              />
              <YAxis 
                yAxisId="currency"
                orientation="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <YAxis 
                yAxisId="percentage"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={formatPercentage}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'ROI') {
                    return [formatPercentage(value), name];
                  }
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(value) => {
                  try {
                    return format(new Date(value), 'dd/MM/yyyy');
                  } catch {
                    return value;
                  }
                }}
              />
              <Legend />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="adsSpent" 
                stroke="#EF4444" 
                strokeWidth={2}
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                name="Ads Spent"
              />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="totalCom" 
                stroke="#22C55E" 
                strokeWidth={2}
                dot={{ fill: '#22C55E', strokeWidth: 2, r: 3 }}
                name="Total Com"
              />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="profit" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 3 }}
                name="Profit"
              />
              <Line 
                yAxisId="percentage"
                type="monotone" 
                dataKey="roi" 
                stroke="#A855F7" 
                strokeWidth={3}
                dot={{ fill: '#A855F7', strokeWidth: 2, r: 4 }}
                name="ROI (%)"
              />
              <ReferenceLine yAxisId="percentage" y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-secondary/30 rounded-lg">
            <div className="text-xs text-muted-foreground">Avg Ads Spent</div>
            <div className="text-lg font-bold text-red-500">
              {chartData.length > 0 ? formatCurrency(chartData.reduce((acc, curr) => acc + curr.adsSpent, 0) / chartData.length) : '0'}
            </div>
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg">
            <div className="text-xs text-muted-foreground">Avg Total Com</div>
            <div className="text-lg font-bold text-green-500">
              {chartData.length > 0 ? formatCurrency(chartData.reduce((acc, curr) => acc + curr.totalCom, 0) / chartData.length) : '0'}
            </div>
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg">
            <div className="text-xs text-muted-foreground">Avg Profit</div>
            <div className="text-lg font-bold text-blue-500">
              {chartData.length > 0 ? formatCurrency(chartData.reduce((acc, curr) => acc + curr.profit, 0) / chartData.length) : '0'}
            </div>
          </div>
          <div className="p-3 bg-secondary/30 rounded-lg">
            <div className="text-xs text-muted-foreground">Avg ROI</div>
            <div className="text-lg font-bold text-purple-500">
              {chartData.length > 0 ? formatPercentage(chartData.reduce((acc, curr) => acc + curr.roi, 0) / chartData.length) : '0%'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
