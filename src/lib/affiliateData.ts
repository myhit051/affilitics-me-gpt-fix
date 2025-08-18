
export const affiliateStats = {
  totalRevenue: 127450,
  totalProfit: 45230,
  overallROI: 154.8,
  totalOrders: 342,
  revenueChange: 12.5,
  profitChange: 8.7,
  roiChange: 5.2,
  ordersChange: 15.3,
  totalAdSpend: 29200,
  overallROAS: 436.8
};

export const platformPerformanceData = [
  {
    id: 1,
    platform: "Shopee",
    icon: "🛒",
    orders: 156,
    commission: 48500,
    adSpend: 12000,
    roi: 304.2,
    status: "excellent",
    change: 18.5
  },
  {
    id: 2,
    platform: "Lazada", 
    icon: "🛍️",
    orders: 98,
    commission: 35200,
    adSpend: 8500,
    roi: 314.1,
    status: "good",
    change: 12.3
  },
  {
    id: 3,
    platform: "Facebook Ads",
    icon: "📘",
    orders: 88,
    commission: 43750,
    adSpend: 8700,
    roi: 402.9,
    status: "excellent",
    change: 25.7
  }
];

export const subIdData = [
  { 
    id: 1, 
    subId: "m02Rooftop0623", 
    platform: "Shopee", 
    orders: 15, 
    commission: 4500, 
    adSpend: 3000, 
    roi: 50.0,
    trend: "up",
    level: 1
  },
  { 
    id: 2, 
    subId: "m39Worada1027", 
    platform: "Lazada", 
    orders: 8, 
    commission: 2400, 
    adSpend: 2000, 
    roi: 20.0,
    trend: "down",
    level: 1
  },
  { 
    id: 3, 
    subId: "25625adboostco", 
    platform: "Facebook", 
    orders: 12, 
    commission: 3600, 
    adSpend: 2500, 
    roi: 44.0,
    trend: "stable",
    level: 1
  },
  { 
    id: 4, 
    subId: "beauty_campaign_01", 
    platform: "Shopee", 
    orders: 22, 
    commission: 6800, 
    adSpend: 3500, 
    roi: 94.3,
    trend: "up",
    level: 1
  },
  { 
    id: 5, 
    subId: "electronics_promo", 
    platform: "Lazada", 
    orders: 18, 
    commission: 7200, 
    adSpend: 4000, 
    roi: 80.0,
    trend: "up",
    level: 1
  }
];

export const campaignData = [
  {
    id: 1,
    name: "Beauty Products Q4",
    platform: "Shopee",
    subId: "beauty_campaign_01",
    orders: 22,
    commission: 6800,
    adSpend: 3500,
    roi: 94.3,
    status: "active",
    startDate: "2024-01-15",
    performance: "excellent"
  },
  {
    id: 2,
    name: "Electronics Sale",
    platform: "Lazada",
    subId: "electronics_promo",
    orders: 18,
    commission: 7200,
    adSpend: 4000,
    roi: 80.0,
    status: "active", 
    startDate: "2024-01-20",
    performance: "good"
  },
  {
    id: 3,
    name: "Fashion Winter",
    platform: "Facebook",
    subId: "25625adboostco",
    orders: 12,
    commission: 3600,
    adSpend: 2500,
    roi: 44.0,
    status: "paused",
    startDate: "2024-01-10",
    performance: "average"
  },
  {
    id: 4,
    name: "Home & Living",
    platform: "Shopee",
    subId: "m02Rooftop0623",
    orders: 15,
    commission: 4500,
    adSpend: 3000,
    roi: 50.0,
    status: "active",
    startDate: "2024-01-25",
    performance: "good"
  }
];

export const roiTrendData = [
  { month: 'Oct', shopee: 45, lazada: 38, facebook: 52 },
  { month: 'Nov', shopee: 52, lazada: 42, facebook: 58 },
  { month: 'Dec', shopee: 48, lazada: 45, facebook: 62 },
  { month: 'Jan', shopee: 61, lazada: 48, facebook: 65 },
  { month: 'Feb', shopee: 58, lazada: 52, facebook: 68 },
  { month: 'Mar', shopee: 65, lazada: 55, facebook: 72 }
];
