
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
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronUp, ChevronDown, Target, Download } from "lucide-react";

interface SubIdTableProps {
  shopeeOrders: any[];
  lazadaOrders: any[];
  facebookAds: any[];
  selectedSubIds?: string[];
  selectedChannels?: string[];
  selectedPlatform?: string;
  dateRange?: any;
}

interface SubIdData {
  subid: string;
  adSpend: number;
  totalCom: number;
  totalProfit: number;
  overallROI: number;
  comSP: number;
  comLZD: number;
  orderSP: number;
  orderLZD: number;
  cpoSP: number;
  amountLZD: number;
}

type SortField = keyof SubIdData;
type SortDirection = 'asc' | 'desc';

export default function SubIdTable({ 
  shopeeOrders, 
  lazadaOrders, 
  facebookAds,
  selectedSubIds = [],
  selectedChannels = [],
  selectedPlatform = "all",
  dateRange
}: SubIdTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('adSpend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;

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

  const exportToCSV = () => {
    const headers = ['Sub ID', 'Ad Spend', 'Total Com', 'Total Profit', 'Overall ROI (%)', 'Com SP', 'Com LZD', 'Order SP', 'Order LZD', 'CPO SP', 'Amount LZD'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(item => [
        `"${item.subid}"`,
        item.adSpend,
        item.totalCom,
        item.totalProfit,
        item.overallROI.toFixed(2),
        item.comSP,
        item.comLZD,
        item.orderSP,
        item.orderLZD,
        item.cpoSP,
        item.amountLZD
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sub_id_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const subIdData = useMemo(() => {
    // Apply filters to data first
    let filteredShopeeOrders = shopeeOrders;
    let filteredLazadaOrders = lazadaOrders;
    let filteredFacebookAds = facebookAds;

    // Filter by Sub IDs
    if (selectedSubIds.length > 0) {
      filteredShopeeOrders = filteredShopeeOrders.filter(order => 
        selectedSubIds.includes(order['Sub ID'] || order['SubID'] || '') ||
        selectedSubIds.some(subId => 
          [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
            .includes(subId)
        )
      );
      filteredLazadaOrders = filteredLazadaOrders.filter(order => 
        selectedSubIds.includes(order['Sub ID'] || order['SubID'] || '') ||
        selectedSubIds.some(subId => 
          [order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'], order['Sub ID 3'], order['Sub ID 4']]
            .includes(subId)
        )
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

    // Initialize with filtered Facebook Ads data
    filteredFacebookAds.forEach(ad => {
      const campaignName = ad['Campaign name'] || '';
      const adSetName = ad['Ad set name'] || '';
      const adName = ad['Ad name'] || '';
      const adSpend = parseNumber(ad['Amount spent (THB)']);
      
      const allNames = `${campaignName} ${adSetName} ${adName}`.toLowerCase();
      
      // Find matching subid from orders
      let matchingSubId = 'NoSubID';
      
      // Check filtered Shopee orders
      filteredShopeeOrders.forEach(order => {
        const subIds = [
          order['Sub_id1'], order['Sub_id2'], order['Sub_id3'],
          order['Sub_id4'], order['Sub_id5']
        ].filter(subId => subId && typeof subId === 'string' && subId.trim() !== '');
        
        subIds.forEach(subId => {
          if (allNames.includes(subId.toLowerCase())) {
            matchingSubId = subId;
          }
        });
      });
      
      // Check filtered Lazada orders if not found in Shopee
      if (matchingSubId === 'NoSubID') {
        filteredLazadaOrders.forEach(order => {
          const subIds = [
            order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'],
            order['Sub ID 3'], order['Sub ID 4']
          ].filter(subId => subId && typeof subId === 'string' && subId.trim() !== '');
          
          subIds.forEach(subId => {
            if (allNames.includes(subId.toLowerCase())) {
              matchingSubId = subId;
            }
          });
        });
      }

      if (!subIdMap[matchingSubId]) {
        subIdMap[matchingSubId] = {
          subid: matchingSubId,
          adSpend: 0,
          totalCom: 0,
          totalProfit: 0,
          overallROI: 0,
          comSP: 0,
          comLZD: 0,
          orderSP: 0,
          orderLZD: 0,
          cpoSP: 0,
          amountLZD: 0,
        };
      }
      
      subIdMap[matchingSubId].adSpend += adSpend;
    });

    // Shopee: นับ orderSP แบบ unique order id ต่อ SubId
    const subIdOrderSet: { [subId: string]: Set<string> } = {};
    filteredShopeeOrders.forEach(order => {
      const subIds = [
        order['Sub_id1'], order['Sub_id2'], order['Sub_id3'],
        order['Sub_id4'], order['Sub_id5']
      ].filter(subId => subId && typeof subId === 'string' && subId.trim() !== '');
      const orderId = order['เลขที่คำสั่งซื้อ'];
      const commission = parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
      subIds.forEach(subId => {
        if (!subIdMap[subId]) {
          subIdMap[subId] = {
            subid: subId,
            adSpend: 0,
            totalCom: 0,
            totalProfit: 0,
            overallROI: 0,
            comSP: 0,
            comLZD: 0,
            orderSP: 0,
            orderLZD: 0,
            cpoSP: 0,
            amountLZD: 0,
          };
        }
        subIdMap[subId].comSP += commission;
        subIdMap[subId].totalCom += commission;
        // นับ order เฉพาะ order id ที่ไม่ซ้ำ
        if (!subIdOrderSet[subId]) subIdOrderSet[subId] = new Set();
        subIdOrderSet[subId].add(orderId);
      });
    });
    // สรุปจำนวน orderSP ต่อ SubId
    Object.keys(subIdOrderSet).forEach(subId => {
      subIdMap[subId].orderSP = subIdOrderSet[subId].size;
    });

    // Add filtered Lazada commission data
    filteredLazadaOrders.forEach(order => {
      const subIds = [
        order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'],
        order['Sub ID 3'], order['Sub ID 4']
      ].filter(subId => subId && typeof subId === 'string' && subId.trim() !== '');
      
      const commission = parseNumber(order['Payout']);
      const amount = parseNumber(order['Order Amount']);
      
      subIds.forEach(subId => {
        if (!subIdMap[subId]) {
          subIdMap[subId] = {
            subid: subId,
            adSpend: 0,
            totalCom: 0,
            totalProfit: 0,
            overallROI: 0,
            comSP: 0,
            comLZD: 0,
            orderSP: 0,
            orderLZD: 0,
            cpoSP: 0,
            amountLZD: 0,
          };
        }
        
        subIdMap[subId].comLZD += commission;
        subIdMap[subId].totalCom += commission;
        subIdMap[subId].orderLZD += 1;
        subIdMap[subId].amountLZD += amount;
      });
    });

    // Calculate derived metrics for all SubIDs
    Object.values(subIdMap).forEach(data => {
      data.totalProfit = data.totalCom - data.adSpend;
      data.overallROI = data.adSpend > 0 ? (data.totalProfit / data.adSpend) * 100 : 0;
      data.cpoSP = data.orderSP > 0 ? data.adSpend / data.orderSP : 0;
    });

    // Separate SubIDs with and without ad spend
    const withAdsSubIds: SubIdData[] = [];
    const noAdsSubIds: SubIdData[] = [];
    
    Object.values(subIdMap).forEach(data => {
      if (data.adSpend > 0) {
        withAdsSubIds.push(data);
      } else if (data.totalCom > 0) { // Only include SubIDs that have commission data
        noAdsSubIds.push(data);
      }
    });

    // Show individual SubIDs without ad spend instead of grouping them
    const result = [...withAdsSubIds, ...noAdsSubIds];

    return result;
  }, [shopeeOrders, lazadaOrders, facebookAds, selectedSubIds, selectedChannels, selectedPlatform, dateRange]);

  const sortedData = useMemo(() => {
    return [...subIdData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [subIdData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
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
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-400" />
              Top SubID
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              แสดง {Math.min(itemsPerPage, sortedData.length - (currentPage - 1) * itemsPerPage)} จาก {sortedData.length} รายการ
              {totalPages > 1 && ` (หน้า ${currentPage} จาก ${totalPages})`}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead><SortButton field="subid">SubID</SortButton></TableHead>
                <TableHead><SortButton field="adSpend">Ad Spend</SortButton></TableHead>
                <TableHead><SortButton field="totalCom">Total Com</SortButton></TableHead>
                <TableHead><SortButton field="totalProfit">Total Profit</SortButton></TableHead>
                <TableHead><SortButton field="overallROI">Overall ROI</SortButton></TableHead>
                <TableHead><SortButton field="comSP">Com SP</SortButton></TableHead>
                <TableHead><SortButton field="comLZD">Com LZD</SortButton></TableHead>
                <TableHead><SortButton field="orderSP">Order SP</SortButton></TableHead>
                <TableHead><SortButton field="orderLZD">Order LZD</SortButton></TableHead>
                <TableHead><SortButton field="cpoSP">CPO SP</SortButton></TableHead>
                <TableHead><SortButton field="amountLZD">Amount LZD</SortButton></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={`${item.subid}-${index}`} className="hover:bg-secondary/20">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.adSpend === 0 && item.totalCom > 0 && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30">
                          No Ads
                        </span>
                      )}
                      <span>{item.subid}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-red-400">{formatCurrency(item.adSpend)}</TableCell>
                  <TableCell className="text-green-400">{formatCurrency(item.totalCom)}</TableCell>
                  <TableCell className="text-blue-400">{formatCurrency(item.totalProfit)}</TableCell>
                  <TableCell className={item.overallROI >= 0 ? "text-green-400" : "text-red-400"}>
                    {item.adSpend > 0 ? `${item.overallROI.toFixed(1)}%` : '-'}
                  </TableCell>
                  <TableCell>{formatCurrency(item.comSP)}</TableCell>
                  <TableCell>{formatCurrency(item.comLZD)}</TableCell>
                  <TableCell className="text-center">{item.orderSP}</TableCell>
                  <TableCell className="text-center">{item.orderLZD}</TableCell>
                  <TableCell>{item.adSpend > 0 ? formatCurrency(item.cpoSP) : '-'}</TableCell>
                  <TableCell>{formatCurrency(item.amountLZD)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
