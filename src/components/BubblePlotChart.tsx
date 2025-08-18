import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface BubblePlotChartProps {
  subIdAnalysis: any[];
}



export default function BubblePlotChart({
  subIdAnalysis
}: BubblePlotChartProps) {

  const bubbleData = useMemo(() => {
    // Convert subIdAnalysis to bubble data format
    const rawData = subIdAnalysis
      .filter(item => item.adSpent > 0 || item.commission > 0)
      .map(item => ({
        subId: item.id, // Use 'id' instead of 'subId'
        totalCom: item.commission,
        profit: item.commission - item.adSpent,
        roi: item.adSpent > 0 ? Math.abs(((item.commission - item.adSpent) / item.adSpent) * 100) : 0,
        adSpend: item.adSpent,
        platform: item.platform || 'Unknown'
      }))
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 20); // Top 20 Sub IDs
    
    // Calculate bubble sizes and add as 'z' property
    const maxROI = Math.max(...rawData.map(d => d.roi), 1);
    const minROI = Math.min(...rawData.map(d => d.roi), 0);
    const minBubbleSize = 30;  // ขนาดเล็กสุด - ลดลง
    const maxBubbleSize = 800; // ขนาดใหญ่สุด - เพิ่มขึ้น
    
    return rawData.map(item => {
      const roiRange = maxROI - minROI;
      let normalizedROI = roiRange > 0 ? (item.roi - minROI) / roiRange : 0.5;
      
      // Apply exponential scaling for more dramatic difference
      normalizedROI = Math.pow(normalizedROI, 0.3); // ใช้ power scaling แทน square root
      
      const bubbleSize = minBubbleSize + normalizedROI * (maxBubbleSize - minBubbleSize);
      const finalSize = Math.max(bubbleSize, minBubbleSize);
      
      return {
        ...item,
        z: finalSize // Use 'z' for bubble size in Recharts
      };
    });
  }, [subIdAnalysis]);

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-4 shadow-lg min-w-[200px]">
          <p className="font-bold text-white mb-2">{data.subId}</p>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Total Com: <span className="text-green-400 font-medium">{formatCurrency(data.totalCom)}</span>
            </p>
            <p className="text-muted-foreground">
              Profit: <span className={`font-medium ${data.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatCurrency(data.profit)}
              </span>
            </p>
            <p className="text-muted-foreground">
              ROI: <span className="text-yellow-400 font-medium">{data.roi.toFixed(1)}%</span>
            </p>
            <p className="text-muted-foreground">
              Ad Spend: <span className="text-red-400 font-medium">{formatCurrency(data.adSpend)}</span>
            </p>
            <p className="text-muted-foreground">
              Platform: <span className="text-purple-400 font-medium">{data.platform}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBubbleColor = (platform: string) => {
    switch (platform) {
      case 'Shopee': return '#f97316'; // orange-500
      case 'Lazada': return '#8b5cf6'; // violet-500
      case 'Mixed': return '#06b6d4';  // cyan-500
      default: return '#6b7280';       // gray-500
    }
  };

  console.log('🔍 BUBBLE CHART DEBUG:', {
    sampleData: bubbleData.slice(0, 5).map(d => ({
      subId: d.subId,
      roi: d.roi,
      bubbleSize: d.z,
      platform: d.platform
    }))
  });

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          🫧 Sub ID Performance Bubble Chart
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          X: Total Com, Y: Profit, Bubble Size: ROI
        </div>
      </CardHeader>
      <CardContent>
        {bubbleData.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  type="number" 
                  dataKey="totalCom"
                  name="Total Com"
                  tickFormatter={formatCurrency}
                  stroke="rgba(255,255,255,0.6)"
                />
                <YAxis 
                  type="number" 
                  dataKey="profit"
                  name="Profit"
                  tickFormatter={formatCurrency}
                  stroke="rgba(255,255,255,0.6)"
                />
                <ZAxis 
                  type="number" 
                  dataKey="z"
                  range={[30, 800]}
                  name="ROI"
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter data={bubbleData}>
                  {bubbleData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBubbleColor(entry.platform)}
                      fillOpacity={0.7}
                      stroke={getBubbleColor(entry.platform)}
                      strokeWidth={2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🫧</div>
              <div>No data available</div>
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-white/80">Shopee</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500"></div>
            <span className="text-white/80">Lazada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
            <span className="text-white/80">Mixed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}