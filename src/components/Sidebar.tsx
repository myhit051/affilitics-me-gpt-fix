
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  LineChart, 
  List, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Wallet,
  BarChart4,
  Star,
  Users,
  Upload,
  Clock,
  Facebook
} from "lucide-react";

interface SidebarLinkProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ 
  icon: Icon, 
  label, 
  active = false, 
  collapsed = false,
  onClick 
}: SidebarLinkProps) => {
  const getActiveStyle = () => {
    if (label.includes("Dashboard")) return "bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-l-2 border-blue-500 text-blue-400";
    if (label.includes("Facebook")) return "bg-gradient-to-r from-blue-600/20 to-blue-700/10 border-l-2 border-blue-600 text-blue-300";
    if (label.includes("Planning")) return "bg-gradient-to-r from-orange-500/20 to-orange-600/10 border-l-2 border-orange-500 text-orange-400";
    if (label.includes("Import")) return "bg-gradient-to-r from-purple-500/20 to-purple-600/10 border-l-2 border-purple-500 text-purple-400";
    if (label.includes("Update")) return "bg-gradient-to-r from-green-500/20 to-green-600/10 border-l-2 border-green-500 text-green-400";
    if (label.includes("Settings")) return "bg-gradient-to-r from-gray-500/20 to-gray-600/10 border-l-2 border-gray-500 text-gray-400";
    return "bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-l-2 border-blue-500 text-blue-400";
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-300 group relative overflow-hidden",
        active 
          ? getActiveStyle() + " font-medium shadow-lg"
          : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white border-l-2 border-transparent",
        collapsed && "justify-center"
      )}
    >
      <Icon size={20} className="relative z-10" />
      {!collapsed && <span className="relative z-10">{label}</span>}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50" />
      )}
    </button>
  );
};

interface SidebarProps {
  className?: string;
  onImportClick?: () => void;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export default function Sidebar({ 
  className, 
  onImportClick, 
  activeView = "dashboard",
  onNavigate 
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleNavigation = (view: string) => {
    if (view === "import") {
      onImportClick?.();
    } else {
      onNavigate?.(view);
    }
  };

  return (
    <div
      className={cn(
        "relative h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-56",
        className
      )}
    >
      <div className="p-4">
        <div className={cn(
          "flex items-center gap-2",
          collapsed && "justify-center"
        )}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <BarChart4 size={18} className="text-white" />
          </div>
          {!collapsed && (
            <h1 className="font-semibold text-xl">
              <span className="luxury-text">Affilitics</span>
              <span className="text-white/80">.me</span>
            </h1>
          )}
        </div>
      </div>

      <div className="absolute top-4 -right-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-6 w-6 rounded-full bg-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="px-2 mt-6 space-y-6">
        <div className="space-y-1">
          <SidebarLink 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeView === "dashboard"}
            collapsed={collapsed}
            onClick={() => handleNavigation("dashboard")}
          />
          <SidebarLink 
            icon={Facebook} 
            label="Facebook Ads Real-Time" 
            active={activeView === "facebook-ads"}
            collapsed={collapsed}
            onClick={() => handleNavigation("facebook-ads")}
          />
          <SidebarLink 
            icon={TrendingUp} 
            label="Ad Planning" 
            active={activeView === "planning"}
            collapsed={collapsed}
            onClick={() => handleNavigation("planning")}
          />
          <SidebarLink 
            icon={Upload} 
            label="Import Data File" 
            active={activeView === "import"}
            collapsed={collapsed}
            onClick={() => handleNavigation("import")}
          />
          <SidebarLink 
            icon={Clock} 
            label="Update History" 
            active={activeView === "update"}
            collapsed={collapsed}
            onClick={() => handleNavigation("update")}
          />
          <SidebarLink 
            icon={Settings} 
            label="Settings" 
            active={activeView === "settings"}
            collapsed={collapsed}
            onClick={() => handleNavigation("settings")}
          />
        </div>

        <div className="pt-4 border-t border-sidebar-border">
          <p className={cn(
            "text-xs uppercase text-sidebar-foreground/60 mb-2 px-3",
            collapsed && "text-center"
          )}>
            {collapsed ? "More" : "Analytics"}
          </p>
          <div className="space-y-1">
            <SidebarLink 
              icon={List} 
              label="Sub ID Analysis" 
              active={false}
              collapsed={collapsed}
              onClick={() => {}}
            />
            <SidebarLink 
              icon={Star} 
              label="Top ROI" 
              active={false}
              collapsed={collapsed}
              onClick={() => {}}
            />
            <SidebarLink 
              icon={LineChart} 
              label="Market Insights" 
              active={false}
              collapsed={collapsed}
              onClick={() => {}}
            />
            <SidebarLink 
              icon={Wallet} 
              label="Portfolios" 
              active={false}
              collapsed={collapsed}
              onClick={() => {}}
            />
            <SidebarLink 
              icon={Users} 
              label="Social Trends" 
              active={false}
              collapsed={collapsed}
              onClick={() => {}}
            />
            <SidebarLink 
              icon={BarChart4} 
              label="Facebook Ads Real-Time" 
              active={activeView === "facebook-ads" || window.location.pathname === "/facebook-ads-api"}
              collapsed={collapsed}
              onClick={() => { window.location.href = "/facebook-ads-api"; }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
