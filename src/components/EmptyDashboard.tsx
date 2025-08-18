
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, TrendingUp, Target } from "lucide-react";

interface EmptyDashboardProps {
  onImportClick: () => void;
}

export default function EmptyDashboard({ onImportClick }: EmptyDashboardProps) {
  return (
    <div className="relative min-h-[60vh] flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-8 md:grid-cols-12 gap-4 h-full">
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg animate-pulse" 
                 style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <Card className="relative z-10 max-w-2xl mx-auto glass-panel border-2 border-border/50">
        <CardContent className="p-8 text-center space-y-6">
          {/* Hero Icon */}
          <div className="relative">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <BarChart3 size={40} className="text-blue-400" />
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-green-400" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              🚀 เริ่มต้นการวิเคราะห์
            </h2>
            <p className="text-lg text-muted-foreground">
              อัปโหลดข้อมูลของคุณเพื่อเริ่มใช้งาน Analytics Dashboard
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="w-8 h-8 mx-auto mb-2 bg-blue-500/20 rounded-full flex items-center justify-center">
                <BarChart3 size={16} className="text-blue-400" />
              </div>
              <h3 className="font-semibold text-sm">Dashboard Analytics</h3>
              <p className="text-xs text-muted-foreground mt-1">วิเคราะห์ผลงาน Affiliate</p>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="w-8 h-8 mx-auto mb-2 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Target size={16} className="text-purple-400" />
              </div>
              <h3 className="font-semibold text-sm">Ad Planning</h3>
              <p className="text-xs text-muted-foreground mt-1">วางแผนการยิงแอด</p>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
              <div className="w-8 h-8 mx-auto mb-2 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp size={16} className="text-green-400" />
              </div>
              <h3 className="font-semibold text-sm">Performance</h3>
              <p className="text-xs text-muted-foreground mt-1">ติดตามประสิทธิภาพ</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="space-y-4 pt-4">
            <Button 
              onClick={onImportClick}
              size="lg" 
              className="w-full md:w-auto px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25"
            >
              <Upload className="mr-2 h-5 w-5" />
              อัปโหลดข้อมูลเลย
            </Button>
            
            <p className="text-sm text-muted-foreground">
              รองรับไฟล์ CSV สำหรับข้อมูล Shopee, Lazada และ Facebook Ads
            </p>
          </div>

          {/* Stats Preview */}
          <div className="pt-6 border-t border-border/50">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">📊</div>
                <div className="text-xs text-muted-foreground">Dashboard</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">🎯</div>
                <div className="text-xs text-muted-foreground">Planning</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">📈</div>
                <div className="text-xs text-muted-foreground">Analytics</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">⚡</div>
                <div className="text-xs text-muted-foreground">Real-time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
