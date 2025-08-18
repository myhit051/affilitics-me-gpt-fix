import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface TopCategoryDonutChartProps {
  shopeeOrders: any[];
  lazadaOrders: any[];
  selectedSubIds?: string[];
  selectedChannels?: string[];
  selectedPlatform?: string;
  dateRange?: any;
}

export default function TopCategoryDonutChart({
  shopeeOrders,
  lazadaOrders,
  selectedSubIds = [],
  selectedChannels = [],
  selectedPlatform = "all",
  dateRange
}: TopCategoryDonutChartProps) {
  
  const chartData = useMemo(() => {
    // Apply filters to data first
    let filteredShopeeOrders = shopeeOrders;
    let filteredLazadaOrders = lazadaOrders;
    
    // Filter by Sub IDs
    if (selectedSubIds.length > 0) {
      filteredShopeeOrders = filteredShopeeOrders.filter(order => {
        const orderSubIds = [
          order['Sub_id1'], order['Sub_id2'], order['Sub_id3'],
          order['Sub_id4'], order['Sub_id5']
        ].filter(Boolean);
        return orderSubIds.some(subId => selectedSubIds.includes(subId));
      });
      
      filteredLazadaOrders = filteredLazadaOrders.filter(order => {
        const orderSubIds = [
          order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'],
          order['Sub ID 3'], order['Sub ID 4']
        ].filter(Boolean);
        return orderSubIds.some(subId => selectedSubIds.includes(subId));
      });
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
    
    // Filter by Date Range
    if (dateRange?.from && dateRange?.to) {
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      
      filteredShopeeOrders = filteredShopeeOrders.filter(order => {
        const orderDate = new Date(order['เวลาที่สั่งซื้อ']);
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      filteredLazadaOrders = filteredLazadaOrders.filter(order => {
        const orderDate = new Date(order['Conversion Time'] || order['Order Time']);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    const categoryMap: { [key: string]: { orders: number, platform: string } } = {};

    // Process Shopee orders if platform allows
    if (selectedPlatform === "all" || selectedPlatform === "shopee") {
      filteredShopeeOrders.forEach(order => {
        const category = order['L1 หมวดหมู่สากล'] || 'Other';
        
        if (!categoryMap[category]) {
          categoryMap[category] = { orders: 0, platform: 'Shopee' };
        } else if (categoryMap[category].platform !== 'Shopee') {
          categoryMap[category].platform = 'Mixed';
        }
        
        categoryMap[category].orders += 1;
      });
    }

    // Process Lazada orders if platform allows
    if (selectedPlatform === "all" || selectedPlatform === "lazada") {
      filteredLazadaOrders.forEach(order => {
        const category = order['Category L1'] || 'Other';
        
        if (!categoryMap[category]) {
          categoryMap[category] = { orders: 0, platform: 'Lazada' };
        } else if (categoryMap[category].platform !== 'Lazada') {
          categoryMap[category].platform = 'Mixed';
        }
        
        categoryMap[category].orders += 1;
      });
    }

    // Convert to chart data and sort by orders
    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        name: category,
        value: data.orders,
        platform: data.platform
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [shopeeOrders, lazadaOrders, selectedSubIds, selectedChannels, selectedPlatform, dateRange]);

  // Theme colors
  const COLORS = [
    '#f97316', // orange-500
    '#8b5cf6', // violet-500  
    '#06b6d4', // cyan-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#3b82f6', // blue-500
    '#84cc16', // lime-500
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-white">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Orders: <span className="text-blue-400 font-medium">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Platform: <span className="text-green-400 font-medium">{data.platform}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/80 max-w-[100px] truncate" title={entry.value}>
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const totalOrders = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          🍩 Category Orders Distribution
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Total Orders: <span className="text-blue-400 font-medium">{totalOrders.toLocaleString()}</span>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <div>No data available</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}