import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format } from "date-fns";
import { DollarSign } from "lucide-react";

interface ComChartProps {
  // ✅ ต้องส่ง dailyMetrics ที่มาจาก analyzeDailyBreakdownStable()
  dailyMetrics: DailyData[];
  calculatedMetrics?: any;
}

interface DailyData {
  date: string;
  totalCom: number;
  adSpend: number;
  profit: number;
  roi: number;
  // ✅ ใช้คอมมิชชั่นรายวันแยกแพลตฟอร์มจาก utils
  comSP?: number;
  comLZD?: number;
}

interface StatOption {
  key: string;
  label: string;
  color: string;
  dataKey: string;
}

const COM_STAT_OPTIONS: StatOption[] = [
  { key: 'comSP', label: 'Com SP', color: '#f97316', dataKey: 'comSP' },
  { key: 'comLZD', label: 'Com LZD', color: '#a855f7', dataKey: 'comLZD' },
  { key: 'totalCom', label: 'Total Com', color: '#10b981', dataKey: 'totalCom' },
];

export default function ComChart({ dailyMetrics }: ComChartProps) {
  const [selectedStats, setSelectedStats] = useState<string[]>(['comSP', 'comLZD', 'totalCom']);

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // ✅ ไม่แบ่งสัดส่วนจากยอดรวมอีกต่อไป — ใช้ค่าจริงจาก utils
  const chartData = useMemo(() => {
    return (dailyMetrics || []).map(day => {
      const comSP = Number(day.comSP ?? 0);
      const comLZD = Number(day.comLZD ?? 0);
      const totalCom = Number(day.totalCom ?? (comSP + comLZD));
      return {
        date: day.date,
        comSP,
        comLZD,
        totalCom
      };
    });
  }, [dailyMetrics]);

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
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-white">
          <DollarSign className="h-5 w-5 text-green-400" />
          💰 Com Chart
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          คลิกที่ StatCard เพื่อเพิ่ม/ลบจากกราฟ (แสดงความสัมพันธ์ระหว่างตัวแปร)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stat Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COM_STAT_OPTIONS.map((stat) => (
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
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stat.color }} />
                  <span className="font-medium text-white">{stat.label}</span>
                </div>
                <Checkbox
                  checked={selectedStats.includes(stat.key)}
                  onChange={() => handleStatToggle(stat.key)}
                />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(
                    chartData.reduce((sum, day) => sum + (day[stat.dataKey as keyof typeof day] as number), 0)
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {selectedStats.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {COM_STAT_OPTIONS.map((stat) =>
                  selectedStats.includes(stat.key) && (
                    <Line
                      key={stat.key}
                      type="monotone"
                      dataKey={stat.dataKey}
                      stroke={stat.color}
                      strokeWidth={2}
                      dot={{ fill: stat.color, strokeWidth: 2, r: 4 }}
                      name={stat.label}
                    />
                  )
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-muted-foreground">
            <p>เลือกอย่างน้อย 1 ตัวแปรเพื่อแสดงกราฟ</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
