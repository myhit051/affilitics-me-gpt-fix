
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ChevronUp, ChevronDown } from "lucide-react";

interface TopAdsSpentTableProps {
  facebookAds: any[];
  shopeeOrders: any[];
  lazadaOrders: any[];
  selectedSubIds?: string[];
  selectedChannels?: string[];
  selectedPlatform?: string;
  dateRange?: any;
}

interface SubIdData {
  subId: string;
  adSpend: number;
  totalCom: number;
  totalProfit: number;
  cpoSP: number;
  amountLZD: number;
  totalOrder: number; // เพิ่ม property นี้
}

type SortField = keyof SubIdData;
type SortDirection = 'asc' | 'desc';

export default function TopAdsSpentTable({ 
  facebookAds, 
  shopeeOrders, 
  lazadaOrders,
  selectedSubIds = [],
  selectedChannels = [],
  selectedPlatform = "all",
  dateRange
}: TopAdsSpentTableProps) {
  const [sortField, setSortField] = useState<SortField>('adSpend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const subIdData = useMemo(() => {
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
      
      filteredFacebookAds = filteredFacebookAds.filter(ad => {
        const adDate = new Date(ad['Day'] || ad['Date']);
        return adDate >= startDate && adDate <= endDate;
      });
    }

    const subIdMap: { [key: string]: SubIdData } = {};
    
    // Get all SubIDs from filtered orders and Facebook ads
    const allSubIds = new Set<string>();
    
    // From filtered Shopee orders
    filteredShopeeOrders.forEach(order => {
      [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
        .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '')
        .forEach(subId => allSubIds.add(subId));
    });
    
    // From filtered Lazada orders
    filteredLazadaOrders.forEach(order => {
      [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']]
        .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '')
        .forEach(subId => allSubIds.add(subId));
    });

    // Initialize SubID data
    allSubIds.forEach(subId => {
      subIdMap[subId] = {
        subId,
        adSpend: 0,
        totalCom: 0,
        totalProfit: 0,
        cpoSP: 0,
        amountLZD: 0,
        totalOrder: 0, // Initialize totalOrder
      };
    });

    // Calculate ad spend from filtered Facebook Ads
    filteredFacebookAds.forEach(ad => {
      const campaignName = ad['Campaign name'] || '';
      const adSetName = ad['Ad set name'] || '';
      const adName = ad['Ad name'] || '';
      const adSpend = parseNumber(ad['Amount spent (THB)']);
      
      const allNames = `${campaignName} ${adSetName} ${adName}`.toLowerCase();
      
      allSubIds.forEach(subId => {
        if (subId && typeof subId === 'string' && allNames.includes(subId.toLowerCase()) && subIdMap[subId]) {
          subIdMap[subId].adSpend += adSpend;
        }
      });
    });

    // Shopee: นับ totalOrder แบบ unique order id ต่อ SubId
    const subIdOrderSet: { [subId: string]: Set<string> } = {};
    filteredShopeeOrders.forEach(order => {
      const subIds = [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
        .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '');
      const orderId = order['เลขที่คำสั่งซื้อ'];
      const commission = parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
      subIds.forEach(subId => {
        if (!subIdMap[subId]) {
          subIdMap[subId] = {
            subId: subId,
            adSpend: 0,
            totalCom: 0,
            totalProfit: 0,
            cpoSP: 0,
            amountLZD: 0,
            totalOrder: 0,
          };
        }
        subIdMap[subId].totalCom += commission;
        // นับ order เฉพาะ order id ที่ไม่ซ้ำ
        if (!subIdOrderSet[subId]) subIdOrderSet[subId] = new Set();
        subIdOrderSet[subId].add(orderId);
      });
    });
    // สรุปจำนวน totalOrder ต่อ SubId
    Object.keys(subIdOrderSet).forEach(subId => {
      subIdMap[subId].totalOrder = subIdOrderSet[subId].size;
    });

    // Calculate CPO SP (Cost Per Order Shopee)
    Object.keys(subIdMap).forEach(subId => {
      if (subIdMap[subId].totalOrder > 0 && subIdMap[subId].adSpend > 0) {
        subIdMap[subId].cpoSP = subIdMap[subId].adSpend / subIdMap[subId].totalOrder;
      }
    });

    // Calculate commission and amount from filtered Lazada (unique orders only)
    const uniqueLazadaOrders = new Map();
    filteredLazadaOrders.forEach(order => {
      const checkoutId = order['Check Out ID'];
      if (!uniqueLazadaOrders.has(checkoutId)) {
        uniqueLazadaOrders.set(checkoutId, order);
      }
    });

    Array.from(uniqueLazadaOrders.values()).forEach(order => {
      const subIds = [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']]
        .filter(subId => subId && typeof subId === 'string' && subId.trim() !== '');
      const com = parseNumber(order['Payout']);
      const amount = parseNumber(order['Order Amount']);
      
      subIds.forEach(subId => {
        if (subIdMap[subId]) {
          subIdMap[subId].totalCom += com / subIds.length;
          subIdMap[subId].amountLZD += amount / subIds.length;
        }
      });
    });

    // Calculate total profit
    Object.keys(subIdMap).forEach(subId => {
      subIdMap[subId].totalProfit = subIdMap[subId].totalCom - subIdMap[subId].adSpend;
    });

    return Object.values(subIdMap);
  }, [facebookAds, shopeeOrders, lazadaOrders]);

  const sortedData = useMemo(() => {
    return [...subIdData]
      .filter(item => item.adSpend > 0) // Only show SubIDs with actual ad spend
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      })
      .slice(0, 10); // Top 10
  }, [subIdData, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </Button>
  );

  return (
    <Card className="glass-panel border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          📈 Top Ads Spent (by Sub ID)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead><SortButton field="subId">Sub ID</SortButton></TableHead>
                <TableHead><SortButton field="adSpend">Ad Spend</SortButton></TableHead>
                <TableHead><SortButton field="totalCom">Total Com</SortButton></TableHead>
                <TableHead><SortButton field="totalProfit">Total Profit</SortButton></TableHead>
                <TableHead><SortButton field="cpoSP">CPO SP</SortButton></TableHead>
                <TableHead><SortButton field="amountLZD">Amount LZD</SortButton></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item, index) => (
                <TableRow key={`${item.subId}-${index}`} className="hover:bg-secondary/20">
                  <TableCell className="font-medium">{item.subId}</TableCell>
                  <TableCell className="text-red-400 font-medium">
                    {formatCurrency(item.adSpend)}
                  </TableCell>
                  <TableCell className="text-green-400 font-medium">
                    {formatCurrency(item.totalCom)}
                  </TableCell>
                  <TableCell className={`font-medium ${item.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(item.totalProfit)}
                  </TableCell>
                  <TableCell className="text-orange-400 font-medium">
                    {formatCurrency(item.cpoSP)}
                  </TableCell>
                  <TableCell className="text-purple-400 font-medium">
                    {formatCurrency(item.amountLZD)}
                  </TableCell>
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    ไม่พบข้อมูล Sub ID ที่มีการยิงแอด
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
