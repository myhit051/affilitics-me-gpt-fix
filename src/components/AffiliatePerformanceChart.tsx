import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { format, isValid } from "date-fns";
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

/* ---------------- helpers for robust fallback ---------------- */
const parseDateKeyLoose = (s?: string): string => {
  const str = (s || "").trim();
  if (!str) return "Unknown";
  let m = str.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(str);
  if (!isValid(d)) return "Unknown";
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
};

const isCanceledShopeeFallback = (o: any): boolean => {
  const raw = (o['สถานะการสั่งซื้อ'] ?? o['สถานะ'] ?? '').toString().trim().toLowerCase();
  return new Set(['ยกเลิก', 'ถูกยกเลิก', 'cancel', 'canceled', 'cancelled']).has(raw);
};

const getShopeeOrderIdSafe = (o: any): string => {
  return (o['รหัสการสั่งซื้อ'] ?? o['เลขที่คำสั่งซื้อ'] ?? '').toString();
};

const parseNumber = (v: any): number => {
  if (v === undefined || v === null) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

// net → orderTotal → itemTotal
const pickCommissionFromAgg = (agg: {
  itemTotalSum: number;
  orderTotalCandidates: number[];
  netCandidates: number[];
}): number => {
  const bestNet = Math.max(0, ...agg.netCandidates);
  if (bestNet > 0) return bestNet;
  const bestOrder = Math.max(0, ...agg.orderTotalCandidates);
  if (bestOrder > 0) return bestOrder;
  return agg.itemTotalSum;
};
/* ------------------------------------------------------------- */

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
    // ✅ ถ้าส่ง dailyMetrics (จาก analyzeDailyBreakdownStable) มาแล้ว ให้ใช้เลย
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

    // -------------------- Fallback (ให้ผลตรงสูตร Shopee) --------------------
    let filteredShopee = (shopeeOrders || []).filter(o => !isCanceledShopeeFallback(o));
    let filteredLazada = (lazadaOrders || []);
    let filteredAds = (facebookAds || []);

    // Filter by Sub IDs (ลองหลายชื่อคอลัมน์ที่เจอทั่วไป)
    if (selectedSubIds.length > 0) {
      const toSet = new Set(selectedSubIds.filter(Boolean));
      const match = (v?: string) => v && toSet.has(v);
      filteredShopee = filteredShopee.filter(o =>
        [o['Sub_id1'], o['Sub_id2'], o['Sub_id3'], o['Sub_id4'], o['Sub_id5'], o['Sub ID']]
          .some(match as any)
      );
      filteredLazada = filteredLazada.filter(o =>
        [o['Aff Sub ID'], o['Sub ID 1'], o['Sub ID 2'], o['Sub ID 3'], o['Sub ID 4'], o['Sub ID']]
          .some(match as any)
      );
      filteredAds = filteredAds.filter(ad => match(ad['Sub ID'] || ad['SubID']));
    }

    // Filter by Channels (Shopee เท่านั้น)
    if (selectedChannels.length > 0) {
      const set = new Set(selectedChannels.filter(Boolean));
      filteredShopee = filteredShopee.filter(o => set.has(o['ช่องทาง'] || o['Channel'] || ''));
    }

    // Filter by Platform
    if (selectedPlatform !== "all") {
      if (selectedPlatform.toLowerCase() === "shopee") {
        filteredLazada = [];
      } else if (selectedPlatform.toLowerCase() === "lazada") {
        filteredShopee = [];
      }
    }

    // สร้างช่วงวันที่
    let startDate: Date, endDate: Date;
    if (dateRange?.from && dateRange?.to) {
      startDate = new Date(dateRange.from);
      endDate = new Date(dateRange.to);
    } else {
      const allDates: string[] = [];
      filteredAds.forEach(ad => {
        const k = parseDateKeyLoose(ad['Day'] || ad['Date']);
        if (k !== 'Unknown') allDates.push(k);
      });
      filteredShopee.forEach(o => {
        const k = parseDateKeyLoose(o['เวลาที่สั่งซื้อ'] || o['วันที่สั่งซื้อ']);
        if (k !== 'Unknown') allDates.push(k);
      });
      filteredLazada.forEach(o => {
        const k = parseDateKeyLoose(o['Conversion Time'] || o['Order Time']);
        if (k !== 'Unknown') allDates.push(k);
      });
      if (allDates.length === 0) return [];
      const min = allDates.reduce((a, b) => (a < b ? a : b));
      const max = allDates.reduce((a, b) => (a > b ? a : b));
      startDate = new Date(min);
      endDate = new Date(max);
    }

    // เตรียม dataMap
    const dataMap = new Map<string, {
      date: string;
      adSpend: number;
      totalCom: number;
      totalProfit: number;
      overallROI: number;
    }>();
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${d}`;
      dataMap.set(key, { date: key, adSpend: 0, totalCom: 0, totalProfit: 0, overallROI: 0 });
      cur.setDate(cur.getDate() + 1);
    }

    // Ads → adSpend
    filteredAds.forEach(ad => {
      const key = parseDateKeyLoose(ad['Day'] || ad['Date']);
      if (key !== 'Unknown') {
        const row = dataMap.get(key);
        if (row) row.adSpend += parseNumber(ad['Amount spent (THB)']);
      }
    });

    // Shopee → รวม “ต่อออเดอร์”
    const shpAgg = new Map<string, { dateKey: string; itemTotalSum: number; orderTotalCandidates: number[]; netCandidates: number[] }>();
    filteredShopee.forEach(o => {
      const id = getShopeeOrderIdSafe(o);
      if (!id) return;
      const agg =
        shpAgg.get(id) ||
        { dateKey: parseDateKeyLoose(o['เวลาที่สั่งซื้อ'] || o['วันที่สั่งซื้อ']), itemTotalSum: 0, orderTotalCandidates: [], netCandidates: [] };
      agg.itemTotalSum += parseNumber(o['คอมมิชชั่นสินค้าโดยรวม(฿)']);
      const ot = parseNumber(o['คอมมิชชั่นคำสั่งซื้อโดยรวม(฿)']);
      const nt = parseNumber(o['ค่าคอมมิชชั่นสุทธิ(฿)']);
      if (ot > 0) agg.orderTotalCandidates.push(ot);
      if (nt > 0) agg.netCandidates.push(nt);
      shpAgg.set(id, agg);
    });
    shpAgg.forEach(agg => {
      const key = agg.dateKey || "Unknown";
      if (key === "Unknown") return;
      const row = dataMap.get(key);
      if (row) row.totalCom += pickCommissionFromAgg(agg);
    });

    // Lazada → unique by Check Out ID
    const lzdUnique = new Map<string, any>();
    filteredLazada.forEach(o => {
      const id = o['Check Out ID'];
      if (id && !lzdUnique.has(id)) lzdUnique.set(id, o);
    });
    Array.from(lzdUnique.values()).forEach(o => {
      const key = parseDateKeyLoose(o['Conversion Time'] || o['Order Time']);
      if (key === "Unknown") return;
      const row = dataMap.get(key);
      if (row) row.totalCom += parseNumber(o['Commission'] ?? o['Payout']);
    });

    // สรุปผล
    const result = Array.from(dataMap.values()).map(r => {
      r.totalProfit = r.totalCom - r.adSpend;
      r.overallROI = r.adSpend > 0 ? (r.totalProfit / r.adSpend) * 100 : 0;
      return { ...r, displayDate: format(new Date(r.date), 'MM/dd') };
    });

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyMetrics, shopeeOrders, lazadaOrders, facebookAds, dateRange, selectedSubIds, selectedChannels, selectedPlatform]);

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
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
                tickFormatter={(value) => `${(value as number).toFixed(1)}%`}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'Overall ROI') return [`${value.toFixed(1)}%`, name];
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
              <Line yAxisId="currency" type="monotone" dataKey="adSpend" stroke="#ef4444" strokeWidth={2} name="Ad Spend" dot={{ fill: '#ef4444' }} />
              <Line yAxisId="currency" type="monotone" dataKey="totalCom" stroke="#10b981" strokeWidth={2} name="Total Com" dot={{ fill: '#10b981' }} />
              <Line yAxisId="currency" type="monotone" dataKey="totalProfit" stroke="#3b82f6" strokeWidth={2} name="Total Profit" dot={{ fill: '#3b82f6' }} />
              <Line yAxisId="percentage" type="monotone" dataKey="overallROI" stroke="#8b5cf6" strokeWidth={2} name="Overall ROI" dot={{ fill: '#8b5cf6' }} />
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
