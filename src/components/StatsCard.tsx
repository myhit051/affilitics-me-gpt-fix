
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon?: ReactNode;
  colorClass?: string;
  animationDelay?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  colorClass = "from-blue-500/20 to-blue-600/5",
  animationDelay = "0ms"
}: StatsCardProps) {
  const isPositive = change >= 0;
  
  // Get metric description based on title
  const getMetricDescription = (title: string) => {
    switch (title) {
      case 'Ad Spend': return 'ยอดใช้จ่ายโฆษณารวม';
      case 'Total Com': return 'ค่าคอมมิชชั่นรวมทั้งหมด';
      case 'Total Profit': return 'กำไรสุทธิหลังหักค่าโฆษณา';
      case 'Overall ROI': return 'อัตราผลตอบแทนการลงทุน';
      case 'Com SP': return 'ค่าคอมมิชชั่น Shopee';
      case 'Com LZD': return 'ค่าคอมมิชชั่น Lazada';
      case 'Order SP': return 'จำนวนออเดอร์ Shopee';
      case 'Order LZD': return 'จำนวนออเดอร์ Lazada';
      case 'CPO SP': return 'ต้นทุนต่อออเดอร์ Shopee';
      case 'Amount LZD': return 'ยอดขาย Lazada';
      case 'CPC Link': return 'ต้นทุนต่อคลิก';
      case 'APC LZD': return 'ยอดขายเฉลี่ยต่อค่าโฆษณา';
      default: return 'เมตริกประสิทธิภาพ';
    }
  };
  
  return (
    <div 
      className={`modern-card relative overflow-hidden bg-gradient-to-br ${colorClass} p-6 animate-scale-in hover:scale-105 transition-all duration-300`}
      style={{ animationDelay }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        
        {change !== 0 && (
          <div className={cn(
            "flex items-center text-xs font-medium",
            isPositive ? "text-green-500" : "text-red-500"
          )}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {getMetricDescription(title)}
        </p>
      </div>
    </div>
  );
}
