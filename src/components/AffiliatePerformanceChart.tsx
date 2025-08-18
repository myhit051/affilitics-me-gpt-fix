
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, parse, isValid } from "date-fns";
import { DateRange } from "react-day-picker";

interface AffiliatePerformanceChartProps {
  dailyMetrics?: any[];
  shopeeOrders?: any[];
  lazadaOrders?: any[];
  facebookAds?: any[];
  dateRange?: DateRange;
  selectedSubIds?: string[];
  selectedChannels?: string[];
  selectedPlatform?: string;
}

export default function AffiliatePerformanceChart({ 
  dailyMetrics = [],
  shopeeOrders = [], 
  lazadaOrders = [], 
  facebookAds = [], 
  dateRange,
  selectedSubIds = [],
  selectedChannels = [],
  selectedPlatform = "all"
}: AffiliatePerformanceChartProps) {
  
  const chartData = useMemo(() => {
    // If dailyMetrics is provided, use it directly (already filtered)
    if (dailyMetrics && dailyMetrics.length > 0) {
      return dailyMetrics.map(day => ({
        date: day.date,
        adSpend: day.adSpend,
        totalCom: day.totalCom,
        totalProfit: day.profit,
        overallROI: day.roi,
        displayDate: format(new Date(day.date), 'MM/dd')
      }));
    }
    
    // Fallback to original logic for backward compatibility
    // Apply filters to data first
    let filteredShopeeOrders = shopeeOrders;
    let filteredLazadaOrders = lazadaOrders;
    let filteredFacebookAds = facebookAds;

    // Filter by Sub IDs
    if (selectedSubIds.length > 0) {
      filteredShopeeOrders = filteredShopeeOrders.filter(order => 
        selectedSubIds.includes(order['Sub ID'] || order['SubID'] || '')
      );
      filteredLazadaOrders = filteredLazadaOrders.filter(order => 
        selectedSubIds.includes(order['Sub ID'] || order['SubID'] || '')
      );
      filteredFacebookAds = filteredFacebookAds.filter(ad => 
        selectedSubIds.includes(ad['Sub ID'] || ad['SubID'] || '')
      );
    }

    // Filter by Channels
    if (selectedChannels.length > 0) {
      filteredShopeeOrders = filteredShopeeOrders.filter(order => 
        selectedChannels.includes(order['ช่องทาง'] || order['Channel'] || '')
      );
    }

    // Filter by Platform
    if (selectedPlatform !== "all") {
      if (selectedPlatform === "shopee") {
        filteredLazadaOrders = [];
      } else if (selectedPlatform === "lazada") {
        filteredShopeeOrders = [];
      }
    }

    const dataMap = new Map<string, {
      date: string;
      adSpend: number;
      totalCom: number;
      totalProfit: number;
      overallROI: number;
    }>();

    // If no date range is selected, collect all unique dates from the filtered data
    let startDate: Date, endDate: Date;
    
    if (dateRange?.from && dateRange?.to) {
      startDate = new Date(dateRange.from);
      endDate = new Date(dateRange.to);
    } else {
      // Find the earliest and latest dates from all data sources
      const allDates: Date[] = [];
      
      // Collect dates from filtered Facebook Ads
      filteredFacebookAds.forEach(ad => {
        const dateStr = ad['Day'] || ad['Date'];
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (isValid(parsedDate)) {
            allDates.push(parsedDate);
          }
        }
      });
      
      // Collect dates from filtered Shopee orders
      filteredShopeeOrders.forEach(order => {
        const dateStr = order['เวลาที่สั่งซื้อ'];
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (isValid(parsedDate)) {
            allDates.push(parsedDate);
          }
        }
      });
      
      // Collect dates from filtered Lazada orders
      filteredLazadaOrders.forEach(order => {
        const dateStr = order['Conversion Time'] || order['Order Time'];
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (isValid(parsedDate)) {
            allDates.push(parsedDate);
          }
        }
      });
      
      if (allDates.length === 0) return [];
      
      startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
      endDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    }

    // Initialize date range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      dataMap.set(dateStr, {
        date: dateStr,
        adSpend: 0,
        totalCom: 0,
        totalProfit: 0,
        overallROI: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process filtered Facebook Ads data using "Day" column
    filteredFacebookAds.forEach(ad => {
      const dateStr = ad['Day'] || ad['Date']; // Try Day first, then Date as fallback
      if (dateStr) {
        const parsedDate = new Date(dateStr);
        if (isValid(parsedDate)) {
          const formattedDate = format(parsedDate, 'yyyy-MM-dd');
          const data = dataMap.get(formattedDate);
          if (data) {
            data.adSpend += parseFloat(ad['Amount spent (THB)']) || 0;
          }
        }
      }
    });

    // Process unique Shopee orders using "เวลาที่สั่งซื้อ" column
    const uniqueShopeeOrders = new Map();
    filteredShopeeOrders.forEach(order => {
      const orderId = order['เลขที่คำสั่งซื้อ'];
      if (!uniqueShopeeOrders.has(orderId)) {
        uniqueShopeeOrders.set(orderId, order);
      }
    });

    Array.from(uniqueShopeeOrders.values()).forEach(order => {
      const dateStr = order['เวลาที่สั่งซื้อ'];
      if (dateStr) {
        try {
          const parsedDate = new Date(dateStr);
          
          if (isValid(parsedDate)) {
            const formattedDate = format(parsedDate, 'yyyy-MM-dd');
            const data = dataMap.get(formattedDate);
            if (data) {
              data.totalCom += parseFloat(order['คอมมิชชั่นสินค้าโดยรวม(฿)']) || 0;
            }
          }
        } catch (error) {
          console.warn('Error parsing Shopee date:', dateStr);
        }
      }
    });

    // Process unique Lazada orders using "Conversion Time" column (or Order Time as fallback)
    const uniqueLazadaOrders = new Map();
    filteredLazadaOrders.forEach(order => {
      const checkoutId = order['Check Out ID'];
      if (!uniqueLazadaOrders.has(checkoutId)) {
        uniqueLazadaOrders.set(checkoutId, order);
      }
    });

    Array.from(uniqueLazadaOrders.values()).forEach(order => {
      const dateStr = order['Conversion Time'] || order['Order Time'];
      if (dateStr) {
        try {
          const parsedDate = new Date(dateStr);
          if (isValid(parsedDate)) {
            const formattedDate = format(parsedDate, 'yyyy-MM-dd');
            const data = dataMap.get(formattedDate);
            if (data) {
              data.totalCom += parseFloat(order['Commission'] || order['Payout']) || 0;
            }
          }
        } catch (error) {
          console.warn('Error parsing Lazada date:', dateStr);
        }
      }
    });

    // Calculate profit and ROI for each day
    const result = Array.from(dataMap.values()).map(data => {
      data.totalProfit = data.totalCom - data.adSpend;
      data.overallROI = data.adSpend > 0 ? (data.totalProfit / data.adSpend) * 100 : 0;
      return {
        ...data,
        displayDate: format(new Date(data.date), 'MM/dd')
      };
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyMetrics, shopeeOrders, lazadaOrders, facebookAds, dateRange]);

  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          📈 Affiliate Performance (รายวัน)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="currency"
                orientation="left"
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                yAxisId="percentage"
                orientation="right"
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === 'Overall ROI') {
                    return [`${value.toFixed(1)}%`, name];
                  }
                  return [formatCurrency(value), name];
                }}
                labelFormatter={(label) => `วันที่: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="adSpend" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Ad Spend"
                dot={{ fill: '#ef4444' }}
              />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="totalCom" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Total Com"
                dot={{ fill: '#10b981' }}
              />
              <Line 
                yAxisId="currency"
                type="monotone" 
                dataKey="totalProfit" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Profit"
                dot={{ fill: '#3b82f6' }}
              />
              <Line 
                yAxisId="percentage"
                type="monotone" 
                dataKey="overallROI" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Overall ROI"
                dot={{ fill: '#8b5cf6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <div>ไม่มีข้อมูลสำหรับแสดงกราฟ Affiliate Performance</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
